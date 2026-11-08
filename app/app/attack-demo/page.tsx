"use client";

import { useState } from "react";
import type { AttackName, AttackResult } from "@allowance/shared";
import { AttackResultCard } from "@/components/AttackResultCard";
import { useConfig } from "@/components/Providers";
import { api } from "@/lib/api";

const ATTACKS: { name: AttackName; title: string; summary: string }[] = [
    { name: "overspend", title: "Overspend", summary: "Pay 25 USDC to an allowed merchant." },
    { name: "unknownMerchant", title: "Unknown merchant", summary: "Pay a small amount to an address off the allowlist." },
    { name: "promptInjection", title: "Prompt injection", summary: "A web page tells the agent to pay an attacker." },
    { name: "frozen", title: "Frozen allowance", summary: "Make a normal purchase after hitting the kill switch." },
];

export default function AttackDemoPage() {
    const config = useConfig();
    const [results, setResults] = useState<Partial<Record<AttackName, AttackResult>>>({});
    const [running, setRunning] = useState<AttackName | null>(null);
    const [error, setError] = useState<string | null>(null);

    const run = async (name: AttackName) => {
        setRunning(name);
        setError(null);
        try {
            const result = await api.runAttack(name, config.liveAgentEnabled ? "live" : "scripted");
            setResults((current) => ({ ...current, [name]: result }));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The attack could not run");
        } finally {
            setRunning(null);
        }
    };

    const runAll = async () => {
        for (const attack of ATTACKS) await run(attack.name);
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold">Attack demo</h1>
            <p className="mt-3 max-w-xl text-slate">
                Each attack uses the real agent key against the real program. A refused attack is the product working.
            </p>
            <button type="button" className="btn-primary mt-6" onClick={runAll} disabled={running !== null}>
                {running ? "Running" : "Run all attacks"}
            </button>
            {error ? <p className="mt-3 text-sm text-alarm">{error}</p> : null}

            <div className="mt-10 space-y-8">
                {ATTACKS.map((attack) => {
                    const result = results[attack.name];
                    if (result) return <AttackResultCard key={attack.name} result={result} />;
                    return (
                        <div key={attack.name} className="section">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-semibold">{attack.title}</h3>
                                    <p className="text-sm text-slate">{attack.summary}</p>
                                </div>
                                <button type="button" className="btn-quiet" onClick={() => run(attack.name)} disabled={running !== null}>
                                    {running === attack.name ? "Running" : "Run"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
