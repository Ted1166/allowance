use anchor_lang::prelude::*;

use crate::state::Policy;

#[derive(Accounts)]
pub struct SetFrozen<'info> {
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner)]
    pub policy: Account<'info, Policy>,
}

pub fn handler(ctx: Context<SetFrozen>, frozen: bool) -> Result<()> {
    ctx.accounts.policy.frozen = frozen;
    Ok(())
}
