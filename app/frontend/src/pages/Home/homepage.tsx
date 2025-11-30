import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useMatch } from '../../contexts/MatchContext'
import './homepage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, player } = useAuth()
  const { isSearching, queuePosition, queueEta, findMatch, cancelSearch } = useMatch()

  const username = useMemo(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null
    return stored && stored.trim().length > 0 ? stored : 'Player'
  }, [isAuthenticated, player])

  // preferences must exist before callbacks that capture them
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [timeLimit, setTimeLimit] = useState<number>(10)

  const onJoinQueue = useCallback(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    findMatch()  //call the actual matchmaking system
  }, [isAuthenticated, navigate, findMatch])



  return (
    <div className="home-container">
      <div className="home-shell">
        <aside className="left-nav">
          <div className="left-nav-list">
            <button className="left-nav-item" onClick={() => document.getElementById('recent-games')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="2"><path d="M9 17v-6l7-3"/></svg>
              </span>
              <span>Game History</span>
            </button>
            <button className="left-nav-item" onClick={() => document.getElementById('social')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>
              </span>
              <span>Social</span>
            </button>
            <button className="left-nav-item" onClick={() => document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="2"><path d="M8 21V9m4 12V3m4 18v-6"/></svg>
              </span>
              <span>Leaderboard</span>
            </button>

          </div>
          <div className="left-nav-spacer" />
          <div className="left-auth">
            <button className="left-nav-item left-nav-cta" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="left-nav-item left-nav-cta" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
          <button className="left-nav-item settings" title="Settings (coming soon)">
            <span className="left-nav-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="2"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            </span>
            <span>Settings</span>
          </button>
        </aside>
        <div className="home-grid">
        <section className="profile-card">
          <div className="profile-header">
            <div className="avatar">{username.slice(0, 1).toUpperCase()}</div>
            <div className="profile-meta">
              <div className="profile-name">{username}</div>
              <div className="profile-sub">1200 • W 0 / L 0</div>
            </div>
          </div>
        </section>

        <section className="card start-card">
          <div className="option-group" role="group" aria-label="Difficulty">
            <span className="option-label">Difficulty:</span>
            <div className="difficulty-row">
            <button
              className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
              aria-pressed={difficulty === 'easy'}
              onClick={() => setDifficulty('easy')}
              type="button"
            >
              Easy
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
              aria-pressed={difficulty === 'medium'}
              onClick={() => setDifficulty('medium')}
              type="button"
            >
              Medium
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
              aria-pressed={difficulty === 'hard'}
              onClick={() => setDifficulty('hard')}
              type="button"
            >
              Hard
            </button>
            </div>
          </div>
          <div className="option-group" role="group" aria-label="Time">
            <span className="option-label">Time:</span>
            <div className="difficulty-row">
              <button
                className={`difficulty-btn ${timeLimit === 10 ? 'active' : ''}`}
                aria-pressed={timeLimit === 10}
                onClick={() => setTimeLimit(10)}
                type="button"
              >
                10 min
              </button>
              <button
                className={`difficulty-btn ${timeLimit === 20 ? 'active' : ''}`}
                aria-pressed={timeLimit === 20}
                onClick={() => setTimeLimit(20)}
                type="button"
              >
                20 min
              </button>
              <button
                className={`difficulty-btn ${timeLimit === 30 ? 'active' : ''}`}
                aria-pressed={timeLimit === 30}
                onClick={() => setTimeLimit(30)}
                type="button"
              >
                30 min
              </button>
            </div>
          </div>
          <div className="start-cta-row">
            <button className="start-cta-gold" onClick={onJoinQueue} type="button" disabled={isSearching}>
              {isSearching ? (
                <>
                  <span className="spinner-small"></span>
                  Searching...
                </>
              ) : (
                'Find a Match'
              )}
            </button>
            {isSearching && queuePosition !== null && (
                <div className="queue-status">
                  <div className="queue-position">
                    <span className="queue-label">Queue Position:</span>
                    <span className="queue-value">#{queuePosition}</span>
                  </div>
                  {queueEta && (
                    <div className="queue-eta">
                      <span className="queue-label">Est. wait:</span>
                      <span className="queue-value">{queueEta}s</span>
                    </div>
                  )}
                </div>
              )}
              {isSearching && (
                <button 
                  className="cancel-search-btn" 
                  onClick={cancelSearch}
                  type="button"
                >
                  Cancel Search
                </button>
              )}
          </div>
        </section>

        </div>
      </div>
    </div>
  )
}


