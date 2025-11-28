import { NavLink } from 'react-router-dom'
import logoUrl from '../../assets/lc1v1logo.png'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="nav-root">
      <div className="nav-inner">
        <div className="nav-brand">
          <NavLink to="/" className="nav-logo">
            <span className="nav-brand-inner">
              <img src={logoUrl} alt="LeetCode 1v1 logo" className="nav-logo-icon" />
              <span>LeetCode 1v1</span>
            </span>
          </NavLink>
        </div>
       
        
      </div>
    </nav>
  )
}


