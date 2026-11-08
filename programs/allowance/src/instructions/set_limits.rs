use anchor_lang::prelude::*;

use crate::{errors::AllowanceError, state::Policy};

#[derive(Accounts)]
pub struct SetLimits<'info> {
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner)]
    pub policy: Account<'info, Policy>,
}

pub fn handler(ctx: Context<SetLimits>, per_call_cap: u64, daily_cap: u64) -> Result<()> {
    require!(
        per_call_cap > 0 && daily_cap >= per_call_cap,
        AllowanceError::InvalidLimits
    );
    let policy = &mut ctx.accounts.policy;
    policy.per_call_cap = per_call_cap;
    policy.daily_cap = daily_cap;
    Ok(())
}
