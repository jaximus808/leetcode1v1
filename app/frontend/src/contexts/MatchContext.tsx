import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext' //replace with actual auth
import { io, Socket} from 'socket.io-client'


interface QueueUpdate {
    position: number
    eta?: number
    playersAhead?: number
}

interface Match {
  id: number
  player1_id: number
  player2_id: number
  problem_id: number | null
  status: string
  player1: { id: number; username: string; elo: number }
  player2: { id: number; username: string; elo: number }
  problem: { id: number; title: string; difficulty: string } | null
}

interface MatchContextType {
  currentMatch: Match | null
  isSearching: boolean
  queuePosition: number | null
  queueEta: number | null
  findMatch: () => Promise<void>
  cancelSearch: () => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [queueEta, setQueueEta] = useState<number | null>(null) 
  const { token, player } = useAuth() //or replace with some auth

  // Check for pending match
  const checkForMatch = useCallback(async () => {
    if (!token || !player) return

    const newSocket = io('http://localhost:3000', {
        auth: { token }
    })

    newSocket.emit('join', 'player-${player.id}')

    newSocket.on('match-found', (match: Match) => {
      console.log('Match found:', match)
      setCurrentMatch(match)
      setIsSearching(false)
      setQueuePosition(null)
      setQueueEta(null)
    })

    newSocket.on('queue-update', (data: QueueUpdate) => {
        console.log('Queue position:', data.position)
        setQueuePosition(data.position)
        setQueueEta(data.eta || null)
    })

    setSocket(newSocket)

    return() => {
        newSocket.close()
    }
}, [token, player])

  // Request a match
  const findMatch = async () => {
    if (!token || isSearching) return

    try {
      setIsSearching(true)

      const response = await fetch('http://localhost:3000/api/matches/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to request match')
      }

    } catch (err) {
      console.error('Error requesting match:', err)
      setIsSearching(false)
    }
  }

  // Cancel search
  const cancelSearch = () => {
    setIsSearching(false)
    setQueuePosition(null)
    setQueueEta(null)
    socket.emit('cancel-search')
  }

  return (
    <MatchContext.Provider
      value={{
        currentMatch,
        isSearching,
        queuePosition,
        queueEta,
        findMatch,
        cancelSearch,
      }}
    >
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
    const context = useContext(MatchContext)
    if (context === undefined) {
      throw new Error('useMatch must be used within a MatchProvider')
    }
    return context
}