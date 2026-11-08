import type { AttackResult } from "@allowance/shared";
import type { AgentContext } from "../context";
import { landOnChain, type AttackMeta } from "./common";

export const frozenMeta: AttackMeta = {
    name: "frozen",
    title: "Frozen allowance",
    description: "The agent makes an ordinary, in-policy purchase. Freeze the allowance first to see it refused.",
};

export function frozen(ctx: AgentContext): Promise<AttackResult> {
    return landOnChain(ctx, frozenMeta, "/paid/weather", [
        "With the allowance active this purchase succeeds. After the kill switch it fails with Frozen.",
    ]);
}
