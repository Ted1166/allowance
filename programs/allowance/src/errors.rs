use anchor_lang::prelude::*;

#[error_code]
pub enum AllowanceError {
    #[msg("The policy is frozen")]
    Frozen,
    #[msg("Amount exceeds the per call cap")]
    OverPerCallCap,
    #[msg("Amount exceeds the daily cap")]
    OverDailyCap,
    #[msg("Merchant is not on the allowlist")]
    UnknownMerchant,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Too many merchants on the allowlist")]
    TooManyMerchants,
    #[msg("Daily cap must be at least the per call cap")]
    InvalidLimits,
    #[msg("Arithmetic overflow")]
    Overflow,
}
