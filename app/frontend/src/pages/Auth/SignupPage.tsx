import './SignupPage.css'

export default function SignupPage() {
  return (
    <div className="signup-container">
      <form className="signup-card" onSubmit={(e) => e.preventDefault()}>
        <h1 className="signup-title">Create your account</h1>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-username">Username</label>
          <input id="signup-username" type="text" className="auth-input" required />
        </div>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-email">Email</label>
          <input id="signup-email" type="email" className="auth-input" required />
        </div>
        <div className="field">
          <label className="signup-sub" htmlFor="signup-password">Password</label>
          <input id="signup-password" type="password" className="auth-input" required />
        </div>
        <button type="submit" className="auth-submit" disabled>
          Create account
        </button>
      </form>
    </div>
  )
}


