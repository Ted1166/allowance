use anchor_lang::prelude::*;

use crate::{
    errors::AllowanceError,
    state::{Policy, MAX_MERCHANTS},
};

#[derive(Accounts)]
pub struct SetMerchants<'info> {
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner)]
    pub policy: Account<'info, Policy>,
}

pub fn handler(ctx: Context<SetMerchants>, merchants: Vec<Pubkey>) -> Result<()> {
    require!(
        merchants.len() <= MAX_MERCHANTS,
        AllowanceError::TooManyMerchants
    );
    ctx.accounts.policy.merchants = merchants;
    Ok(())
}
