import type { MouseEvent } from 'react'
import './LoginPage.css'

export default function LoginPage() {
  const onGoogleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    // Google OAuth not implemented yet
  }
  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Continue with Google to sign in.</p>
        <button onClick={onGoogleClick} aria-label="Continue with Google" className="auth-google">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 31.9 29.3 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 3.1 29.6 1 24 1 11.8 1 2 10.8 2 23s9.8 22 22 22 22-9.8 22-22c0-1.5-.2-3-.4-4.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.8 18.8 14 24 14c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 7.1 29.6 5 24 5c-7.4 0-13.7 4.1-17 10z"/>
            <path fill="#4CAF50" d="M24 43c5.2 0 10-2 13.5-5.2l-6.2-5.1C29.2 34.5 26.7 35 24 35c-5.3 0-9.7-3.1-11.5-7.5l-6.6 5C10.3 38.9 16.6 43 24 43z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3.3 5.1-6.1 6.4l6.2 5.1C37.6 36.8 40 32.1 40 26c0-1.5-.2-3-.4-4.5z"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}


