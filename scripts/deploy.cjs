const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment de MangoChainRegistry...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`📍 Desplegando desde: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC`);
  
  if (balance === 0n) {
    console.log("❌ Balance insuficiente. Obtén MATIC de prueba en:");
    console.log("🔗 https://faucet.polygon.technology/");
    return;
  }

  console.log("📦 Compilando contrato...");
  const MangoChainRegistry = await ethers.getContractFactory("MangoChainRegistry");
  
  console.log("🔄 Desplegando...");
  const contract = await MangoChainRegistry.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ CONTRATO DESPLEGADO!");
  console.log(`📄 Address: ${address}`);
  console.log(`🔍 Verificar: https://amoy.polygonscan.com/address/${address}`);
  
  return address;
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});