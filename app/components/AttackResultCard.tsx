import type { AttackResult } from "@allowance/shared";
import { StatusBadge } from "./StatusBadge";

const MODE_LABEL: Record<AttackResult["mode"], string> = {
    onchain: "Sent to the program",
    "live-agent": "Live model",
    "scripted-agent": "Scripted agent",
};

export function AttackResultCard({ result }: { result: AttackResult }) {
    const refused = result.outcome === "rejected";

    return (
        <div className="section">
            <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold">{result.title}</h3>
                <StatusBadge
                    label={refused ? "Refused" : result.outcome === "settled" ? "Went through" : "No attempt"}
                    tone={refused ? "good" : result.outcome === "settled" ? "bad" : "neutral"}
                />
                <span className="text-sm text-slate">{MODE_LABEL[result.mode]}</span>
            </div>
            {result.failure ? (
                <p className="mt-2 font-medium">
                    {result.failure.name}
                    <span className="font-normal text-slate"> {result.failure.message}</span>
                </p>
            ) : null}
            <ul className="mt-2 space-y-1 text-sm text-slate">
                {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                ))}
            </ul>
            {result.explorerUrl ? (
                <a className="mt-2 inline-block text-sm text-ledger underline" href={result.explorerUrl} target="_blank" rel="noreferrer">
                    View the transaction on Solana Explorer
                </a>
            ) : null}
        </div>
    );
}
