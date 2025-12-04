/**
 * MegaETH GameData Contract Deployment Script
 * 
 * Usage:
 * DEPLOY_KEY=0x... node scripts/deploy.js
 */

const solc = require('solc');
const fs = require('fs');
const { createWalletClient, createPublicClient, http, defineChain } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const megaethTestnet = defineChain({
  id: 6342,
  name: 'MegaETH Testnet',
  nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
  rpcUrls: { default: { http: ['https://carrot.megaeth.com/rpc'] } },
});

async function main() {
  const privateKey = process.env.DEPLOY_KEY;
  
  if (!privateKey) {
    console.error('❌ DEPLOY_KEY environment variable is required');
    console.log('Usage: DEPLOY_KEY=0x... node scripts/deploy.js');
    process.exit(1);
  }

  console.log('📦 Compiling GameData.sol...');
  
  const source = fs.readFileSync('./contracts/GameData.sol', 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: { 'GameData.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('❌ Compilation errors:');
      errors.forEach(e => console.error(e.formattedMessage));
      process.exit(1);
    }
    // Print warnings
    output.errors.filter(e => e.severity === 'warning').forEach(w => {
      console.warn('⚠️', w.message);
    });
  }
  
  const contract = output.contracts['GameData.sol']['GameData'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;
  
  console.log('✅ Compiled successfully');
  console.log('🔗 Connecting to MegaETH Testnet (Chain ID: 6342)...');
  
  const account = privateKeyToAccount(privateKey);
  console.log('📍 Deployer address:', account.address);
  
  const publicClient = createPublicClient({
    chain: megaethTestnet,
    transport: http(),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: megaethTestnet,
    transport: http(),
  });
  
  try {
    const balance = await publicClient.getBalance({ address: account.address });
    console.log('💰 Balance:', (Number(balance) / 1e18).toFixed(6), 'ETH');
    
    if (balance === 0n) {
      console.error('❌ No balance! Get testnet ETH from MegaETH faucet first.');
      console.log('   Visit: https://testnet.megaeth.com');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to connect to MegaETH RPC:', error.message);
    console.log('   Make sure https://carrot.megaeth.com/rpc is accessible');
    process.exit(1);
  }
  
  console.log('🚀 Deploying contract...');
  
  try {
    const hash = await walletClient.deployContract({
      abi,
      bytecode: '0x' + bytecode,
    });
    
    console.log('📝 Transaction hash:', hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log('');
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract address:', receipt.contractAddress);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());
    console.log('🔗 Block:', receipt.blockNumber.toString());
    console.log('');
    console.log('='.repeat(60));
    console.log('Add these to your Vercel environment variables:');
    console.log('');
    console.log('NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=' + receipt.contractAddress);
    console.log('MEGAETH_ADMIN_PRIVATE_KEY=' + privateKey);
    console.log('');
    console.log('='.repeat(60));
    
    // Save deployment info
    const deploymentInfo = {
      network: 'megaeth-testnet',
      chainId: 6342,
      contractAddress: receipt.contractAddress,
      deployer: account.address,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      deployedAt: new Date().toISOString(),
    };
    
    fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log('📄 Deployment info saved to deployment.json');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});



