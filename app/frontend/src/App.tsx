import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Home/homepage'
import GamePage from './pages/Game/GamePage'
import LoginPage from './pages/Auth/LoginPage'
import SignupPage from './pages/Auth/SignupPage'
import Navbar from './components/layout/Navbar'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/game/:matchId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}
