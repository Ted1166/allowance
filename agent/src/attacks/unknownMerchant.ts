import type { AttackResult } from "@allowance/shared";
import type { AgentContext } from "../context";
import { landOnChain, type AttackMeta } from "./common";

export const unknownMerchantMeta: AttackMeta = {
    name: "unknownMerchant",
    title: "Unknown merchant",
    description: "The agent pays a small amount, within its limits, to an address that is not on the allowlist.",
};

export function unknownMerchant(ctx: AgentContext): Promise<AttackResult> {
    return landOnChain(ctx, unknownMerchantMeta, "/evil/data", [
        "The amount is under the per call limit, so only the destination is wrong.",
        "The transaction was sent with preflight disabled so the failed attempt is recorded on chain.",
    ]);
}
