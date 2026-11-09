import { explorerTx, shortAddress, type NetworkName, type ReceiptView } from "@allowance/shared";
import { pathOf, timeOf, usdc } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function ReceiptRow({ receipt, network }: { receipt: ReceiptView; network: NetworkName }) {
    const settled = receipt.status === "settled";

    return (
        <li className="grid gap-x-6 gap-y-1 py-4 text-sm sm:grid-cols-[6rem_7rem_1fr_auto]">
            <span className="text-slate">{timeOf(receipt.timestamp)}</span>
            <span>
                <StatusBadge label={settled ? "Paid" : "Refused"} tone={settled ? "good" : "bad"} />
            </span>
            <span>
                {receipt.amount ? <span className="font-medium">{usdc(receipt.amount)} USDC</span> : null}
                {receipt.merchant ? <span className="text-slate"> to {shortAddress(receipt.merchant, 5)}</span> : null}
                {receipt.resource ? <span className="block text-slate">{pathOf(receipt.resource)}</span> : null}
                {receipt.reason ? <span className="block text-alarm">{receipt.reason}</span> : null}
            </span>
            {receipt.signature ? (
                <a className="text-ledger underline" href={explorerTx(receipt.signature, network)} target="_blank" rel="noreferrer">
                    View transaction
                </a>
            ) : (
                <span className="text-slate">Not sent</span>
            )}
        </li>
    );
}
