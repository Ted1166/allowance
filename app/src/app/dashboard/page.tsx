"use client";

import Link from "next/link";
import { spentInWindow } from "@allowance/shared";
import { AgentConsole } from "@/components/AgentConsole";
import { BudgetRuler } from "@/components/BudgetRuler";
import { KillSwitch } from "@/components/KillSwitch";
import { useConfig } from "@/components/Providers";
import { ReceiptRow } from "@/components/ReceiptRow";
import { StatusBadge } from "@/components/StatusBadge";
import { usePolicy } from "@/hooks/usePolicy";
import { useIsOwner } from "@/hooks/useOwner";
import { useReceipts } from "@/hooks/useReceipts";
import { usdc } from "@/lib/format";

export default function DashboardPage() {
    const config = useConfig();
    const { policy, vaultBalance, loading, refresh } = usePolicy();
    const isOwner = useIsOwner(policy);
    const receipts = useReceipts();

    if (loading) return <p className="text-slate">Loading the allowance</p>;

    if (!policy) {
        return (
            <div className="max-w-xl">
                <h1 className="text-3xl font-semibold">No allowance yet</h1>
                <p className="mt-3 text-slate">Set the limits for the agent to create its allowance. It takes one transaction.</p>
                <Link href="/limits" className="btn-primary mt-6">
                    Set limits
                </Link>
            </div>
        );
    }

    const spent = spentInWindow(policy, Math.floor(Date.now() / 1000));

    return (
        <div className="space-y-12">
            <div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold">Agent allowance</h1>
                    <StatusBadge label={policy.frozen ? "Frozen" : "Active"} tone={policy.frozen ? "bad" : "good"} />
                </div>
                <div className="max-w-2xl">
                    <BudgetRuler spent={spent} dailyCap={policy.dailyCap} perCallCap={policy.perCallCap} frozen={policy.frozen} />
                </div>
            </div>

            <dl className="grid gap-6 sm:grid-cols-3">
                <div className="section">
                    <dt className="text-sm text-slate">Left in the vault</dt>
                    <dd className="mt-1 font-display text-2xl font-semibold">{usdc(vaultBalance)} USDC</dd>
                </div>
                <div className="section">
                    <dt className="text-sm text-slate">Allowed merchants</dt>
                    <dd className="mt-1 font-display text-2xl font-semibold">{policy.merchants.length}</dd>
                </div>
                <div className="section">
                    <dt className="text-sm text-slate">Network</dt>
                    <dd className="mt-1 font-display text-2xl font-semibold">{config.network === "mainnet" ? "Mainnet" : "Devnet"}</dd>
                </div>
            </dl>

            <section className="section">
                <h2 className="mb-4 text-xl font-semibold">Kill switch</h2>
                <KillSwitch policy={policy} isOwner={isOwner} onDone={refresh} />
            </section>

            <section className="section">
                <h2 className="mb-4 text-xl font-semibold">Run the agent</h2>
                <AgentConsole />
            </section>

            <section className="section">
                <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="text-xl font-semibold">Recent activity</h2>
                    <Link href="/receipts" className="text-sm text-ledger underline">
                        All receipts
                    </Link>
                </div>
                {receipts.length === 0 ? (
                    <p className="text-sm text-slate">Nothing yet. Run the agent or the attack demo to see activity here.</p>
                ) : (
                    <ul className="divide-y divide-line">
                        {receipts.slice(0, 5).map((receipt) => (
                            <ReceiptRow key={receipt.id} receipt={receipt} network={config.network} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
