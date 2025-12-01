import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useMatch } from '../../contexts/MatchContext'
import './homepage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout, token } = useAuth()   
  const { isSearching, queuePosition, queueEta, findMatch, cancelSearch } = useMatch()

  const username = useMemo(() => user?.username ?? 'Player', [user])

  const [stats, setStats] = useState({ wins: 0, losses: 0, elo: null })
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [timeLimit, setTimeLimit] = useState<number>(10)


  // Fetch player stats and current ELO
useEffect(() => {
  if (!user?.id) return

  fetch(`http://localhost:3000/api/players/${user.id}`)
    .then(res => res.json())
    .then(playerData => {
      return fetch(`http://localhost:3000/api/matches/player/${user.id}`)
        .then(res => res.json())
        .then(matches => {
          let wins = 0
          let losses = 0

          matches.forEach((match: any) => {
            if (match.status === 'completed' && match.result) {
              const isPlayer1 = match.player1_id === user.id
              const wonAsPlayer1 = match.result === 'player1' && isPlayer1
              const wonAsPlayer2 = match.result === 'player2' && !isPlayer1
              
              if (wonAsPlayer1 || wonAsPlayer2) {
                wins++
              } else {
                losses++
              }
            }
          })

          setStats({ wins, losses, elo: playerData.elo ?? 100 })
        })
    })
    .catch(err => console.error('Failed to fetch player data:', err))
}, [user?.id])

  const onJoinQueue = useCallback(() => {
    if (!user) {
      navigate('/login')
      return
    }
    findMatch(difficulty, timeLimit)
  }, [user, navigate, findMatch, difficulty, timeLimit])

  return (
    <div className="home-container">
      <div className="home-shell">
        <aside className="left-nav">
          { user ? (<div className="left-nav-list">
            <button className="left-nav-item" onClick={() => document.getElementById('recent-games')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">...</span>
              <span>Game History</span>
            </button>
            <button className="left-nav-item" onClick={() => document.getElementById('social')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">...</span>
              <span>Social</span>
            </button>
            <button className="left-nav-item" onClick={() => document.getElementById('leaderboard')?.scrollIntoView({ behavior: 'smooth' })}>
              <span className="left-nav-icon">...</span>
              <span>Leaderboard</span>
            </button>
          </div>) : <></> }
          

          <div className="left-nav-spacer" />

          <div className="left-auth">
            {user ? (
              <button className="left-nav-item left-nav-cta" onClick={() => logout()}>
                Logout
              </button>
            ) : (
              <>
                <button className="left-nav-item left-nav-cta" onClick={() => navigate('/login')}>Login</button>
                <button className="left-nav-item left-nav-cta" onClick={() => navigate('/signup')}>Sign Up</button>
              </>
            )}
          </div>

          <button className="left-nav-item settings" title="Settings (coming soon)">
            <span className="left-nav-icon">...</span>
            <span>Settings</span>
          </button>
        </aside>

        <div className="home-grid">
          {!user ? (
  <section className="card start-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', textAlign: 'center' }}>
    <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
      You must log in to play.
    </p>
   
  </section>
) : (
            // Logged-in view
            <>
              <section className="profile-card">
                <div className="profile-header">
                  <div className="avatar">{username.slice(0, 1).toUpperCase()}</div>
                  <div className="profile-meta">
                    <div className="profile-name">{username}</div>
                    <div className="profile-sub">{stats.elo} ELO • W {stats.wins} / L {stats.losses}</div>
                  </div>
                </div>
              </section>

              <section className="card start-card">
                <div className="option-group" role="group" aria-label="Difficulty">
                  <span className="option-label">Difficulty:</span>
                  <div className="difficulty-row">
                    {['easy','medium','hard'].map(d => (
                      <button
                        key={d}
                        className={`difficulty-btn ${difficulty === d ? 'active' : ''}`}
                        aria-pressed={difficulty === d}
                        onClick={() => setDifficulty(d as 'easy'|'medium'|'hard')}
                        type="button"
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-group" role="group" aria-label="Time">
                  <span className="option-label">Time:</span>
                  <div className="difficulty-row">
                    {[10,20,30].map(t => (
                      <button
                        key={t}
                        className={`difficulty-btn ${timeLimit === t ? 'active' : ''}`}
                        aria-pressed={timeLimit === t}
                        onClick={() => setTimeLimit(t)}
                        type="button"
                      >
                        {t} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="start-cta-row">
                  <button className="start-cta-gold" onClick={onJoinQueue} type="button" disabled={isSearching}>
                    {isSearching ? <>
                      <span className="spinner-small"></span>
                      Searching...
                    </> : 'Find a Match'}
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
                    <button className="cancel-search-btn" onClick={cancelSearch} type="button">
                      Cancel Search
                    </button>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
