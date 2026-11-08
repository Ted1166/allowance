import type { AttackResult } from "@allowance/shared";
import type { AgentContext } from "../context";
import { landOnChain, type AttackMeta } from "./common";

export const overspendMeta: AttackMeta = {
    name: "overspend",
    title: "Overspend",
    description: "The agent signs a payment far above its per call limit to a merchant it is allowed to pay.",
};

export function overspend(ctx: AgentContext): Promise<AttackResult> {
    return landOnChain(ctx, overspendMeta, "/paid/dataset", [
        "The merchant is on the allowlist, so only the amount is wrong.",
        "The transaction was sent with preflight disabled so the failed attempt is recorded on chain.",
    ]);
}
