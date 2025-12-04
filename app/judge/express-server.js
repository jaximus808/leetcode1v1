const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 7071;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const JUDGE0_URL = process.env.JUDGE0_URL || "http://judge0-api.judge0.svc.cluster.local:2358";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LANG = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  csharp: 51
};

function normalize(s) {
  return (s ?? "").trim().replace(/\r\n/g, "\n");
}

function expectedAsString(t) {
  const v = (t && t.expected !== undefined) ? t.expected : t?.output;
  return typeof v === "string" ? v : JSON.stringify(v ?? "");
}

function canonicalize(s) {
  const t = (s ?? "").trim();
  try {
    return JSON.stringify(JSON.parse(t));
  } catch {
    return t;
  }
}

function wrapSource(language, user) {
  const lang = language.toLowerCase();

  if (lang === "javascript" || lang === "typescript") {
    return `${user}
(function(){
  const fs = require('fs');
  const data = fs.readFileSync(0, 'utf8').trim();
  const input = data ? JSON.parse(data) : null;
  const out = (typeof solve === 'function') ? solve(input) : null;
  process.stdout.write(typeof out === 'string' ? out : JSON.stringify(out ?? ""));
})();`;
  }

  if (lang === "python") {
    return `${user}
import sys, json
def _main():
    data = sys.stdin.read().strip()
    inp = json.loads(data) if data else None
    out = solve(inp)
    if isinstance(out, str):
        sys.stdout.write(out)
    else:
        sys.stdout.write(json.dumps(out if out is not None else ""))
if __name__ == "__main__":
    _main()`;
  }

  return user;
}

async function runSingleTest(language_id, source_code, stdin) {
  const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language_id, source_code, stdin })
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { }
    return { status: res.status, body, raw: text, error: null };
  } catch (err) {
    return { status: 0, body: null, raw: null, error: String(err) };
  }
}

async function getJSONFromStorage(bucket, key) {
  const dl = await supabase.storage.from(bucket).download(key);
  if (dl.error) throw new Error(`storage download failed: ${dl.error.message}`);
  if (!dl.data) throw new Error(`storage download failed: empty body for ${bucket}/${key}`);
  const text = await dl.data.text();
  return JSON.parse(text);
}

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'judge', judge0: JUDGE0_URL });
});

// Run endpoint (for testing)
app.post('/api/run', async (req, res) => {
  try {
    const { problemId, language, sourceCode } = req.body;
    console.log('[Run] Request:', { problemId, language });

    if (!problemId || !language || !sourceCode) {
      return res.status(400).json({ error: "Missing problemId, language, or sourceCode" });
    }

    const language_id = LANG[language.toLowerCase()];
    if (!language_id) return res.status(400).json({ error: "Unsupported language" });

    // Get problem info
    const { data: prob, error: perr } = await supabase
      .from("problems")
      .select("test_case_path, starter_code_path")
      .eq("id", problemId)
      .single();

    if (perr) {
      console.error('[Run] Problem fetch error:', perr);
      return res.status(500).json({ error: "Failed to fetch problem", detail: perr.message });
    }

    // Download test file from storage
    const tc = await getJSONFromStorage("test-cases", prob.test_case_path);

    // Get sample tests
    let samples = [];
    if (Array.isArray(tc)) {
      samples = tc.slice(0, Math.min(3, tc.length));
    } else if (tc?.samples) {
      samples = tc.samples;
    } else if (tc?.tests) {
      samples = tc.tests.slice(0, Math.min(3, tc.tests.length));
    }

    if (!samples.length) {
      return res.json({ results: [], passed: 0, total: 0 });
    }

    const program = wrapSource(language, sourceCode);
    const results = [];
    let passed = 0;

    for (const t of samples) {
      const stdin = JSON.stringify(t.input ?? null);
      const r = await runSingleTest(language_id, program, stdin);

      const statusDesc = r.body?.status?.description ?? "Unknown";
      const out = canonicalize(r.body?.stdout ?? "");
      const exp = canonicalize(expectedAsString(t));
      const ok = r.status === 201 && statusDesc === "Accepted" && out === exp;

      if (ok) passed++;
      results.push({
        input: t.input,
        expected: exp,
        actual: out,
        compile_output: r.body?.compile_output ?? null,
        stderr: r.body?.stderr ?? null,
        status: statusDesc,
        ok
      });
    }

    res.json({ results, passed, total: samples.length });
  } catch (e) {
    console.error('[Run] Error:', e);
    res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
  }
});

// Submit endpoint (for actual competition)
app.post('/api/submit', async (req, res) => {
  try {
    const { problemId, language, sourceCode, matchId, playerId } = req.body;
    console.log('[Submit] Request:', { problemId, language, matchId, playerId });

    if (!problemId || !language || !sourceCode) {
      return res.status(400).json({ error: "Missing problemId, language, or sourceCode" });
    }

    const language_id = LANG[language.toLowerCase()];
    if (!language_id) return res.status(400).json({ error: "Unsupported language" });

    // Get problem info
    const { data: prob, error: perr } = await supabase
      .from("problems")
      .select("test_case_path")
      .eq("id", problemId)
      .single();

    if (perr) {
      console.error('[Submit] Problem fetch error:', perr);
      return res.status(500).json({ error: "Failed to fetch problem", detail: perr.message });
    }

    // Download full tests from storage
    const tc = await getJSONFromStorage("test-cases", prob.test_case_path);

    let tests = [];
    if (Array.isArray(tc)) {
      tests = tc;
    } else if (tc?.tests) {
      tests = tc.tests;
    } else if (tc?.samples) {
      tests = tc.samples;
    }

    if (!tests.length) {
      return res.json({ passed: 0, total: 0, verdict: "No tests" });
    }

    const program = wrapSource(language, sourceCode);
    let passed = 0;
    const details = [];

    const sendProgress = async (currentPassed, totalTests) => {
      if (matchId && playerId) {
        try {
          await fetch('http://backend-api:3000/api/test-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, playerId, passed: currentPassed, total: totalTests })
          });
        } catch (error) {
          console.error('[Progress] Error:', error);
        }
      }
    };

    for (const t of tests) {
      const stdin = JSON.stringify(t.input ?? null);
      const r = await runSingleTest(language_id, program, stdin);

      const statusDesc = r.body?.status?.description ?? "Unknown";
      const stdout = r.body?.stdout ?? "";
      const stderr = r.body?.stderr ?? "";
      const compile_output = r.body?.compile_output ?? "";
      const out = canonicalize(r.body?.stdout ?? "");
      const exp = canonicalize(expectedAsString(t));
      const ok = r.status === 201 && statusDesc === "Accepted" && out === exp;

      if (ok) passed++;
      details.push({
        input: t.input,
        expected: expectedAsString(t),
        actual: stdout,
        compile_output,
        stderr,
        time: r.body?.time ?? 0,
        memory: r.body?.memory ?? 0,
        status: statusDesc,
        ok
      });

      await sendProgress(passed, tests.length);
    }

    const verdict = passed === tests.length ? "Accepted" : "Wrong Answer";
    res.json({ passed, total: tests.length, verdict, details });
  } catch (e) {
    console.error('[Submit] Error:', e);
    res.status(500).json({ error: "Internal error", detail: String(e?.message ?? e) });
  }
});

app.listen(PORT, () => {
  console.log(`Judge server running on port ${PORT}`);
  console.log(`Judge0 URL: ${JUDGE0_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
});


