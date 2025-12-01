import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatch } from '../../contexts/MatchContext'
import './QueuePage.css'

export default function QueuePage() {
  const navigate = useNavigate()
  const { isSearching, queuePosition, queueEta, cancelSearch } = useMatch()
  const [dots, setDots] = useState('.')

  // Redirect back to home if not searching
  useEffect(() => {
    if (!isSearching) {
      navigate('/')
    }
  }, [isSearching, navigate])

  // Animated dots for "Searching" text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = () => {
    cancelSearch()
    navigate('/')
  }

  return (
    <div className="queue-container">
      <div className="queue-content">
        {/* Chess.com inspired animated pieces */}
        <div className="queue-animation">
          <div className="pieces-container">
            <div className="piece piece-1">
              <CodeIcon />
            </div>
            <div className="piece piece-2">
              <CodeIcon />
            </div>
            <div className="vs-divider">VS</div>
          </div>
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        </div>

        {/* Status text */}
        <div className="queue-status-text">
          <h1 className="queue-title">Finding your opponent{dots}</h1>
          <p className="queue-subtitle">
            Matching you with a player of similar skill level
          </p>
        </div>

        {/* Queue info */}
        {queuePosition !== null && (
          <div className="queue-info-card">
            <div className="queue-info-item">
              <span className="queue-info-label">Position in Queue</span>
              <span className="queue-info-value">#{queuePosition}</span>
            </div>
            {queueEta && (
              <div className="queue-info-item">
                <span className="queue-info-label">Estimated Wait</span>
                <span className="queue-info-value">{queueEta}s</span>
              </div>
            )}
          </div>
        )}

        {/* Cancel button */}
        <button className="queue-cancel-btn" onClick={handleCancel}>
          Cancel Search
        </button>
      </div>
    </div>
  )
}

// Simple code icon component
function CodeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  )
}