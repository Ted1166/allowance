import type { AttackName, AttackResult } from "@allowance/shared";
import type { AgentContext } from "../context";
import { frozen, frozenMeta } from "./frozen";
import { overspend, overspendMeta } from "./overspend";
import { promptInjection, promptInjectionMeta } from "./promptInjection";
import { unknownMerchant, unknownMerchantMeta } from "./unknownMerchant";

export const ATTACKS = [overspendMeta, unknownMerchantMeta, promptInjectionMeta, frozenMeta];

export type AttackOptions = { mode?: "live" | "scripted" };

export async function runAttack(ctx: AgentContext, name: AttackName, options: AttackOptions = {}): Promise<AttackResult> {
    switch (name) {
        case "overspend":
            return overspend(ctx);
        case "unknownMerchant":
            return unknownMerchant(ctx);
        case "promptInjection":
            return promptInjection(ctx, options.mode ?? (process.env.ANTHROPIC_API_KEY ? "live" : "scripted"));
        case "frozen":
            return frozen(ctx);
        default:
            throw new Error(`Unknown attack: ${name as string}`);
    }
}
