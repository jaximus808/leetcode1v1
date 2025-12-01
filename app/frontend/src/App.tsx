import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MatchProvider } from './contexts/MatchContext'
import HomePage from './pages/Home/homepage'
import GamePage from './pages/Game/GamePage'
import QueuePage from './pages/Queue/QueuePage'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import Navbar from './components/layout/Navbar'
import HistoryPage from './pages/History/HistoryPage'
import NotFoundPage from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MatchProvider>
          <Navbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/game/:matchId" element={<GamePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </MatchProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
