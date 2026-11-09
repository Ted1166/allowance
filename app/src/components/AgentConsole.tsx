"use client";

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
