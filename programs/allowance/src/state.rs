use anchor_lang::prelude::*;

pub const MAX_MERCHANTS: usize = 16;
pub const SECONDS_PER_DAY: i64 = 86_400;
pub const POLICY_SEED: &[u8] = b"policy";

#[account]
#[derive(InitSpace)]
pub struct Policy {
    pub owner: Pubkey,
    pub agent: Pubkey,
    pub mint: Pubkey,
    pub per_call_cap: u64,
    pub daily_cap: u64,
    pub spent_today: u64,
    pub window_start: i64,
    pub frozen: bool,
    #[max_len(16)]
    pub merchants: Vec<Pubkey>,
    pub bump: u8,
}

impl Policy {
    pub fn roll_window(&mut self, now: i64) {
        if now.saturating_sub(self.window_start) >= SECONDS_PER_DAY {
            self.window_start = now;
            self.spent_today = 0;
        }
    }

    pub fn allows_merchant(&self, merchant: &Pubkey) -> bool {
        self.merchants.iter().any(|allowed| allowed == merchant)
    }
}
