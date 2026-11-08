use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{
    errors::AllowanceError,
    events::PaymentSettled,
    state::{Policy, POLICY_SEED},
};

#[derive(Accounts)]
pub struct Pay<'info> {
    pub agent: Signer<'info>,

    #[account(
        mut,
        seeds = [POLICY_SEED, agent.key().as_ref()],
        bump = policy.bump,
        has_one = agent,
        has_one = mint
    )]
    pub policy: Account<'info, Policy>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = policy,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint,
        token::token_program = token_program
    )]
    pub merchant_token: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handler(ctx: Context<Pay>, amount: u64, reference: [u8; 32]) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let merchant = ctx.accounts.merchant_token.owner;

    let policy = &mut ctx.accounts.policy;
    require!(!policy.frozen, AllowanceError::Frozen);
    require!(amount > 0, AllowanceError::ZeroAmount);
    require!(
        amount <= policy.per_call_cap,
        AllowanceError::OverPerCallCap
    );
    require!(
        policy.allows_merchant(&merchant),
        AllowanceError::UnknownMerchant
    );

    policy.roll_window(now);
    let spent_today = policy
        .spent_today
        .checked_add(amount)
        .ok_or(AllowanceError::Overflow)?;
    require!(
        spent_today <= policy.daily_cap,
        AllowanceError::OverDailyCap
    );
    policy.spent_today = spent_today;

    let agent = policy.agent;
    let bump = policy.bump;
    let policy_key = policy.key();

    let signer_seeds: &[&[&[u8]]] = &[&[POLICY_SEED, agent.as_ref(), &[bump]]];
    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.merchant_token.to_account_info(),
                authority: ctx.accounts.policy.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.mint.decimals,
    )?;

    emit!(PaymentSettled {
        policy: policy_key,
        agent,
        merchant,
        amount,
        spent_today,
        reference,
        timestamp: now,
    });
    Ok(())
}
