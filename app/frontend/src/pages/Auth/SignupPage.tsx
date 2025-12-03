import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './SignupPage.css'

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      // Success! Redirect or show success message
      alert('Account created successfully.')

      navigate('/login')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={(e) => e.preventDefault()}>
        <h1 className="signup-title">Create your account</h1>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-username">Username</label>
          <input id="signup-username" type="text" className="auth-input" required value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" className="auth-input" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" className="auth-input" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="auth-submit" onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
        <div style={{ marginTop: 12, textAlign: 'center', color: '#bdbdbd' }}>
          <span>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Log in here</Link>
        </div>
      </form>
    </div>
  )
}


