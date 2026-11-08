"use client";

import { useConfig } from "@/components/Providers";
import { ReceiptRow } from "@/components/ReceiptRow";
import { useReceipts } from "@/hooks/useReceipts";

export default function ReceiptsPage() {
    const config = useConfig();
    const receipts = useReceipts();

    return (
        <div>
            <h1 className="text-3xl font-semibold">Receipts</h1>
            <p className="mt-3 max-w-xl text-slate">Every payment the agent makes, and every one the program refuses, as it happens.</p>
            <div className="section mt-8">
                {receipts.length === 0 ? (
                    <p className="text-sm text-slate">No activity yet.</p>
                ) : (
                    <ul className="divide-y divide-line">
                        {receipts.map((receipt) => (
                            <ReceiptRow key={receipt.id} receipt={receipt} network={config.network} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
