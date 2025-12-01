import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// UI language -> Judge0 language_id
const LANG: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  c: 50,
  cpp: 54,
  csharp: 51
};

function normalize(s: string | null | undefined) {
  return (s ?? "").trim().replace(/\r\n/g, "\n");
}
function expectedAsString(t: any) {
    const v = (t && t.expected !== undefined) ? t.expected : t?.output;
    return typeof v === "string" ? v : JSON.stringify(v ?? "");
}
function canonicalize(s: string) {
    const t = (s ?? "").trim();
    try {
      // If it's JSON (arrays/objects/numbers/booleans), normalize formatting
      return JSON.stringify(JSON.parse(t));
    } catch {
      // Not JSON -> compare trimmed string as-is
      return t;
    }
}
function wrapSource(language: string, user: string) {
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

  // For other languages, expect a full program for now.
  return user;
}

async function runSingleTest(language_id: number, source_code: string, stdin: string) {
    const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language_id, source_code, stdin })
      });
    } catch (err: any) {
      return { status: 0, body: null, raw: null, error: String(err) };
    }
  
    const text = await res.text(); // may be empty or non-JSON
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
  
    return { status: res.status, body, raw: text };
}
async function getJSONFromStorage(bucket: string, key: string) {
  const dl = await supabase.storage.from(bucket).download(key);
  if (dl.error) throw new Error(`storage download failed: ${dl.error.message}`);
  if (!dl.data) throw new Error(`storage download failed: empty body for ${bucket}/${key}`);
  const text = await dl.data.text();
  return JSON.parse(text);
}

export async function run(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const { problemId, language, sourceCode } = await request.json() as {
      problemId: string; language: string; sourceCode: string;
    };

    if (!problemId || !language || !sourceCode) {
      return { status: 400, jsonBody: { error: "Missing problemId, language, or sourceCode" } };
    }
    const language_id = LANG[language.toLowerCase()];
    if (!language_id) return { status: 400, jsonBody: { error: "Unsupported language" } };

    // Get filenames for this problem
    const { data: prob, error: perr } = await supabase
      .from("problems")
      .select("test_case_path, starter_code_path")
      .eq("id", problemId)
      .single();
    if (perr) return { status: 500, jsonBody: { error: "Failed to fetch problem", detail: perr.message } };

    // Download test file JSON from 'test-cases' bucket
    const tc = await getJSONFromStorage("test-cases", prob.test_case_path);

    // For run: prefer samples; otherwise first few tests/array items
    let samples: Array<{ input: any; output: any }> = [];
    if (Array.isArray(tc)) {
      samples = tc.slice(0, Math.min(3, tc.length));
    } else if (tc?.samples) {
      samples = tc.samples;
    } else if (tc?.tests) {
      samples = tc.tests.slice(0, Math.min(3, tc.tests.length));
    }

    if (!samples.length) return { status: 200, jsonBody: { results: [], passed: 0, total: 0 } };

    const program = wrapSource(language, sourceCode);
    const results: Array<Record<string, unknown>> = [];
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
        status: r.body?.status?.description ?? "Unknown",
        ok
      });
    }

    return { status: 200, jsonBody: { results, passed, total: samples.length } };
  } catch (e: any) {
    context.error(e);
    return { status: 500, jsonBody: { error: "Internal error", detail: String(e?.message ?? e) } };
  }
}

app.http("run", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: run
});