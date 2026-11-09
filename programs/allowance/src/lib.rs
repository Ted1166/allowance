use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("CBB2oPofX2GmqYcCK2K5CNgjioLwigHXDhoB8U8D3Cwk");

#[program]
pub mod allowance {
    use super::*;

    pub fn init_policy(
        ctx: Context<InitPolicy>,
        agent: Pubkey,
        per_call_cap: u64,
        daily_cap: u64,
        merchants: Vec<Pubkey>,
    ) -> Result<()> {
        instructions::init_policy::handler(ctx, agent, per_call_cap, daily_cap, merchants)
    }

    pub fn set_limits(ctx: Context<SetLimits>, per_call_cap: u64, daily_cap: u64) -> Result<()> {
        instructions::set_limits::handler(ctx, per_call_cap, daily_cap)
    }

    pub fn set_merchants(ctx: Context<SetMerchants>, merchants: Vec<Pubkey>) -> Result<()> {
        instructions::set_merchants::handler(ctx, merchants)
    }

    pub fn set_frozen(ctx: Context<SetFrozen>, frozen: bool) -> Result<()> {
        instructions::freeze::handler(ctx, frozen)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    pub fn pay(ctx: Context<Pay>, amount: u64, reference: [u8; 32]) -> Result<()> {
        instructions::pay::handler(ctx, amount, reference)
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        instructions::withdraw::handler(ctx, amount)
    }
}
