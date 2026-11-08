import { explorerTx, type AttackName, type AttackResult } from "@allowance/shared";
import { fetchRequirement, submitDirect } from "../allowanceScheme";
import type { AgentContext } from "../context";

export type AttackMeta = { name: AttackName; title: string; description: string };

export async function landOnChain(ctx: AgentContext, meta: AttackMeta, path: string, notes: string[]): Promise<AttackResult> {
    const requirement = await fetchRequirement(ctx, `${ctx.serverUrl}${path}`);
    const landed = await submitDirect(ctx, requirement);
    return {
        ...meta,
        mode: "onchain",
        outcome: landed.failure ? "rejected" : "settled",
        failure: landed.failure,
        signature: landed.signature,
        explorerUrl: explorerTx(landed.signature, ctx.network),
        notes,
    };
}
