use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash as sha256_hash;

declare_id!("9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD");

pub const MAX_PLAYERS: usize = 6;
pub const WINNING_ROUNDS: u8 = 5;
pub const STARTING_BALANCE: u32 = 100;
pub const ENTRY_LAMPORTS: u64 = 1_000_000; // 0.001 SOL per player

// Phase IDs
pub mod phase {
    pub const LOBBY: u8 = 0;
    pub const COMMIT: u8 = 1;
    pub const REVEAL: u8 = 2;
    pub const RESOLVE: u8 = 3;
    pub const FINISHED: u8 = 4;
}

// Move IDs — must match client MOVE_ID_MAP
pub mod move_id {
    pub const TAX: u8 = 0;
    pub const STEAL: u8 = 1;
    pub const ROB: u8 = 2;
    pub const BLUFF: u8 = 3;
    pub const COUNTER: u8 = 4;
    pub const NUKE: u8 = 5;
    pub const FOLD: u8 = 6;
}

// Modifier IDs
pub mod modifier {
    pub const STANDARD: u8 = 0;
    pub const GREED_MODE: u8 = 1;
    pub const CHAOS_MODE: u8 = 2;
    pub const SCARCITY: u8 = 3;
    pub const FINAL_STAND: u8 = 4;
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct GameRoom {
    pub room_code: [u8; 4],          // 4
    pub modifier: u8,                // 1
    pub round: u8,                   // 1
    pub phase: u8,                   // 1
    pub player_count: u8,            // 1
    pub creator: Pubkey,             // 32
    pub bump: u8,                    // 1
    pub created_at: i64,             // 8
    pub players: [PlayerEntry; 6],   // 6 × 76 = 456
    // Total (without discriminator): 505
}

impl GameRoom {
    pub const LEN: usize = 8 + 505; // discriminator + data
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Default)]
pub struct PlayerEntry {
    pub pubkey: Pubkey,      // 32
    pub archetype: u8,       // 1
    pub balance: u32,        // 4
    pub round_wins: u8,      // 1
    pub move_hash: [u8; 32], // 32
    pub move_revealed: u8,   // 1
    pub target_revealed: u8, // 1
    pub has_committed: bool, // 1
    pub has_revealed: bool,  // 1
    pub is_bot: bool,        // 1
    pub is_eliminated: bool, // 1
    // Total: 76
}

