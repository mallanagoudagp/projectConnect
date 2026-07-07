// Single source of truth for the FastAPI backend's base URL.
// Falls back to localhost only for local development.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
