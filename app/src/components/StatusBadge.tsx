type Tone = "good" | "bad" | "neutral";

const tones: Record<Tone, string> = {
    good: "border-ledger text-ledger",
    bad: "border-alarm text-alarm",
    neutral: "border-line text-slate",
};

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
    return <span className={`inline-block rounded-sm border px-2 py-0.5 text-sm ${tones[tone]}`}>{label}</span>;
}
