"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SimpleParentLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleLogin() {
    setLoading(true)
    // Simulate login
    setTimeout(() => {
      setLoading(false)
      router.push("/parent/dashboard")
    }, 1000)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '30px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '20px', color: '#1f2937' }}>
          👪 Parent Login
        </h1>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@example.com"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#374151' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading || !email || !password ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? "Signing in..." : "Sign In as Parent"}
        </button>

        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          <p>
            No parent account?{" "}
            <Link href="/auth/signup" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Create one
            </Link>
          </p>
          <div style={{ marginTop: '10px' }}>
            <Link href="/auth/student" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Student Login
            </Link>
            {" • "}
            <Link href="/auth/builder" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Builder Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
