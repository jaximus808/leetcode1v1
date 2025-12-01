import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MatchProvider } from './contexts/MatchContext'
import HomePage from './pages/Home/homepage'
import GamePage from './pages/Game/GamePage'
import QueuePage from './pages/Queue/QueuePage'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import Navbar from './components/layout/Navbar'
import LandingPage from './pages/Landing/LandingPage'
import HistoryPage from './pages/History/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'

function AppShell() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
          <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/game/:matchId" element={<GamePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MatchProvider>
          <AppShell />
        </MatchProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
