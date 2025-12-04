import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import './GamePage.css'
import Editor from '@monaco-editor/react'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../../contexts/AuthContext'

interface TestProgress {
  playerId?: string;
  passed: number;
  total: number;
}

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
  const { matchId } = useParams<{ matchId: string }>()
  const API_BASE = (import.meta as any).env?.VITE_JUDGE_API_BASE || 'http://localhost:7071/api'
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const problemId = params.get('problemId')
  const initialMinutes = Number(params.get('t') ?? 10)

  const [problem, setProblem] = useState<Problem | null>(null)
  const [starterCodes, setStarterCodes] = useState<StarterCodeJSON | null>(null)
  const [loading, setLoading] = useState(true)

  const [myProgress, setMyProgress] = useState<TestProgress>({ passed: 0, total: 0 });
  const [opponentProgress, setOpponentProgress] = useState<TestProgress>({ passed: 0, total: 0 });
  const [, setGameSocket] = useState<Socket | null>(null);
  const [, setTotalTests] = useState<number>(0);
  const { user } = useAuth()

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<{ id: number; isMe: boolean } | null>(null);

  const [runResults, setRunResults] = useState<any>(null);
  const [showRunModal, setShowRunModal] = useState(false);

  useEffect(() => {
    if (!matchId || !user) return;

    // Connect to game server
    const socket = io('http://localhost:3000', {
      query: { matchId, userId: user.id }
    });

    socket.on('connect', () => {
      console.log('Connected to game server');
      socket.emit('join_room', { roomCode: matchId, userId: user.id, username: user.username });
    });

    // Listen for test progress updates
    socket.on('test-progress', (data: TestProgress) => {
      console.log('Test progress:', data);
      console.log('Comparing: ', data.playerId, 'with', user.id, 'and', user.id.toString());

      if (String(data.playerId) === String(user.id)) {
        setMyProgress({ passed: data.passed, total: data.total });
      } else {
        setOpponentProgress({ passed: data.passed, total: data.total });
      }
    });

    // NEW: Listen for game over
    socket.on('game-over', (data: { winnerId: number; loserId: number; winnerScore: number; reason: string }) => {
      console.log('🏆 Game Over!', data);
      setGameOver(true);
      setWinner({
        id: data.winnerId,
        isMe: data.winnerId == user.id
      });
    });

    setGameSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [matchId, user]);

  const [opponentName, setOpponentName] = useState<string>('Opponent');

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId || !user) return;

      try {
        const response = await axios.get(`http://localhost:3000/api/matches/${matchId}`);
        const matchData = response.data;

        const opponentUsername = matchData.player1_id === user.id ? matchData.player2.username : matchData.player1.username;

        if (opponentUsername) {
          setOpponentName(opponentUsername);
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };

    fetchMatchData();
  }, [matchId, user]);

  // Fetch problem data
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

        if (problemData.test_case_url) {
          try {
            const testCaseResponse = await axios.get(problemData.test_case_url)
            const testData = testCaseResponse.data
            let testCount = 0;
            if (Array.isArray(testData)) {
              testCount = testData.length;
            } else if (testData?.tests) {
              testCount = testData.tests.length;
            } else if (testData?.samples) {
              testCount = testData.samples.length;
            }

            setTotalTests(testCount);
            // Initialize progress bars with total
            setMyProgress({ passed: 0, total: testCount });
            setOpponentProgress({ passed: 0, total: testCount });
          } catch (err) {
            console.error('Failed to fetch test cases:', err);
          }
        } else {
          setTotalTests(0)
        }

        if (problemData.starter_code_url) {
          const starterCodeResponse = await axios.get(problemData.starter_code_url)
          setStarterCodes(starterCodeResponse.data)
          const problemKey = getProblemKey(problemData.title);
          const initialCode = starterCodeResponse.data[problemKey]?.[language];
          setCode(initialCode || getDefaultStarterCode(language))
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
  }, [problemId])

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

  function getDefaultStarterCode(lang: typeof languages[number]['value']): string {
    const header = `// Implement solve() below\n`
    switch (lang) {
      case 'python':
        return `def two_sum(nums, target):

def solve(input):
  return two_sum(input["nums"], input["target"])
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
    if (!problem || !starterCodes) {
      setCode(getDefaultStarterCode(language));
      return;
    }

    const problemKey = getProblemKey(problem.title);
    const problemStarterCodes = starterCodes[problemKey];

    if (problemStarterCodes && problemStarterCodes[language]) {
      console.log(`Setting starter code for ${language}`);
      setCode(problemStarterCodes[language]!);
    } else {
      console.log(`No starter code found for ${language}, using default`);
      setCode(getDefaultStarterCode(language));
    }
  }, [language, problem, starterCodes]);

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
          sourceCode: code,
          matchId,
          playerId: user?.id
        })
      })
      const json = await res.json()
      console.log(`[${endpoint}]`, json)

      if (endpoint === 'run') {
        setRunResults(json)
        setShowRunModal(true)
      }

    } catch (err) {
      console.error(`[${endpoint}] error`, err)
    }
  }, [API_BASE, problemId, language, code, matchId, user])

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

  if (showRunModal && runResults) {
    return (
      <div className="game-root">
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#e5e7eb', marginBottom: '1rem' }}>
              Run Results: {runResults.passed}/{runResults.total} Sample Tests Passed
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              {runResults.results?.map((result: any, i: number) => (
                <div key={i} style={{
                  backgroundColor: result.ok ? '#065f46' : '#7f1d1d',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  border: result.ok ? '1px solid #10b981' : '1px solid #ef4444'
                }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Test Case {i + 1}: {result.ok ? '✓ Passed' : '✗ Failed'}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                    <div><strong>Input:</strong> {JSON.stringify(result.input)}</div>
                    <div><strong>Expected:</strong> {result.expected}</div>
                    <div><strong>Actual:</strong> {result.actual}</div>
                    {result.stderr && <div style={{ color: '#ef4444' }}><strong>Error:</strong> {result.stderr}</div>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRunModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameOver && winner) {
    return (
      <div className="game-root">
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '3rem',
            borderRadius: '16px',
            border: winner.isMe ? '3px solid #22c55e' : '3px solid #ef4444',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h1 style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: winner.isMe ? '#22c55e' : '#ef4444'
            }}>
              {winner.isMe ? '🏆 Victory!' : '💔 Defeat'}
            </h1>

            <p style={{
              fontSize: '1.5rem',
              color: '#cfcfcf',
              marginBottom: '2rem'
            }}>
              {winner.isMe
                ? 'You completed all test cases first!'
                : 'Your opponent completed all test cases first.'}
            </p>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '2rem'
            }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Return Home
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{myProgress.passed} / {myProgress.total} tests</span>
                </div>
                <div className="progress-track"><div className="progress-fill-you" style={{ width: myProgress.total > 0 ? `${(myProgress.passed / myProgress.total) * 100}%` : '0%' }} /></div>
              </div>
              <div className="progress-item">
                <div className="progress-head">
                  <span style={{ color: '#cfcfcf' }}>{opponentName}</span>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>{opponentProgress.passed} / {opponentProgress.total} tests</span>
                </div>
                <div className="progress-track"><div className="progress-fill-op" style={{ width: opponentProgress.total > 0 ? `${(opponentProgress.passed / opponentProgress.total) * 100}%` : '0%' }} /></div>
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