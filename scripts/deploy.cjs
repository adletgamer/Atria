const { ethers } = require("hardhat");

/**
 * HarvestLink Protocol — Deployment Script
 *
 * Deploys ONE contract only: MangoChainRegistry
 * All supply chain logic lives off-chain (Supabase).
 * Only cryptographic hashes are anchored on-chain.
 *
 * Network: Polygon Amoy Testnet (chainId 80002)
 * Usage:  npx hardhat run scripts/deploy.cjs --network amoy
 */
async function main() {
  console.log("🚀 HarvestLink Protocol — Deploying MangoChainRegistry...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC\n`);

  if (balance === 0n) {
    console.error("❌ Insufficient balance. Get test MATIC from:");
    console.error("   https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Deploy MangoChainRegistry — the ONLY active contract
  console.log("📦 Deploying MangoChainRegistry...");
  const MangoChainRegistry = await ethers.getContractFactory("MangoChainRegistry");
  const registry = await MangoChainRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const deployTx = registry.deploymentTransaction();

  console.log(`\n✅ MangoChainRegistry deployed!`);
  console.log(`   Address:   ${address}`);
  console.log(`   Tx hash:   ${deployTx?.hash}`);
  console.log(`   Network:   Polygon Amoy (chainId 80002)`);
  console.log(`\n🔍 View on PolygonScan:`);
  console.log(`   https://amoy.polygonscan.com/address/${address}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Add to .env.local:  VITE_REGISTRY_CONTRACT_ADDRESS=${address}`);
  console.log(`   2. Authorize system wallet:  authorizeSubmitter(<wallet_address>, true)`);
  console.log(`   3. Verify contract on PolygonScan for public auditability`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
