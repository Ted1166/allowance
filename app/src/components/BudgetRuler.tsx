import { usdc } from "@/lib/format";

type Props = {
    spent: bigint;
    dailyCap: bigint;
    perCallCap: bigint;
    frozen?: boolean;
};

function share(value: bigint, total: bigint): number {
    if (total === 0n) return 0;
    return Math.min(100, Number((value * 10_000n) / total) / 100);
}

export function BudgetRuler({ spent, dailyCap, perCallCap, frozen = false }: Props) {
    const used = share(spent, dailyCap);
    const perCall = share(perCallCap, dailyCap);

    return (
        <div>
            <p className="font-display text-4xl font-semibold">
                {usdc(spent)}
                <span className="ml-2 text-lg font-normal text-slate">of {usdc(dailyCap)} USDC spent today</span>
            </p>
            <div
                role="meter"
                aria-label="Spent today"
                aria-valuemin={0}
                aria-valuemax={Number(dailyCap)}
                aria-valuenow={Number(spent)}
                className="relative mt-5 h-5 bg-wash"
            >
                <div className={frozen ? "h-full bg-alarm" : "h-full bg-ledger"} style={{ width: `${used}%` }} />
                <div className="absolute -inset-y-1.5 w-0.5 bg-ink" style={{ left: `${perCall}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate" style={{ marginLeft: `${Math.min(perCall, 65)}%` }}>
                Per call limit {usdc(perCallCap)}
            </p>
        </div>
    );
}
