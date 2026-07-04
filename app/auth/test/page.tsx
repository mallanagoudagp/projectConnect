"use client"

export default function TestLogin() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Simple Login Test</h1>
      <button onClick={() => window.location.href = '/parent/dashboard'}>
        Go to Parent Dashboard
      </button>
    </div>
  )
}
