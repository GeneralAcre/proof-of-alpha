use pinocchio::{
    account::AccountView,
    address::Address,
    cpi::{Seed, Signer},
    entrypoint,
    error::ProgramError,
    sysvars::{rent::Rent, Sysvar},
    ProgramResult,
};
use pinocchio_system::instructions::CreateAccount;

entrypoint!(process_instruction);

// ── Instruction discriminators ─────────────────────────────────────────────
// sha256("global:<name>")[..8] — must match frontend hardcoded values exactly.
const DISC_INITIALIZE:  [u8; 8] = [0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed];
const DISC_INIT_PLAYER: [u8; 8] = [0x72, 0x1b, 0xdb, 0x90, 0x32, 0x0f, 0xe4, 0x42];
const DISC_AWARD_AURA:  [u8; 8] = [0x8f, 0x6a, 0x58, 0xb6, 0xb2, 0x74, 0x49, 0x55];
const DISC_SPEND_AURA:  [u8; 8] = [0xb3, 0x32, 0x28, 0xd0, 0x9b, 0x38, 0x9b, 0x6a];

// ── Account byte layouts ───────────────────────────────────────────────────
// Must match solana-client.ts parsePlayerAura (off = 8 skip, then fixed offsets).
//
//   ProgramConfig (41 bytes):
//     [0..8]  = 8-byte prefix (frontend skips with `off = 8`)
//     [8..40] = authority: Pubkey
//     [40]    = bump: u8
//
//   PlayerAura (62 bytes):
//     [0..8]  = 8-byte prefix
//     [8..40] = wallet: Pubkey
//     [40..48]= balance: u64 LE
//     [48..56]= lifetime_earned: u64 LE
//     [56..60]= games_played: u32 LE
//     [60]    = best_streak: u8
//     [61]    = bump: u8
const CONFIG_LEN: usize = 41;
const PLAYER_LEN: usize = 62;

fn process_instruction(
    program_id: &Address,
    accounts: &mut [AccountView],
    data: &[u8],
) -> ProgramResult {
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let disc: [u8; 8] = data[..8]
        .try_into()
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    let rest = &data[8..];

    match disc {
        DISC_INITIALIZE  => ix_initialize(program_id, accounts, rest),
        DISC_INIT_PLAYER => ix_init_player(program_id, accounts),
        DISC_AWARD_AURA  => ix_award_aura(program_id, accounts, rest),
        DISC_SPEND_AURA  => ix_spend_aura(program_id, accounts, rest),
        _                => Err(ProgramError::InvalidInstructionData),
    }
}

// ── Raw data helpers ───────────────────────────────────────────────────────

#[inline(always)]
unsafe fn read_u64(ptr: *const u8, off: usize) -> u64 {
    let mut b = [0u8; 8];
    core::ptr::copy_nonoverlapping(ptr.add(off), b.as_mut_ptr(), 8);
    u64::from_le_bytes(b)
}

#[inline(always)]
unsafe fn write_u64(ptr: *mut u8, off: usize, val: u64) {
    core::ptr::copy_nonoverlapping(val.to_le_bytes().as_ptr(), ptr.add(off), 8);
}

#[inline(always)]
unsafe fn read_u32(ptr: *const u8, off: usize) -> u32 {
    let mut b = [0u8; 4];
    core::ptr::copy_nonoverlapping(ptr.add(off), b.as_mut_ptr(), 4);
    u32::from_le_bytes(b)
}

#[inline(always)]
unsafe fn write_u32(ptr: *mut u8, off: usize, val: u32) {
    core::ptr::copy_nonoverlapping(val.to_le_bytes().as_ptr(), ptr.add(off), 4);
}

// ── initialize ─────────────────────────────────────────────────────────────
// accounts[0]: config PDA   (writable, to be created)
// accounts[1]: payer        (signer, writable)
// accounts[2]: system_program
// data: [0..32] authority pubkey
fn ix_initialize(
    program_id: &Address,
    accounts: &mut [AccountView],
    data: &[u8],
) -> ProgramResult {
    if accounts.len() < 2 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    if !accounts[1].is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if data.len() < 32 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let (expected, bump) = Address::find_program_address(&[b"config"], program_id);
    if accounts[0].address() != &expected {
        return Err(ProgramError::InvalidSeeds);
    }

    let lamports = Rent::get()?.try_minimum_balance(CONFIG_LEN)?;
    let bump_arr = [bump];
    let seeds  = [Seed::from(b"config" as &[u8]), Seed::from(bump_arr.as_ref())];
    let signers = [Signer::from(&seeds)];

    CreateAccount {
        from: &accounts[1],
        to:   &accounts[0],
        lamports,
        space: CONFIG_LEN as u64,
        owner: program_id,
    }
    .invoke_signed(&signers)?;

    let ptr = accounts[0].data_ptr() as *mut u8;
    unsafe {
        core::ptr::write_bytes(ptr, 0, 8);              // prefix
        core::ptr::copy_nonoverlapping(data.as_ptr(), ptr.add(8), 32); // authority
        *ptr.add(40) = bump;
    }
    Ok(())
}

