import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'

export default function GamePage() {
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
    const header = `// Implement solve() below\n`
    switch (lang) {
      case 'python':
        return `# Implement solve() below \ndef solve():\n    # TODO\n    pass\n`
      case 'typescript':
        return `${header}function solve(): void {\n  // TODO\n}\n`
      case 'java':
        return `${header}public class Solution {\n    public static void main(String[] args) {\n        // Optional: call solve();\n    }\n\n    public static void solve() {\n        // TODO\n    }\n}\n`
      case 'c':
        return `${header}#include <stdio.h>\n\nint solve(void) {\n    // TODO\n    return 0;\n}\n\nint main(void) {\n    // Optional: call solve();\n    return 0;\n}\n`
      case 'cpp':
        return `${header}#include <bits/stdc++.h>\nusing namespace std;\n\nint solve() {\n    // TODO\n    return 0;\n}\n\nint main(){\n    // Optional: call solve();\n    return 0;\n}\n`
      case 'csharp':
        return `${header}using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Optional: call solve();\n    }\n\n    static void solve() {\n        // TODO\n    }\n}\n`
      case 'javascript':
      default:
        return `${header}function solve() {\n  // TODO\n}\n`
    }
  }
  const [code, setCode] = useState<string>(getStarterCode(language))
  // Timer: start at 10 minutes (600 seconds) and count down to 0
  const GAME_DURATION_SECONDS = 600
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

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr', minHeight: 'calc(100vh - 56px)' }}>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1fr) 2fr 320px',
          minHeight: 0
        }}
      >
        <aside
          style={{
            minWidth: 0,
            overflow: 'auto',
            padding: '16px',
            borderRight: '1px solid #1f1f1f',
            background: '#0d0d0d'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: '0 0 6px 0' }}>{problem.title}</h2>
            <span
              style={{
                fontSize: 12,
                color: '#b3b3b3',
                border: '1px solid #1f1f1f',
                borderRadius: 8,
                padding: '4px 8px',
                background: '#111'
              }}
            >
              {problem.difficulty}
            </span>
          </div>
          <p style={{ color: '#c7c7c7' }}>{problem.description}</p>
          <h3 style={{ margin: '16px 0 8px 0' }}>Constraints</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#bdbdbd' }}>
            {problem.constraints.map((c, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {c}
              </li>
            ))}
          </ul>
          <h3 style={{ margin: '16px 0 8px 0' }}>Examples</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {problem.examples.map((ex, i) => (
              <div
                key={i}
                style={{
                  border: '1px solid #222',
                  borderRadius: 8,
                  padding: 12,
                  background: '#111'
                }}
              >
                <div style={{ color: '#9ca3af', fontSize: 13 }}>Input</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.input}</pre>
                <div style={{ height: 8 }} />
                <div style={{ color: '#9ca3af', fontSize: 13 }}>Output</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ex.output}</pre>
              </div>
            ))}
          </div>
        </aside>

        <div style={{ minWidth: 0, minHeight: 0, display: 'grid', gridTemplateRows: 'auto 1fr' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid #1f1f1f',
              background: '#0f0f0f'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 14, color: '#b3b3b3' }}></label>
              <select
                value={language}
                onChange={(e) => {
                  const next = e.target.value as typeof languages[number]['value']
                  setLanguage(next)
                  setCode(getStarterCode(next))
                }}
                style={{
                  background: '#2a2a2a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit'
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
              <button
                type="button"
                aria-label="Run"
                style={{
                  border: 'none',
                  background: '#2a2a2a',
                  color: '#ffffff',
                  width: 36,
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  padding: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'inherit'
                }}
                onClick={() => {}}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <button
                type="button"
                style={{ border: 'none', background: '#2a2a2a', color: '#ffffff', height: 36, padding: '0 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}
                onClick={() => {}}
              >
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
        <aside
          style={{
            minWidth: 0,
            borderLeft: '1px solid #1f1f1f',
            background: '#0d0d0d',
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            maxHeight: '100%',
            minHeight: 0
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: '1px solid #1f1f1f',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
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
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', minHeight: 0 }}>
            <div style={{ padding: 12, borderBottom: '1px solid #1f1f1f' }}>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#cfcfcf' }}>You</span>
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>0 / 10 tests</span>
                  </div>
                  <div style={{ height: 8, background: '#141414', borderRadius: 6, overflow: 'hidden', border: '1px solid #202020' }}>
                    <div style={{ width: '0%', height: '100%', background: '#2563eb' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#cfcfcf' }}>Opponent</span>
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>0 / 10 tests</span>
                  </div>
                  <div style={{ height: 8, background: '#141414', borderRadius: 6, overflow: 'hidden', border: '1px solid #202020' }}>
                    <div style={{ width: '0%', height: '100%', background: '#16a34a' }} />
                  </div>
                </div>
                {/* Timer is shown in the panel header */}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', minHeight: 0 }}>
              <div style={{ padding: 12, borderBottom: '1px solid #1f1f1f' }}>
                <h3 style={{ margin: 0 }}>Chat</h3>
              </div>
              <div
                style={{
                  minHeight: 0,
                  overflow: 'auto',
                  padding: 12,
                  display: 'grid',
                  gap: 8
                }}
              >
                {/* messages will render here */}
              </div>
              <div style={{ padding: 12, borderTop: '1px solid #1f1f1f', display: 'flex', gap: 8 }}>
                <input
                  disabled
                  placeholder="Message (disabled - not implemented)"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #2a2a2a',
                    background: '#111',
                    color: '#e5e7eb'
                  }}
                />
                <button disabled style={{ background: '#262626', borderColor: '#3a3a3a' }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}