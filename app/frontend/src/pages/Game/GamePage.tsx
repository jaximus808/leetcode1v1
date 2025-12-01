import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import './GamePage.css'
import Editor from '@monaco-editor/react'
import axios from 'axios'

interface Problem {
  id: number
  title: string
  difficulty: string
  description: string
  test_case_url?: string
  starter_code_path?: string
  constraints?: string[]
  examples?: Array<{
    input: string
    output: string
    explanation?: string
  }>
}

interface StarterCodeJSON {
  [problemKey: string]: {
    javascript?: string
    typescript?: string
    python?: string
    java?: string
    c?: string
    cpp?: string
    csharp?: string
  }
}

export default function GamePage() {
  const { matchId } = useParams< { matchId: string } >()
  const API_BASE =(import.meta as any).env?.VITE_JUDGE_API_BASE || 'http://localhost:7071/api'
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const problemId = params.get('problemId')
  const initialMinutes = Number(params.get('t') ?? 10)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [starterCodes, setStarterCodes] = useState<StarterCodeJSON | null>(null)
  const [loading, setLoading] = useState(true)

  const languages = [
    { value: 'javascript', label: 'Javascript', monaco: 'javascript' },
    { value: 'typescript', label: 'Typescript', monaco: 'typescript' },
    { value: 'python', label: 'Python', monaco: 'python' },
    { value: 'java', label: 'Java', monaco: 'java' },
    // Monaco does not have a separate 'c' grammar; 'cpp' is commonly used for C as well
    { value: 'c', label: 'C', monaco: 'cpp' },
    { value: 'cpp', label: 'C++', monaco: 'cpp' },
    { value: 'csharp', label: 'C#', monaco: 'csharp' }
  ] as const

  const [language, setLanguage] = useState<typeof languages[number]['value']>('javascript')
  const [code, setCode] = useState<string>('')

  // Fetch problem data
  // app/frontend/src/pages/Game/GamePage.tsx - REPLACE lines 60-180

useEffect(() => {
  const fetchProblemData = async () => {
    if (!problemId) {
      console.error('No problemId provided')
      setLoading(false)
      return
    }
    
    try {
      const problemResponse = await axios.get(`http://localhost:3000/api/problems/${problemId}`)
      const problemData = problemResponse.data
      setProblem(problemData)
      
      if (problemData.starter_code_url) {
        const starterCodeResponse = await axios.get(problemData.starter_code_url)
        setStarterCodes(starterCodeResponse.data)
        
        const problemKey = getProblemKey(problemData.title)
        
        if (starterCodeResponse.data[problemKey]) {
          const initialCode = starterCodeResponse.data[problemKey][language]
          setCode(initialCode || getDefaultStarterCode(language))
        } else {
          console.log('Available keys:', Object.keys(starterCodeResponse.data))
          setCode(getDefaultStarterCode(language))
        }
      } else {
        setCode(getDefaultStarterCode(language))
      }
    } catch (error) {
      setCode(getDefaultStarterCode(language))
    } finally {
      setLoading(false)
    }
  }
  
  fetchProblemData()
}, [problemId, language]) // Add language as dependency

function getProblemKey(title: string): string {
  // Convert title to match your JSON key format
  // "Two Sum" -> "two_sum"
  const key = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
  
  return key
}

const getStarterCodeForLanguage = useCallback((lang: typeof languages[number]['value']): string => {
  console.log(`🔍 Getting starter code for language: ${lang}`)
  
  if(!problem || !starterCodes) {
    return getDefaultStarterCode(lang)
  }

  const problemKey = getProblemKey(problem.title)
  
  const problemStarterCodes = starterCodes[problemKey]
  
  if(!problemStarterCodes) {
    return getDefaultStarterCode(lang)
  }

  if(problemStarterCodes[lang]) {
    return problemStarterCodes[lang]!
  }

  return getDefaultStarterCode(lang)
}, [problem, starterCodes])

function getDefaultStarterCode(lang: typeof languages[number]['value']): string {
  const header = `// Implement solve() below\n`
  switch (lang) {
    case 'python':
      return `# Implement solve(input) below
def solve(input):
    # input is a dict, e.g. {"nums":[...], "target":...}
    return []
`
    case 'typescript':
      return `${header}function solve(input: any) {
  // input: { nums: number[], target: number }
  return [];
}
`
    case 'java':
      return `${header}public class Solution {
    public static void main(String[] args) {
        // For Java, send full program that reads stdin if you want to run here.
    }

    public static Object solve(Object input) {
        // TODO: implement or send full program for Java
        return null;
    }
}
`
    case 'c':
      return `${header}#include <stdio.h>
// For C/C++, send a full program that reads stdin JSON and prints the result.
int main(void) {
    return 0;
}
`
    case 'cpp':
      return `${header}#include <bits/stdc++.h>
using namespace std;
// For C/C++, send a full program that reads stdin JSON and prints the result.
int main(){
    return 0;
}
`
    case 'csharp':
      return `${header}using System;
// For C#, send a full program that reads stdin JSON and prints the result.
class Program {
    static void Main(string[] args) { }
}
`
    case 'javascript':
    default:
      return `${header}function solve(input) {
  // input: { nums: number[], target: number }
  return [];
}
`
  }
}

useEffect(() => {
  if(problem && starterCodes) {
    const newCode = getStarterCodeForLanguage(language)
    setCode(newCode)
  }
}, [language, problem, starterCodes, getStarterCodeForLanguage])

  // Timer seeded from query param (defaults to 10)
  const GAME_DURATION_SECONDS = Math.max(1, initialMinutes) * 60
  const [secondsLeft, setSecondsLeft] = useState<number>(GAME_DURATION_SECONDS)
  const alertedRef = useRef<boolean>(false)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (secondsLeft === 0 && !alertedRef.current) {
      alertedRef.current = true
      // Simple notification for now
      window.alert('Time is up!')
    }
  }, [secondsLeft])

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }, [secondsLeft])


  const callJudge = useCallback(async (endpoint: 'run' | 'submit') => {
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          language: String(language).toLowerCase(),
          sourceCode: code
        })
      })
      const json = await res.json()
      console.log(`[${endpoint}]`, json)
    } catch (err) {
      console.error(`[${endpoint}] error`, err)
    }
  }, [API_BASE, problemId, language, code])

  const onRun = useCallback(() => { void callJudge('run') }, [callJudge])
  const onSubmit = useCallback(() => { void callJudge('submit') }, [callJudge])

  if (loading) {
    return (
      <div className="game-root">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p>Loading problem...</p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="game-root">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <p>Problem not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="game-root">
      <div className="game-main">
      <aside className="game-left">
  <div className="problem-head">
    <h2 className="problem-title">{problem.title}</h2>
    <span className={`problem-badge ${problem.difficulty.toLowerCase()}`}>
      {problem.difficulty}
    </span>
  </div>
  
  {/* Description */}
  <div className="problem-desc">{problem.description}</div>
  
  {/* Examples */}
  {problem.examples && problem.examples.length > 0 && (
    <>
      <h3 className="problem-section-header">Examples</h3>
      <div className="problem-examples">
        {problem.examples.map((ex, i) => (
          <div key={i} className="example">
            <div className="example-header">Example {i + 1}:</div>
            <div className="example-item">
              <div className="example-label">Input:</div>
              <div className="example-content">{ex.input}</div>
            </div>
            <div className="example-item">
              <div className="example-label">Output:</div>
              <div className="example-content">{ex.output}</div>
            </div>
            {ex.explanation && (
              <div className="example-item">
                <div className="example-label">Explanation:</div>
                <div className="example-content">{ex.explanation}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )}
  
  {/* Constraints */}
  {problem.constraints && problem.constraints.length > 0 && (
    <>
      <h3 className="problem-section-header">Constraints:</h3>
      <ul className="problem-constraints">
        {problem.constraints.map((c, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: c }} />
        ))}
      </ul>
    </>
  )}
</aside>

        <div className="editor-col">
          <div className="editor-toolbar" role="toolbar" aria-label="Editor controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label>Language</label>
              <select
                className="editor-select"
                value={language}
                onChange={(e) => {
                  const next = e.target.value as typeof languages[number]['value']
                  setLanguage(next)
                }}
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" aria-label="Run" className="icon-btn" onClick={onRun}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button type="button" className="action-btn" onClick={onSubmit}>
                Submit
              </button>
            </div>
          </div>
          <Editor
            height="100%"
            defaultLanguage={languages.find((l) => l.value === language)?.monaco ?? 'plaintext'}
            language={languages.find((l) => l.value === language)?.monaco ?? 'plaintext'}
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              automaticLayout: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false
              }
            }}
          />
        </div>
        <aside className="right-col">
          <div className="timer-bar">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5" />
              <path d="M9 2h6" />
            </svg>
            <span style={{ fontWeight: 700, color: '#e5e7eb', fontSize: '1.5em' }}>{formattedTime}</span>
          </div>
          <div className="status-wrap">
            <div className="status-box">
              <div className="progress-item">
                <div className="progress-head">
                  <span style={{ color: '#cfcfcf' }}>You</span>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>0 / 10 tests</span>
                </div>
                <div className="progress-track"><div className="progress-fill-you" /></div>
              </div>
              <div className="progress-item">
                <div className="progress-head">
                  <span style={{ color: '#cfcfcf' }}>Opponent</span>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>0 / 10 tests</span>
                </div>
                <div className="progress-track"><div className="progress-fill-op" /></div>
              </div>
            </div>
            <div className="chat-wrap">
              <div className="chat-head">
                <h3 style={{ margin: 0 }}>Chat</h3>
              </div>
              <div className="chat-body">{/* messages will render here */}</div>
              <div className="chat-input">
                <input disabled placeholder="Message (disabled - not implemented)" />
                <button disabled>Send</button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}