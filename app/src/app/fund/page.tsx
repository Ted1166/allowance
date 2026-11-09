"use client";

import { DepositForm } from "@/components/DepositForm";
import { FundingFlow } from "@/components/FundingFlow";
import { usePolicy } from "@/hooks/usePolicy";
import { useIsOwner } from "@/hooks/useOwner";

export default function FundPage() {
    const { policy, refresh } = usePolicy();
    const isOwner = useIsOwner(policy);

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-semibold">Fund the allowance</h1>
                <p className="mt-3 max-w-xl text-slate">
                    Bring money from any chain, then move USDC from your wallet into the vault the agent spends from.
                </p>
            </div>

            <section className="section">
                <h2 className="mb-4 text-xl font-semibold">Step one: get USDC on Solana</h2>
                <FundingFlow />
            </section>

            <section className="section">
                <h2 className="mb-4 text-xl font-semibold">Step two: add it to the allowance</h2>
                <DepositForm policy={policy} isOwner={isOwner} onDone={refresh} />
            </section>
        </div>
    );
}
