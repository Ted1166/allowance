import type { AttackName } from "@allowance/shared";
import { ATTACKS, createAgentContext, runAgent, runAttack } from "./index";

async function main() {
    const [command, ...rest] = process.argv.slice(2);
    const ctx = createAgentContext();

    if (command === "attacks") {
        const only = rest[0] as AttackName | undefined;
        const names = only ? [only] : ATTACKS.map((attack) => attack.name);
        for (const name of names) {
            const result = await runAttack(ctx, name);
            console.log(`\n${result.title} (${result.mode})`);
            console.log(`  outcome:   ${result.outcome}`);
            console.log(`  failure:   ${result.failure ? `${result.failure.name} - ${result.failure.message}` : "none"}`);
            if (result.explorerUrl) console.log(`  explorer:  ${result.explorerUrl}`);
            for (const note of result.notes) console.log(`  note:      ${note}`);
        }
        return;
    }

    if (command === "agent") {
        const task = rest.join(" ") || `Get the weather from ${ctx.serverUrl}/paid/weather and tell me what it says.`;
        const run = await runAgent(ctx, task);
        for (const step of run.steps) console.log(`${step.tool} ${JSON.stringify(step.input)}\n  ${step.output}`);
        console.log(`\n${run.answer}`);
        return;
    }

    console.log("Usage: cli.ts attacks [name] | cli.ts agent [task]");
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
