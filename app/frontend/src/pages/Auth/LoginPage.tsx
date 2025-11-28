import './LoginPage.css'

export default function LoginPage() {
  return (
    <div className="login-container">
      <form className="login-card" onSubmit={(e) => e.preventDefault()}>
        <h1 className="login-title">Log in</h1>
        <div className="field">
          <label className="field-label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" className="auth-input" required />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="login-password">Password</label>
          <input id="login-password" type="password" className="auth-input" required />
        </div>
        <button type="submit" className="auth-submit" disabled>
          Continue
        </button>
      </form>
    </div>
  )
}