// ─── Contexts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(room_code: [u8; 4])]
pub struct CreateGame<'info> {
    #[account(
        init,
        payer = creator,
        space = GameRoom::LEN,
        seeds = [b"game", &room_code],
        bump,
    )]
    pub game: Account<'info, GameRoom>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddBot<'info> {
    #[account(mut, seeds = [b"game", &game.room_code], bump = game.bump)]
    pub game: Account<'info, GameRoom>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut, seeds = [b"game", &game.room_code], bump = game.bump)]
    pub game: Account<'info, GameRoom>,
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct CommitMove<'info> {
    #[account(mut, seeds = [b"game", &game.room_code], bump = game.bump)]
    pub game: Account<'info, GameRoom>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RevealMove<'info> {
    #[account(mut, seeds = [b"game", &game.room_code], bump = game.bump)]
    pub game: Account<'info, GameRoom>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveRound<'info> {
    #[account(mut, seeds = [b"game", &game.room_code], bump = game.bump)]
    pub game: Account<'info, GameRoom>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseGame<'info> {
    #[account(
        mut,
        seeds = [b"game", &game.room_code],
        bump = game.bump,
        close = creator,
    )]
    pub game: Account<'info, GameRoom>,
    #[account(mut)]
    pub creator: Signer<'info>,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum GameError {
    #[msg("Wrong phase for this instruction")]
    WrongPhase,
    #[msg("Room is full")]
    RoomFull,
    #[msg("Not enough players to start")]
    NotEnoughPlayers,
    #[msg("Player not found in this room")]
    PlayerNotFound,
    #[msg("Player is already eliminated")]
    PlayerEliminated,
    #[msg("Move already committed this round")]
    AlreadyCommitted,
    #[msg("Move already revealed this round")]
    AlreadyRevealed,
    #[msg("Must commit before revealing")]
    NotCommitted,
    #[msg("Reveal hash does not match commitment")]
    HashMismatch,
    #[msg("Not authorized for this action")]
    Unauthorized,
    #[msg("Game is not finished yet")]
    GameNotFinished,
    #[msg("Move not allowed by current modifier")]
    ModifierBlocked,
}

// ─── Program ──────────────────────────────────────────────────────────────────

#[program]
pub mod proof_of_alpha {
    use super::*;

    /// Create a game room. Creator is added as player 0 and pays entry.
    pub fn create_game(
        ctx: Context<CreateGame>,
        room_code: [u8; 4],
        modifier: u8,
        archetype: u8,
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        game.room_code = room_code;
        game.modifier = modifier;
        game.round = 1;
        game.phase = phase::LOBBY;
        game.player_count = 0;
        game.creator = ctx.accounts.creator.key();
        game.bump = ctx.bumps.game;
        game.created_at = Clock::get()?.unix_timestamp;

        game.players[0] = PlayerEntry {
            pubkey: ctx.accounts.creator.key(),
            archetype,
            balance: STARTING_BALANCE,
            ..Default::default()
        };
        game.player_count = 1;

        // Creator pays entry deposit into the PDA
        anchor_lang::solana_program::program::invoke(
            &anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.creator.key(),
                &ctx.accounts.game.key(),
                ENTRY_LAMPORTS,
            ),
            &[
                ctx.accounts.creator.to_account_info(),
                ctx.accounts.game.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    /// Add a bot player. Only creator may call; bot's pubkey is an ephemeral key.
    pub fn add_bot(ctx: Context<AddBot>, archetype: u8, bot_pubkey: Pubkey) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require_keys_eq!(ctx.accounts.creator.key(), game.creator, GameError::Unauthorized);
        require!(game.phase == phase::LOBBY, GameError::WrongPhase);
        require!((game.player_count as usize) < MAX_PLAYERS, GameError::RoomFull);

        let idx = game.player_count as usize;
        game.players[idx] = PlayerEntry {
            pubkey: bot_pubkey,
            archetype,
            balance: STARTING_BALANCE,
            is_bot: true,
            ..Default::default()
        };
        game.player_count += 1;
        Ok(())
    }

    /// Start the game. Requires all 6 player slots filled.
    pub fn start_game(ctx: Context<StartGame>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require_keys_eq!(ctx.accounts.creator.key(), game.creator, GameError::Unauthorized);
        require!(game.phase == phase::LOBBY, GameError::WrongPhase);
        require!((game.player_count as usize) == MAX_PLAYERS, GameError::NotEnoughPlayers);
        game.phase = phase::COMMIT;
        Ok(())
    }

    /// Commit a hashed move.
    /// For bots, the creator may commit on their behalf.
    pub fn commit_move(
        ctx: Context<CommitMove>,
        player_idx: u8,
        move_hash: [u8; 32],
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.phase == phase::COMMIT, GameError::WrongPhase);

        let idx = player_idx as usize;
        require!(idx < game.player_count as usize, GameError::PlayerNotFound);
        require!(!game.players[idx].is_eliminated, GameError::PlayerEliminated);
        require!(!game.players[idx].has_committed, GameError::AlreadyCommitted);

        // Auth: real player signs themselves; creator signs for bots
        let authorized = if game.players[idx].is_bot {
            ctx.accounts.signer.key() == game.creator
        } else {
            ctx.accounts.signer.key() == game.players[idx].pubkey
        };
        require!(authorized, GameError::Unauthorized);

        // Scarcity blocks Rob (5) and NUKE (6) — but hash is opaque, enforced at reveal
        game.players[idx].move_hash = move_hash;
        game.players[idx].has_committed = true;

        // Auto-advance when all alive players committed
        if game.players[..game.player_count as usize]
            .iter()
            .filter(|p| !p.is_eliminated)
            .all(|p| p.has_committed)
        {
            game.phase = phase::REVEAL;
        }

        Ok(())
    }

    /// Reveal a move. Program verifies SHA-256(move_id || target_idx || salt) == committed hash.
    pub fn reveal_move(
        ctx: Context<RevealMove>,
        player_idx: u8,
        move_id: u8,
        target_idx: u8,
        salt: [u8; 32],
    ) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(game.phase == phase::REVEAL, GameError::WrongPhase);

        let idx = player_idx as usize;
        require!(idx < game.player_count as usize, GameError::PlayerNotFound);
        require!(!game.players[idx].is_eliminated, GameError::PlayerEliminated);
        require!(game.players[idx].has_committed, GameError::NotCommitted);
        require!(!game.players[idx].has_revealed, GameError::AlreadyRevealed);

        // Enforce Scarcity modifier: Rob and NUKE blocked
        if game.modifier == modifier::SCARCITY {
            require!(
                move_id != move_id::ROB && move_id != move_id::NUKE,
                GameError::ModifierBlocked
            );
        }

        // Auth check
        let authorized = if game.players[idx].is_bot {
            ctx.accounts.signer.key() == game.creator
        } else {
            ctx.accounts.signer.key() == game.players[idx].pubkey
        };
        require!(authorized, GameError::Unauthorized);

        // Verify hash: SHA256(move_id || target_idx || salt)
        let mut preimage = [0u8; 34];
        preimage[0] = move_id;
        preimage[1] = target_idx;
        preimage[2..].copy_from_slice(&salt);
        let computed = sha256_hash(&preimage);
        require!(computed.to_bytes() == game.players[idx].move_hash, GameError::HashMismatch);

        game.players[idx].move_revealed = move_id;
        game.players[idx].target_revealed = target_idx;
        game.players[idx].has_revealed = true;

        // Auto-advance when all alive players revealed
        if game.players[..game.player_count as usize]
            .iter()
            .filter(|p| !p.is_eliminated)
            .all(|p| p.has_revealed)
        {
            game.phase = phase::RESOLVE;
        }

        Ok(())
    }

    /// Resolve the round: compute deltas, eliminations, round wins.
    pub fn resolve_round(ctx: Context<ResolveRound>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require_keys_eq!(ctx.accounts.signer.key(), game.creator, GameError::Unauthorized);
        require!(game.phase == phase::RESOLVE, GameError::WrongPhase);

        let count = game.player_count as usize;
        let greed: i64 = if game.modifier == modifier::GREED_MODE { 2 } else { 1 };

        let mut deltas = [0i64; MAX_PLAYERS];
        let mut nuke_elim = [false; MAX_PLAYERS];

        // ── Tax / Steal / Rob ─────────────────────────────────────────────────
        for i in 0..count {
            let actor = game.players[i];
            if actor.is_eliminated { continue; }

            let base: i64 = match actor.move_revealed {
                m if m == move_id::TAX => 5,
                m if m == move_id::STEAL => 10,
                m if m == move_id::ROB => 20,
                _ => continue,
            };

            let t = actor.target_revealed as usize;
            if t >= count || game.players[t].is_eliminated { continue; }

            let amount = base * greed;

            // Target countering this actor?
            let target = game.players[t];
            let countered = target.move_revealed == move_id::COUNTER
                && target.target_revealed == i as u8;

            if countered {
                deltas[i] -= amount;
                deltas[t] += amount;
            } else {
                deltas[i] += amount;
                deltas[t] -= amount;
            }
        }

        // ── Counter penalty ───────────────────────────────────────────────────
        for i in 0..count {
            let actor = game.players[i];
            if actor.is_eliminated || actor.move_revealed != move_id::COUNTER { continue; }

            let was_attacked = (0..count).any(|j| {
                if j == i { return false; }
                let other = game.players[j];
                let is_atk = other.move_revealed == move_id::TAX
                    || other.move_revealed == move_id::STEAL
                    || other.move_revealed == move_id::ROB;
                other.target_revealed == i as u8 && is_atk
            });

            if !was_attacked {
                deltas[i] -= 5;
            }
        }

        // ── NUKE ──────────────────────────────────────────────────────────────
        for i in 0..count {
            let actor = game.players[i];
            if actor.is_eliminated || actor.move_revealed != move_id::NUKE { continue; }

            deltas[i] -= 30;
            let t = actor.target_revealed as usize;
            if t < count && !game.players[t].is_eliminated {
                let target_final = game.players[t].balance as i64 + deltas[t];
                if target_final <= 30 {
                    nuke_elim[t] = true;
                }
            }
        }

        // ── Apply deltas, find round winner ───────────────────────────────────
        let mut best_delta = i64::MIN;
        let mut round_winner: Option<usize> = None;

        for i in 0..count {
            let p = &mut game.players[i];
            if p.is_eliminated { continue; }

            let new_bal = (p.balance as i64 + deltas[i]).max(0) as u32;
            p.balance = new_bal;
            p.is_eliminated = p.is_eliminated || nuke_elim[i] || (new_bal == 0);

            if deltas[i] > best_delta {
                best_delta = deltas[i];
                round_winner = Some(i);
            }
        }

        if let Some(w) = round_winner {
            if best_delta > 0 {
                game.players[w].round_wins += 1;
            }
        }

        // ── Check match over ──────────────────────────────────────────────────
        let alive = game.players[..count].iter().filter(|p| !p.is_eliminated).count();
        let has_winner = game.players[..count].iter().any(|p| p.round_wins >= WINNING_ROUNDS);

        if has_winner || alive <= 1 {
            game.phase = phase::FINISHED;
        } else {
            game.round += 1;
            game.phase = phase::COMMIT;
            for p in game.players[..count].iter_mut() {
                p.has_committed = false;
                p.has_revealed = false;
                p.move_hash = [0u8; 32];
                p.move_revealed = move_id::FOLD;
                p.target_revealed = 0;
            }
        }

        Ok(())
    }

    /// Close the game account and return lamports to creator.
    pub fn close_game(_ctx: Context<CloseGame>) -> Result<()> {
        // The `close = creator` constraint on the account handles the lamport transfer.
        Ok(())
    }
}
