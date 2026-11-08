"use client";

import { useState, type FormEvent } from "react";
import type { AgentRun } from "@allowance/shared";
import { api } from "@/lib/api";
import { useConfig } from "./Providers";

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

    if (!config.liveAgentEnabled) {
        return <p className="max-w-xl text-sm text-slate">Set ANTHROPIC_API_KEY on the server to run the live agent here.</p>;
    }

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
