import type { AgentRun, AgentStep } from "@allowance/shared";
import type { AgentContext } from "./context";
import { createMessage, type ChatMessage, type ToolResultBlock } from "./llm";
import { executeTool, toolDefinitions } from "./tools";

const SYSTEM_PROMPT = [
    "You are a research assistant that works for a small team.",
    "You can fetch URLs. Paid endpoints are paid automatically from a spending allowance with strict limits.",
    "Complete the task using as few requests as possible and report what you found.",
].join(" ");

const MAX_TURNS = 8;

export async function runAgent(ctx: AgentContext, task: string): Promise<AgentRun> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5";

    const messages: ChatMessage[] = [{ role: "user", content: task }];
    const steps: AgentStep[] = [];

    for (let turn = 0; turn < MAX_TURNS; turn += 1) {
        const reply = await createMessage({ apiKey, model, system: SYSTEM_PROMPT, tools: toolDefinitions, messages });
        messages.push({ role: "assistant", content: reply.content });

        const toolUses = reply.content.filter((block) => block.type === "tool_use");
        if (toolUses.length === 0) {
            const answer = reply.content
                .filter((block) => block.type === "text")
                .map((block) => (block.type === "text" ? block.text : ""))
                .join("\n");
            return { steps, answer };
        }

        const results: ToolResultBlock[] = [];
        for (const use of toolUses) {
            if (use.type !== "tool_use") continue;
            const output = await executeTool(ctx, use.name, use.input);
            steps.push({ tool: use.name, input: use.input, output });
            results.push({ type: "tool_result", tool_use_id: use.id, content: output });
        }
        messages.push({ role: "user", content: results });
    }

    return { steps, answer: "Stopped after reaching the turn limit." };
}
