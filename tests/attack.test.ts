import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { Keypair } from "@solana/web3.js";
import { payIx, setLimitsIx, toBaseUnits } from "@allowance/shared";
import { createScenario, expectRejection, type Scenario } from "./helpers";

const reference = () => Buffer.from(Keypair.generate().publicKey.toBytes());

describe("attacks on the allowance", () => {
    let scenario: Scenario;

    const pay = (amount: string, destination = scenario.merchantToken) =>
        payIx({
            programId: scenario.ctx.programId,
            agent: scenario.agent.publicKey,
            mint: scenario.mint,
            merchantToken: destination,
            amount: toBaseUnits(amount),
            reference: reference(),
        });

    before(async () => {
        scenario = await createScenario();
    });

    it("rejects an overspend above the per call cap", async () => {
        const failure = await expectRejection(scenario.ctx, [pay("25")], [scenario.agent]);
        assert.equal(failure.name, "OverPerCallCap");
    });

    it("rejects a payment to a merchant that is not on the allowlist", async () => {
        const failure = await expectRejection(scenario.ctx, [pay("0.1", scenario.outsiderToken)], [scenario.agent]);
        assert.equal(failure.name, "UnknownMerchant");
    });

    it("rejects a zero amount payment", async () => {
        const failure = await expectRejection(scenario.ctx, [pay("0")], [scenario.agent]);
        assert.equal(failure.name, "ZeroAmount");
    });

    it("rejects a different signer trying to use the agent policy", async () => {
        const thief = Keypair.generate();
        const instruction = pay("0.1");
        const [agentMeta, ...rest] = instruction.keys;
        assert.ok(agentMeta);
        instruction.keys = [{ ...agentMeta, pubkey: thief.publicKey }, ...rest];

        const failure = await expectRejection(scenario.ctx, [instruction], [thief]);
        assert.equal(failure.name, "ConstraintSeeds");
    });

    it("rejects the agent trying to raise its own limits", async () => {
        const instruction = setLimitsIx({
            programId: scenario.ctx.programId,
            owner: scenario.agent.publicKey,
            agent: scenario.agent.publicKey,
            perCallCap: toBaseUnits("1000"),
            dailyCap: toBaseUnits("1000"),
        });
        const failure = await expectRejection(scenario.ctx, [instruction], [scenario.agent]);
        assert.equal(failure.name, "ConstraintHasOne");
    });
});
