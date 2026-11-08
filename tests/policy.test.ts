import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { Keypair } from "@solana/web3.js";
import { getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { fetchPolicy, payIx, setFrozenIx, toBaseUnits, withdrawIx } from "@allowance/shared";
import { createScenario, expectRejection, send, type Scenario } from "./helpers";

const reference = () => Buffer.from(Keypair.generate().publicKey.toBytes());

describe("allowance policy", () => {
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

    it("creates the policy with the requested limits", async () => {
        const found = await fetchPolicy(scenario.ctx.connection, scenario.agent.publicKey, scenario.ctx.programId);
        assert.ok(found);
        assert.equal(found.state.perCallCap, toBaseUnits("0.5"));
        assert.equal(found.state.dailyCap, toBaseUnits("1"));
        assert.equal(found.state.frozen, false);
        assert.equal(found.state.merchants.length, 1);
    });

    it("lets the agent pay an allowed merchant within its limits", async () => {
        await send(scenario.ctx, [pay("0.3")], [scenario.agent]);

        const merchant = await getAccount(scenario.ctx.connection, scenario.merchantToken);
        assert.equal(merchant.amount, toBaseUnits("0.3"));

        const found = await fetchPolicy(scenario.ctx.connection, scenario.agent.publicKey, scenario.ctx.programId);
        assert.equal(found?.state.spentToday, toBaseUnits("0.3"));
    });

    it("refuses a payment that would pass the daily cap", async () => {
        await send(scenario.ctx, [pay("0.4")], [scenario.agent]);
        const failure = await expectRejection(scenario.ctx, [pay("0.4")], [scenario.agent]);
        assert.equal(failure.name, "OverDailyCap");
    });

    it("refuses every payment while the allowance is frozen", async () => {
        await send(
            scenario.ctx,
            [setFrozenIx({ programId: scenario.ctx.programId, owner: scenario.owner.publicKey, agent: scenario.agent.publicKey, frozen: true })],
            [scenario.owner],
        );
        const frozen = await expectRejection(scenario.ctx, [pay("0.01")], [scenario.agent]);
        assert.equal(frozen.name, "Frozen");

        await send(
            scenario.ctx,
            [setFrozenIx({ programId: scenario.ctx.programId, owner: scenario.owner.publicKey, agent: scenario.agent.publicKey, frozen: false })],
            [scenario.owner],
        );
        await send(scenario.ctx, [pay("0.01")], [scenario.agent]);
    });

    it("lets the owner withdraw what is left in the vault", async () => {
        const ownerToken = await getOrCreateAssociatedTokenAccount(
            scenario.ctx.connection,
            scenario.ctx.payer,
            scenario.mint,
            scenario.owner.publicKey,
        );
        const before = (await getAccount(scenario.ctx.connection, ownerToken.address)).amount;

        await send(
            scenario.ctx,
            [
                withdrawIx({
                    programId: scenario.ctx.programId,
                    signer: scenario.owner.publicKey,
                    agent: scenario.agent.publicKey,
                    mint: scenario.mint,
                    amount: toBaseUnits("1"),
                }),
            ],
            [scenario.owner],
        );

        const after = (await getAccount(scenario.ctx.connection, ownerToken.address)).amount;
        assert.equal(after - before, toBaseUnits("1"));
    });
});
