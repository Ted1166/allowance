import pathlib, sys

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")

def patch(path, old, new, marker):
    p = root / path
    s = p.read_text()
    if marker in s:
        print("already patched:", path)
        return
    if old not in s:
        sys.exit(f"could not find the anchor text in {path}")
    p.write_text(s.replace(old, new, 1))
    print("patched:", path)

patch(
    "agent/src/cli.ts",
    '  if (command === "agent") {',
    '''  if (command === "buy") {
    const route = rest[0] ?? "/paid/weather";
    const result = await payingFetch(ctx, `${ctx.serverUrl}${route}`);
    console.log(`status:    ${result.status}`);
    console.log(`paid:      ${result.paid}`);
    if (result.signature) console.log(`signature: ${result.signature}`);
    if (result.error) console.log(`error:     ${result.error}`);
    console.log(result.body);
    return;
  }

  if (command === "agent") {''',
    'command === "buy"',
)
patch(
    "agent/src/cli.ts",
    'import { ATTACKS, createAgentContext, runAgent, runAttack } from "./index";',
    'import { ATTACKS, createAgentContext, payingFetch, runAgent, runAttack } from "./index";',
    "payingFetch, runAgent",
)
patch(
    "server/src/index.ts",
    'import { ATTACKS, createAgentContext, runAgent, runAttack } from "@allowance/agent";',
    'import { ATTACKS, createAgentContext, payingFetch, runAgent, runAttack } from "@allowance/agent";',
    "payingFetch, runAgent",
)
patch(
    "server/src/index.ts",
    'app.use(merchantRoutes(',
    '''app.post("/api/demo/buy", async (req, res) => {
  const route = typeof req.body?.route === "string" ? req.body.route : "";
  if (!/^\\/paid\\/[a-z0-9/_-]+$/i.test(route)) {
    res.status(400).json({ error: "route must start with /paid/" });
    return;
  }
  try {
    const result = await payingFetch(agentContext, `${config.publicUrl}${route}`);
    res.json({ paid: result.paid, signature: result.signature, error: result.error, body: result.body });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Purchase failed" });
  }
});

app.use(merchantRoutes(''',
    'api/demo/buy',
)
patch(
    "app/src/lib/api.ts",
    '  runAgent: (task: string)',
    '''  buy: (route: string) =>
    request<{ paid: boolean; signature: string | null; error: string | null; body: string }>("/api/demo/buy", {
      method: "POST",
      body: JSON.stringify({ route }),
    }),
  runAgent: (task: string)''',
    "api/demo/buy",
)

(root / "app/src/components/AgentConsole.tsx").write_text('''"use client";

import { useState, type FormEvent } from "react";
import { explorerTx, type AgentRun } from "@allowance/shared";
import { api } from "@/lib/api";
import { useConfig } from "./Providers";

const PURCHASES = [
  { route: "/paid/weather", label: "Buy weather report", price: "0.01 USDC" },
  { route: "/paid/price/SOL", label: "Buy SOL price quote", price: "0.02 USDC" },
  { route: "/paid/summary", label: "Buy market summary", price: "0.05 USDC" },
];

type Purchase = { paid: boolean; signature: string | null; error: string | null; body: string };

function ManualPurchases() {
  const config = useConfig();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (route: string) => {
    setBusy(route);
    setError(null);
    try {
      setResult(await api.buy(route));
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "The purchase failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-xl">
      <p className="text-sm text-slate">
        The agent pays each request from its allowance. Add a model key on the server to let it decide what to buy on its own.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {PURCHASES.map((item) => (
          <button key={item.route} type="button" className="btn-primary" disabled={busy !== null} onClick={() => buy(item.route)}>
            {busy === item.route ? "Paying" : `${item.label} (${item.price})`}
          </button>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-alarm">{error}</p> : null}
      {result ? (
        <div className="mt-4 text-sm">
          <p className={result.paid ? "text-ledger" : "text-alarm"}>
            {result.paid ? "Paid and delivered" : `Refused: ${result.error ?? "payment failed"}`}
          </p>
          {result.signature ? (
            <a className="text-ledger underline" href={explorerTx(result.signature, config.network)} target="_blank" rel="noreferrer">
              View the transaction
            </a>
          ) : null}
          {result.paid ? <pre className="mt-2 overflow-x-auto bg-wash p-3 text-ink">{result.body}</pre> : null}
        </div>
      ) : null}
    </div>
  );
}

export function AgentConsole() {
  const config = useConfig();
  const [task, setTask] = useState(`Get the weather from ${config.serverUrl}/paid/weather and tell me what it says.`);
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<AgentRun | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setRun(await api.runAgent(task));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The agent failed");
    } finally {
      setBusy(false);
    }
  };

  if (!config.liveAgentEnabled) return <ManualPurchases />;

  return (
    <div className="max-w-xl">
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="task" className="label">
          Give the agent a task
        </label>
        <textarea id="task" className="field min-h-20" value={task} onChange={(event) => setTask(event.target.value)} />
        <button type="submit" className="btn-primary" disabled={busy || task.trim() === ""}>
          {busy ? "Agent is working" : "Run agent"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-alarm">{error}</p> : null}
      {run ? (
        <div className="mt-4 space-y-3 text-sm">
          {run.steps.map((step, index) => (
            <p key={index} className="text-slate">
              <span className="text-ink">{step.tool}</span> {JSON.stringify(step.input)}
            </p>
          ))}
          <p>{run.answer}</p>
        </div>
      ) : null}
    </div>
  );
}
''')
print("patched: app/src/components/AgentConsole.tsx")