import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext' //replace with actual auth
import { io, Socket} from 'socket.io-client'
import { useNavigate } from 'react-router-dom'


interface QueueUpdate {
    position: number
    eta?: number
    playersAhead?: number
}

export interface Match {
  id: number;
  player1_id: number;
  player2_id: number;
  status: string;
  result: "player1" | "player2" | "draw" | null;
  created_at: string;

  problem: {
    id: number;
    title: string;
    difficulty: string;
  } | null;

  player1: {
    id: number;
    username: string;
    elo: number;
  };

  player2: {
    id: number;
    username: string;
    elo: number;
  };
}


interface MatchContextType {
  currentMatch: Match | null
  isSearching: boolean
  queuePosition: number | null
  queueEta: number | null
  findMatch: (difficulty: string, timeLimit: number) => Promise<void>
  cancelSearch: () => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [queuePosition, setQueuePosition] = useState<number | null>(null)
  const [queueEta, setQueueEta] = useState<number | null>(null) 
  const { token, user } = useAuth()


  const navigate = useNavigate()

  useEffect(() => {
    if (isSearching) {
      navigate('/queue')
    }
  }, [isSearching, navigate])

  // Request a match
  const findMatch = async (difficulty: string, timeLimit: number) => {
    if (!token || !user ||isSearching) return

    try {

      const newSocket = io('http://localhost:3000', {
        auth: { token }
      })
      
      newSocket.on('joined-queue', (data: any) => {
        console.log('Joined queue, data:', data)
        setIsSearching(true)
        if(data.position !== undefined) {
          setQueuePosition(data.position)
        }
        if(data.eta !== undefined) {
          setQueueEta(data.eta)
        }
      })

      newSocket.on('queue-update', (data: QueueUpdate) => {
        console.log('Queue position:', data.position)
        setQueuePosition(data.position)
        setQueueEta(data.eta || null)
      })

      newSocket.on('match-found', (data: { matchId: number }) => {
        console.log('Match found:', data)
        setIsSearching(false)
        setQueuePosition(null)
        setQueueEta(null)
        setTimeout(() => {
          window.location.href = `/game/${data.matchId}`
        }, 500)
      })

      newSocket.on('queue-error', (error) => {
        console.error('Queue error:', error)
        setIsSearching(false)
      })

      setSocket(newSocket)

      newSocket.emit('join', `player-${user?.id}`)

      newSocket.emit('join-queue', {
        token,
        difficulty,
        time: timeLimit.toString()
      })

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
    if (socket) {
      socket.emit('cancel-search')
      socket.close()
      setSocket(null)
    }
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