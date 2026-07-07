"""
auth_dependency.py — FastAPI dependencies for verifying Supabase JWT tokens.

The frontend (lib/auth-context.tsx) already holds a valid Supabase access token
after login. This module verifies that token directly, using the Supabase project's
JWT_SECRET (HS256), so no second token system is needed.

NOTE: backend/app/routes/auth.py issues a separate custom JWT that is NOT used
by the live frontend. It is left untouched here and flagged as a candidate for
removal in a separate cleanup step.

Required environment variable:
  SUPABASE_JWT_SECRET — found in Supabase dashboard → Settings → API → JWT Secret
"""

import os
import jwt
from fastapi import Header, HTTPException, Depends
from typing import Optional, Callable

import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException, Depends
from typing import Optional, Callable

# Load configuration from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# Initialize the JWK client globally if a Supabase URL is available.
# This automatically fetches and caches the public keys from Supabase's JWKS endpoint.
jwks_client = None
if SUPABASE_URL:
    # Ensure URL is clean and points to the auth well-known endpoint
    base_url = SUPABASE_URL.rstrip("/")
    jwks_url = f"{base_url}/auth/v1/.well-known/jwks.json"
    jwks_client = PyJWKClient(jwks_url)


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Extracts and verifies the Supabase Bearer token from the Authorization header.
    Supports asymmetric ES256 (via JWKS) and symmetric HS256 (via JWT Secret).
    Returns a dict with { user_id, email, role } from the token's claims.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or malformed Authorization header. Expected: Bearer <token>"
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        # Path A: Asymmetric verification using JWKS (required for ECC/ES256)
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience="authenticated",
            )
        # Path B: Symmetric verification using static secret (for older HS256 setups)
        elif SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Server misconfiguration: neither SUPABASE_URL nor SUPABASE_JWT_SECRET is set."
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")

    # Extract claims
    user_metadata = payload.get("user_metadata", {}) or {}
    app_metadata = payload.get("app_metadata", {}) or {}
    role = (
        user_metadata.get("role")
        or app_metadata.get("role")
        or payload.get("role")
        or "authenticated"
    )

    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "role": role,
    }


def require_role(*allowed_roles: str) -> Callable:
    """
    FastAPI dependency factory that checks if the authenticated user has one of the allowed roles.
    """
    def dependency(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role(s): {list(allowed_roles)}. Your role: {user['role']}"
            )
        return user
    return dependency
