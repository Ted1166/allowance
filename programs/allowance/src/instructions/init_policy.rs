use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    errors::AllowanceError,
    state::{Policy, MAX_MERCHANTS, POLICY_SEED},
};

#[derive(Accounts)]
#[instruction(agent: Pubkey)]
pub struct InitPolicy<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = owner,
        space = 8 + Policy::INIT_SPACE,
        seeds = [POLICY_SEED, agent.as_ref()],
        bump
    )]
    pub policy: Account<'info, Policy>,

    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = policy,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitPolicy>,
    agent: Pubkey,
    per_call_cap: u64,
    daily_cap: u64,
    merchants: Vec<Pubkey>,
) -> Result<()> {
    require!(
        per_call_cap > 0 && daily_cap >= per_call_cap,
        AllowanceError::InvalidLimits
    );
    require!(
        merchants.len() <= MAX_MERCHANTS,
        AllowanceError::TooManyMerchants
    );

    let policy = &mut ctx.accounts.policy;
    policy.owner = ctx.accounts.owner.key();
    policy.agent = agent;
    policy.mint = ctx.accounts.mint.key();
    policy.per_call_cap = per_call_cap;
    policy.daily_cap = daily_cap;
    policy.spent_today = 0;
    policy.window_start = Clock::get()?.unix_timestamp;
    policy.frozen = false;
    policy.merchants = merchants;
    policy.bump = ctx.bumps.policy;
    Ok(())
}
