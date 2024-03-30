use borsh::{BorshSerialize, BorshDeserialize};

use solana_program::{
    pubkey::Pubkey,
    entrypoint,
    entrypoint::ProgramResult,
    program::invoke_signed,
    system_instruction,
    account_info::{
        AccountInfo,
        next_account_info,
    },
};

// The custom instruction processed by our program. It includes the
// PDA's bump seed, which is derived by the client program. This
// definition is also imported into the off-chain client program.
// The computed address of the PDA will be passed to this program via
// the `accounts` vector of the `Instruction` type.
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct InstructionData {
    pub vault_bump_seed: u8,
    pub lamports: u64,
}

// The size in bytes of a vault account. The client program needs
// this information to calculate the quantity of lamports necessary
// to pay for the account's rent.
pub static VAULT_ACCOUNT_SIZE: u64 = 1024;

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// The entrypoint of the on-chain program, as provided to the
// `entrypoint!` macro.
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    // The vault PDA, derived from the payer's address
    let vault = next_account_info(account_info_iter)?;

    let mut instruction_data = instruction_data;
    let instr = InstructionData::deserialize(&mut instruction_data)?;
    let vault_bump_seed = instr.vault_bump_seed;
    let lamports = instr.lamports;
    let vault_size = VAULT_ACCOUNT_SIZE;

    // Invoke the system program to create an account while virtually
    // signing with the vault PDA, which is owned by this caller program.
    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            vault.key,
            lamports,
            vault_size,
            &program_id,
        ),
        &[
            payer.clone(),
            vault.clone(),
        ],
        // A slice of seed slices, each seed slice being the set
        // of seeds used to generate one of the PDAs required by the
        // callee program, the final seed being a single-element slice
        // containing the `u8` bump seed.
        &[
            &[
                b"vault",
                payer.key.as_ref(),
                &[vault_bump_seed],
            ],
        ]
    )?;

    Ok(())
}
