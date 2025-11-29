import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()


  const handleLogin = async (e: React.FormEvent) => {
    //auth stuff goes here maybe probably idk
  }


  return (
    <div className="login-container">
      <form className="login-card" onSubmit={(e) => e.preventDefault()}>
        <h1 className="login-title">Log in</h1>
        <div className="field">
          <label className="field-label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" className="auth-input" required onChange={(e) => setEmail(e.target.value)} value={email} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="login-password">Password</label>
          <input id="login-password" type="password" className="auth-input" required onChange={(e) => setPassword(e.target.value)} value={password} />
        </div>
        <button type="submit" className="auth-submit" disabled={loading} onClick={handleLogin}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}


