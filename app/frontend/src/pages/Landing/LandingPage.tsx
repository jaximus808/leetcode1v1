import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import './LandingPage.css'
import logo from '../../assets/lc1v1logo.png'

export default function LandingPage() {
  const problems = [
    'Two Sum',
    'Palindrome Number',
    'Longest Substring',
    'Generate Parentheses',
    'Sudoku Solver',
    'Merge k Sorted Lists',
    'Zigzag Conversion',
    'Roman to Integer',
    'First Missing Positive',
    'Multiply String',
    'Wildcard Matching'
  ]
  // Safe positions around the trophy (avoid central area).
  // Use CSS absolute offsets (strings with %).
  const safePositions = [
    { left: '6%', top: '8%' },
    { right: '6%', top: '10%' },
    { left: '10%', bottom: '10%' },
    { right: '10%', bottom: '12%' },
    { left: '12%', top: '24%' },
    { right: '12%', top: '28%' },
    { left: '8%', bottom: '18%' },
    { right: '8%', bottom: '16%' }
  ]

  // independent rotation for each floating card
  const [tick1, setTick1] = useState(0)
  const [tick2, setTick2] = useState(1)
  const [tick3, setTick3] = useState(2)
  const [pos1, setPos1] = useState(0)
  const [pos2, setPos2] = useState(3)
  const [pos3, setPos3] = useState(6)
  // refs to always read latest values inside timeouts
  const tick1Ref = useRef(tick1); useEffect(() => { tick1Ref.current = tick1 }, [tick1])
  const tick2Ref = useRef(tick2); useEffect(() => { tick2Ref.current = tick2 }, [tick2])
  const tick3Ref = useRef(tick3); useEffect(() => { tick3Ref.current = tick3 }, [tick3])
  const pos1Ref = useRef(pos1); useEffect(() => { pos1Ref.current = pos1 }, [pos1])
  const pos2Ref = useRef(pos2); useEffect(() => { pos2Ref.current = pos2 }, [pos2])
  const pos3Ref = useRef(pos3); useEffect(() => { pos3Ref.current = pos3 }, [pos3])
  const [f1, setF1] = useState(false)
  const [f2, setF2] = useState(false)
  const [f3, setF3] = useState(false)
  const fadeOutMs = 1000
  const to1 = useRef<number | undefined>(undefined)
  const to2 = useRef<number | undefined>(undefined)
  const to3 = useRef<number | undefined>(undefined)
  const t1b = useRef<number | undefined>(undefined)
  const t2b = useRef<number | undefined>(undefined)
  const t3b = useRef<number | undefined>(undefined)

  // helper: advance to next index not in used list
  const nextDistinct = (idx: number, used: number[], len: number) => {
    let n = (idx + 1) % len
    let tries = 0
    while (used.includes(n) && tries < len) {
      n = (n + 1) % len
      tries++
    }
    return n
  }

  useEffect(() => {
    const i1 = setInterval(() => {
      setF1(true)
      to1.current = window.setTimeout(() => {
        setTick1((t) => nextDistinct(t, [tick2Ref.current, tick3Ref.current], problems.length))
        setPos1((p) => nextDistinct(p, [pos2Ref.current, pos3Ref.current], safePositions.length))
      }, fadeOutMs)
      t1b.current = window.setTimeout(() => setF1(false), fadeOutMs + 10)
    }, 3600)
    const i2 = setInterval(() => {
      setF2(true)
      to2.current = window.setTimeout(() => {
        setTick2((t) => nextDistinct(t, [tick1Ref.current, tick3Ref.current], problems.length))
        setPos2((p) => nextDistinct(p, [pos1Ref.current, pos3Ref.current], safePositions.length))
      }, fadeOutMs)
      t2b.current = window.setTimeout(() => setF2(false), fadeOutMs + 10)
    }, 4500)
    const i3 = setInterval(() => {
      setF3(true)
      to3.current = window.setTimeout(() => {
        setTick3((t) => nextDistinct(t, [tick1Ref.current, tick2Ref.current], problems.length))
        setPos3((p) => nextDistinct(p, [pos1Ref.current, pos2Ref.current], safePositions.length))
      }, fadeOutMs)
      t3b.current = window.setTimeout(() => setF3(false), fadeOutMs + 10)
    }, 5200)
    return () => {
      clearInterval(i1); clearInterval(i2); clearInterval(i3)
      if (to1.current) clearTimeout(to1.current)
      if (to2.current) clearTimeout(to2.current)
      if (to3.current) clearTimeout(to3.current)
      if (t1b.current) clearTimeout(t1b.current)
      if (t2b.current) clearTimeout(t2b.current)
      if (t3b.current) clearTimeout(t3b.current)
    }
  }, [problems.length])

  return (
    <div className="landing-root">
      <header className="landing-topbar">
       
      </header>

      <section className="landing-hero">
        <div className="stats">
          <div><strong>215,833</strong> playing now</div>
          <div><strong>18,832,213</strong> games today</div>
        </div>

        <div className="hero-content">
          <div className="hero-art" aria-hidden>
            <div className="grid" />
            <div className="glow" />
            <img className="hero-logo" src={logo} alt="LeetCode 1v1 logo" />
            <div className={`float-card fc-1${f1 ? ' fading' : ''}`} style={safePositions[pos1]}>
              {problems[tick1 % problems.length]}
            </div>
            <div className={`float-card fc-2${f2 ? ' fading' : ''}`} style={safePositions[pos2]}>
              {problems[tick2 % problems.length]}
            </div>
            <div className={`float-card fc-3${f3 ? ' fading' : ''}`} style={safePositions[pos3]}>
              {problems[tick3 % problems.length]}
            </div>
          </div>
          <div className="hero-copy">
            <h1>Code. Compete. Have fun!</h1>
            <p>Face off in real-time coding matches. Improve your skills and climb the ladder.</p>
            <div className="hero-cta">
              <Link to="/signup" className="cta-btn">Get Started</Link>
              <Link to="/login" className="ghost-btn">I already have an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-label="Highlights">
        <div className="feature">
          <div className="feature-head">
            <svg className="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 12h5l2 3 4-6 3 3h4" stroke="#f2c94c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Real-time 1v1</h3>
          </div>
          <p>Queue by difficulty and timer. See your opponent&apos;s progress live, second by second.</p>
        </div>
        <div className="feature">
          <div className="feature-head">
            <svg className="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 5h16M4 12h16M4 19h16" stroke="#f2c94c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>Multiple languages</h3>
          </div>
          <p>Javascript, Typescript, Python, Java, C, C++, C# — each with helpful starter code.</p>
        </div>
        <div className="feature">
          <div className="feature-head">
            <svg className="feature-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#f2c94c" strokeWidth="2"/>
              <path d="M8 12l2.8 2.8L16 10" stroke="#f2c94c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Objective judging</h3>
          </div>
          <p>Secure sandbox, visible samples, hidden tests; fair results every time.</p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} LeetCode 1v1</span>
        <div className="links">
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms</a>
        </div>
      </footer>
    </div>
  )
}


