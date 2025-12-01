import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import './GamePage.css'
import Editor from '@monaco-editor/react'

export default function GamePage() {
  const API_BASE =(import.meta as any).env?.VITE_JUDGE_API_BASE || 'http://localhost:7071/api'
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const initialMinutes = Number(params.get('t') ?? 10)
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
    function getStarterCode(lang: typeof languages[number]['value']): string {
    const header = `// Implement solve(input) below\n`
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
  const [code, setCode] = useState<string>(getStarterCode(language))
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
  const problem = useMemo(
    () => ({
      title: 'Two Sum (Placeholder)',
      difficulty: 'Easy',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        '-10^9 <= target <= 10^9',
        'Only one valid answer exists'
      ],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
      ]
    }),
    []
  )
    // Hardcode Two Sum for now
  const problemId = 1

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

  return (
    <div className="game-root">
      <div className="game-main">
        <aside className="game-left">
          <div className="problem-head">
            <h2 className="problem-title">{problem.title}</h2>
            <span className="problem-badge">{problem.difficulty}</span>
          </div>
          <p className="problem-desc">{problem.description}</p>
          <h3 style={{ margin: '16px 0 8px 0' }}>Constraints</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#bdbdbd' }}>
            {problem.constraints.map((c, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {c}
              </li>
            ))}
          </ul>
          <h3 style={{ margin: '16px 0 8px 0' }}>Examples</h3>
          <div className="problem-examples">
            {problem.examples.map((ex, i) => (
              <div key={i} className="example">
                <div className="example-label">Input</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.input}</pre>
                <div style={{ height: 8 }} />
                <div className="example-label">Output</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.output}</pre>
              </div>
            ))}
          </div>
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
                  setCode(getStarterCode(next))
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
              automaticLayout: true
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