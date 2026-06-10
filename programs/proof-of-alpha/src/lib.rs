use anchor_lang::prelude::*;

declare_id!("9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD");

// ─── State ────────────────────────────────────────────────────────────────────

/// Singleton config PDA — seeds = ["config"]
/// Stores the backend authority keypair that can award AURA.
#[account]
pub struct ProgramConfig {
    pub authority: Pubkey, // 32 — backend keypair (server-side)
    pub bump: u8,          // 1
    // discriminator(8) + 32 + 1 = 41 bytes
}

impl ProgramConfig {
    pub const LEN: usize = 8 + 32 + 1;
}

/// Per-player AURA account — seeds = ["player", wallet]
/// Tracks the player's AURA balance, lifetime stats, and streak.
#[account]
pub struct PlayerAura {
    pub wallet: Pubkey,       // 32 — owner wallet
    pub balance: u64,         // 8  — spendable AURA (earned minus spent)
    pub lifetime_earned: u64, // 8  — all-time AURA earned
    pub games_played: u32,    // 4
    pub best_streak: u8,      // 1
    pub bump: u8,             // 1
    // discriminator(8) + 32 + 8 + 8 + 4 + 1 + 1 = 62 bytes
}

impl PlayerAura {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 4 + 1 + 1;
}

// ─── Contexts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = ProgramConfig::LEN,
        seeds = [b"config"],
        bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Player calls this once after connecting their wallet.
/// Creates their AURA account (player pays ~0.001 SOL rent).
#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(
        init,
        payer = wallet,
        space = PlayerAura::LEN,
        seeds = [b"player", wallet.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerAura>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Backend-only instruction. Auto-creates the player account if needed
/// so the backend never fails on first-time players.
#[derive(Accounts)]
pub struct AwardAura<'info> {
    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,

    #[account(
        init_if_needed,
        payer = authority,
        space = PlayerAura::LEN,
        seeds = [b"player", player_wallet.key().as_ref()],
        bump,
    )]
    pub player: Account<'info, PlayerAura>,

    /// CHECK: Only used as PDA seed — no data read. The backend resolves this from the wallet pubkey.
    pub player_wallet: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = authority.key() == config.authority @ AuraError::Unauthorized,
    )]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Player signs this to burn AURA from their balance.
/// Phase 2: this will also mint ALPHA tokens to the player.
/// Phase 1: just deducts balance (ALPHA mint not wired yet).
#[derive(Accounts)]
pub struct SpendAura<'info> {
    #[account(
        mut,
        seeds = [b"player", wallet.key().as_ref()],
        bump = player.bump,
        constraint = player.wallet == wallet.key() @ AuraError::Unauthorized,
    )]
    pub player: Account<'info, PlayerAura>,

    pub wallet: Signer<'info>,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum AuraError {
    #[msg("Not authorized")]
    Unauthorized,
    #[msg("Insufficient AURA balance")]
    InsufficientBalance,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
}

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod proof_of_alpha {
    use super::*;

    /// One-time setup. Call this once after deploying to set the backend authority.
    /// The authority keypair must be kept on the server — it never touches the client.
    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = authority;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    /// Create a PlayerAura account. Players call this once after connecting wallet.
    /// Costs ~0.001 SOL rent (returned when account is closed).
    pub fn init_player(ctx: Context<InitPlayer>) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.wallet = ctx.accounts.wallet.key();
        player.balance = 0;
        player.lifetime_earned = 0;
        player.games_played = 0;
        player.best_streak = 0;
        player.bump = ctx.bumps.player;
        Ok(())
    }

    /// Award AURA to a player after a game session.
    /// Called server-side (backend signs with authority keypair).
    /// Auto-creates the PlayerAura account if the player hasn't called init_player yet.
    ///
    /// Parameters:
    ///   amount — AURA to award (net after FLIRT/FLEX/LEAVE calculation done off-chain)
    ///   streak — current win streak (for leaderboard/stats)
    pub fn award_aura(ctx: Context<AwardAura>, amount: u64, streak: u8) -> Result<()> {
        require!(amount > 0, AuraError::ZeroAmount);

        let player = &mut ctx.accounts.player;

        // First-time init when account was just created via init_if_needed
        if player.wallet == Pubkey::default() {
            player.wallet = ctx.accounts.player_wallet.key();
            player.bump = ctx.bumps.player;
        }

        player.balance = player.balance.saturating_add(amount);
        player.lifetime_earned = player.lifetime_earned.saturating_add(amount);
        player.games_played = player.games_played.saturating_add(1);
        if streak > player.best_streak {
            player.best_streak = streak;
        }

        Ok(())
    }

    /// Burn AURA from a player's balance. Player must sign.
    /// Phase 1: deducts balance only.
    /// Phase 2: will also mint ALPHA tokens at the configured rate.
    pub fn spend_aura(ctx: Context<SpendAura>, amount: u64) -> Result<()> {
        require!(amount > 0, AuraError::ZeroAmount);
        let player = &mut ctx.accounts.player;
        require!(player.balance >= amount, AuraError::InsufficientBalance);
        player.balance = player.balance.saturating_sub(amount);
        Ok(())
    }
}