// ── init_player ────────────────────────────────────────────────────────────
// accounts[0]: player PDA  (writable, to be created)
// accounts[1]: wallet      (signer, writable — pays rent)
// accounts[2]: system_program
fn ix_init_player(program_id: &Address, accounts: &mut [AccountView]) -> ProgramResult {
    if accounts.len() < 2 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    if !accounts[1].is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let wallet_bytes = accounts[1].address().as_ref();
    let (expected, bump) =
        Address::find_program_address(&[b"player", wallet_bytes], program_id);
    if accounts[0].address() != &expected {
        return Err(ProgramError::InvalidSeeds);
    }

    let lamports = Rent::get()?.try_minimum_balance(PLAYER_LEN)?;

    // Copy wallet bytes into a fixed array so we can take a reference after
    // `accounts[1].address()` borrow is released by the CPI call.
    let mut wallet_buf = [0u8; 32];
    wallet_buf.copy_from_slice(wallet_bytes);

    let bump_arr = [bump];
    let seeds = [
        Seed::from(b"player" as &[u8]),
        Seed::from(wallet_buf.as_ref()),
        Seed::from(bump_arr.as_ref()),
    ];
    let signers = [Signer::from(&seeds)];

    CreateAccount {
        from: &accounts[1],
        to:   &accounts[0],
        lamports,
        space: PLAYER_LEN as u64,
        owner: program_id,
    }
    .invoke_signed(&signers)?;

    let ptr = accounts[0].data_ptr() as *mut u8;
    unsafe {
        core::ptr::write_bytes(ptr, 0, 8);                         // prefix
        core::ptr::copy_nonoverlapping(wallet_buf.as_ptr(), ptr.add(8), 32); // wallet
        // balance, lifetime, games, streak → already zero from CreateAccount
        *ptr.add(61) = bump;
    }
    Ok(())
}

// ── award_aura ─────────────────────────────────────────────────────────────
// accounts[0]: config    (read-only)
// accounts[1]: player    (writable)
// accounts[2]: authority (signer, writable)
// Extra accounts [3..] are ignored — backend sends player_wallet + system_program
//   for legacy compatibility; the native program doesn't need them.
// data: [0..8]=amount:u64 LE, [8]=streak:u8
fn ix_award_aura(
    program_id: &Address,
    accounts: &mut [AccountView],
    data: &[u8],
) -> ProgramResult {
    if accounts.len() < 3 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    if !accounts[2].is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if data.len() < 9 {
        return Err(ProgramError::InvalidInstructionData);
    }
    if !accounts[0].owned_by(program_id) {
        return Err(ProgramError::InvalidAccountOwner);
    }
    if !accounts[1].owned_by(program_id) {
        return Err(ProgramError::InvalidAccountOwner);
    }
    if accounts[0].data_len() < CONFIG_LEN {
        return Err(ProgramError::InvalidAccountData);
    }
    if accounts[1].data_len() < PLAYER_LEN {
        return Err(ProgramError::InvalidAccountData);
    }

    let amount: u64 = u64::from_le_bytes(
        data[..8].try_into().map_err(|_| ProgramError::InvalidInstructionData)?,
    );
    if amount == 0 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let streak: u8 = data[8];

    let config_ptr  = accounts[0].data_ptr();
    let player_ptr  = accounts[1].data_ptr() as *mut u8;
    let auth_addr   = accounts[2].address() as *const Address as *const u8;

    unsafe {
        // Verify authority == config.authority (config[8..40])
        let config_auth = core::slice::from_raw_parts(config_ptr.add(8), 32);
        let signer_addr = core::slice::from_raw_parts(auth_addr, 32);
        if config_auth != signer_addr {
            return Err(ProgramError::InvalidAccountData); // Unauthorized
        }

        let balance      = read_u64(player_ptr, 40);
        let lifetime     = read_u64(player_ptr, 48);
        let games        = read_u32(player_ptr, 56);
        let best_streak  = *player_ptr.add(60);

        write_u64(player_ptr, 40, balance.saturating_add(amount));
        write_u64(player_ptr, 48, lifetime.saturating_add(amount));
        write_u32(player_ptr, 56, games.saturating_add(1));
        if streak > best_streak {
            *player_ptr.add(60) = streak;
        }
    }
    Ok(())
}

// ── spend_aura ─────────────────────────────────────────────────────────────
// accounts[0]: player PDA (writable)
// accounts[1]: wallet     (signer)
// data: [0..8]=amount:u64 LE
fn ix_spend_aura(
    program_id: &Address,
    accounts: &mut [AccountView],
    data: &[u8],
) -> ProgramResult {
    if accounts.len() < 2 {
        return Err(ProgramError::NotEnoughAccountKeys);
    }
    if !accounts[1].is_signer() {
        return Err(ProgramError::MissingRequiredSignature);
    }
    if data.len() < 8 {
        return Err(ProgramError::InvalidInstructionData);
    }
    if !accounts[0].owned_by(program_id) {
        return Err(ProgramError::InvalidAccountOwner);
    }
    if accounts[0].data_len() < PLAYER_LEN {
        return Err(ProgramError::InvalidAccountData);
    }

    let amount: u64 = u64::from_le_bytes(
        data[..8].try_into().map_err(|_| ProgramError::InvalidInstructionData)?,
    );
    if amount == 0 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let player_ptr = accounts[0].data_ptr() as *mut u8;
    let wallet_ptr = accounts[1].address() as *const Address as *const u8;

    unsafe {
        // player_data[8..40] must match the signing wallet
        let stored_wallet = core::slice::from_raw_parts(player_ptr.add(8), 32);
        let signer_wallet = core::slice::from_raw_parts(wallet_ptr, 32);
        if stored_wallet != signer_wallet {
            return Err(ProgramError::InvalidAccountData); // Unauthorized
        }

        let balance = read_u64(player_ptr, 40);
        if balance < amount {
            return Err(ProgramError::Custom(1)); // InsufficientBalance
        }
        write_u64(player_ptr, 40, balance - amount);
    }
    Ok(())
}
