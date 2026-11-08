use anchor_lang::prelude::*;

#[event]
pub struct PaymentSettled {
    pub policy: Pubkey,
    pub agent: Pubkey,
    pub merchant: Pubkey,
    pub amount: u64,
    pub spent_today: u64,
    pub reference: [u8; 32],
    pub timestamp: i64,
}
