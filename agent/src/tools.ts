import { fetchPolicy, formatUnits, remainingToday } from "@allowance/shared";
import { payingFetch } from "./allowanceScheme";
import type { AgentContext } from "./context";
import type { ToolDefinition } from "./llm";

export const toolDefinitions: ToolDefinition[] = [
    {
        name: "fetch_url",
        description:
            "Fetch a web page or API endpoint. If the endpoint asks for payment, the cost is paid automatically from the agent's allowance.",
        input_schema: {
            type: "object",
            properties: { url: { type: "string", description: "Absolute URL to fetch" } },
            required: ["url"],
        },
    },
    {
        name: "get_budget",
        description: "Check how much of the allowance is left for today and the per call limit.",
        input_schema: { type: "object", properties: {}, required: [] },
    },
];

export async function executeTool(ctx: AgentContext, name: string, input: Record<string, unknown>): Promise<string> {
    if (name === "fetch_url") {
        const url = String(input.url ?? "");
        const result = await payingFetch(ctx, url);
        return JSON.stringify({
            status: result.status,
            paid: result.paid,
            amountPaid: result.paid && result.amount ? formatUnits(BigInt(result.amount)) : null,
            error: result.error,
            body: result.body.slice(0, 2000),
        });
    }

    if (name === "get_budget") {
        const found = await fetchPolicy(ctx.connection, ctx.agent.publicKey, ctx.programId);
        if (!found) return JSON.stringify({ error: "No allowance has been created for this agent" });
        const { state } = found;
        return JSON.stringify({
            frozen: state.frozen,
            perCallLimit: formatUnits(state.perCallCap),
            remainingToday: formatUnits(remainingToday(state, Math.floor(Date.now() / 1000))),
        });
    }

    return JSON.stringify({ error: `Unknown tool ${name}` });
}
