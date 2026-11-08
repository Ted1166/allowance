export type TextBlock = { type: "text"; text: string };
export type ToolUseBlock = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
export type ToolResultBlock = { type: "tool_result"; tool_use_id: string; content: string };
export type ContentBlock = TextBlock | ToolUseBlock;

export type ChatMessage = {
    role: "user" | "assistant";
    content: string | Array<ContentBlock | ToolResultBlock>;
};

export type ToolDefinition = {
    name: string;
    description: string;
    input_schema: { type: "object"; properties: Record<string, unknown>; required: string[] };
};

type CreateMessageParams = {
    apiKey: string;
    model: string;
    system: string;
    tools: ToolDefinition[];
    messages: ChatMessage[];
};

export async function createMessage(params: CreateMessageParams): Promise<{ content: ContentBlock[] }> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-api-key": params.apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: params.model,
            max_tokens: 1024,
            system: params.system,
            tools: params.tools,
            messages: params.messages,
        }),
    });
    if (!response.ok) {
        throw new Error(`Anthropic API returned ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as { content: ContentBlock[] };
}
