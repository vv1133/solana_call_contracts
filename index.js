const web3 = require('@solana/web3.js');
const borsh = require('borsh');
const bs58 = require('bs58');
const { PublicKey, SystemProgram, TransactionInstruction, Transaction, Keypair } = web3;

const devnet = "https://devnet.helius-rpc.com/?api-key=c9affd08-e1fb-4085-9b1f-0c36914534b6";

const programId = new PublicKey('CrMWLPYrya9Y99EUNsL1WpdEvZBDtFH3vUd7EmCux7ei');
const connection = new web3.Connection(devnet);

const payer = Keypair.fromSecretKey(
  bs58.decode(
    ""
  )
);

class InstructionData {
  constructor(properties) {
    Object.keys(properties).forEach((key) => {
      this[key] = properties[key];
    });
  }
}

(async () => {
  // 注册类和对应的schema以便在后续可以进行序列化
  const instructionDataSchema = new Map([
    [InstructionData, { kind: 'struct', fields: [['vault_bump_seed', 'u8'], ['lamports', 'u64']] }],
  ]);
  
  
  // PDA地址需要提前计算出来
  const seeds = [Buffer.from('vault'), payer.publicKey.toBuffer()];
  const vaultPDA = await PublicKey.findProgramAddress(seeds, programId);
  const vaultPDAPublicKey = vaultPDA[0];
  const valutPDABump = vaultPDA[1]; // Buffer.from(Uint8Array.of(bump)),
  console.log("pda0: "+vaultPDAPublicKey+", pda1: "+valutPDABump);
  
  // 创建指令数据对象
  const instructionData = new InstructionData({
    vault_bump_seed: valutPDABump,
    lamports: 1000000
  });
  
  // 序列化指令数据
  const data = borsh.serialize(instructionDataSchema, instructionData);
  
  // 构建交易指令
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: vaultPDAPublicKey, isSigner: false, isWritable: true }
    ],
    programId: programId,
    data: data // 序列化后的指令数据
  });
  
  // 构建并发送交易
  const transaction = new Transaction().add(instruction);
  const signature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [payer] // 签名者数组，此处只有支付者需要签名
  );
  
  console.log(`Transaction signature: ${signature}`);
})();
