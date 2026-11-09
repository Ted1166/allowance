"use client";

import { LimitsForm } from "@/components/LimitsForm";
import { MerchantAllowlist } from "@/components/MerchantAllowlist";
import { usePolicy } from "@/hooks/usePolicy";
import { useIsOwner } from "@/hooks/useOwner";

export default function LimitsPage() {
    const { policy, loading, refresh } = usePolicy();
    const isOwner = useIsOwner(policy);

    if (loading) return <p className="text-slate">Loading the allowance</p>;

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-semibold">{policy ? "Limits" : "Create the allowance"}</h1>
                <p className="mt-3 max-w-xl text-slate">
                    The agent can only pay through these rules. Changing them needs the owner wallet, never the agent key.
                </p>
            </div>

            <section className="section">
                <h2 className="mb-4 text-xl font-semibold">Spending limits</h2>
                <LimitsForm key={policy ? "existing" : "new"} policy={policy} isOwner={isOwner} onDone={refresh} />
            </section>

            {policy ? (
                <section className="section">
                    <h2 className="mb-4 text-xl font-semibold">Merchants the agent may pay</h2>
                    <MerchantAllowlist policy={policy} isOwner={isOwner} onDone={refresh} />
                </section>
            ) : null}
        </div>
    );
}
