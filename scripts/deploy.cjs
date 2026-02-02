const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment de contratos MangoChain (HarvestLink Protocol)...");

  const [deployer] = await ethers.getSigners();
  console.log(`📍 Desplegando desde: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC`);

  if (balance === 0n) {
    console.log("❌ Balance insuficiente. Obtén MATIC de prueba en:");
    console.log("🔗 https://faucet.polygon.technology/");
    return;
  }

  // 1. Deploy Verification
  console.log("📦 Compilando y desplegando Verification...");
  const Verification = await ethers.getContractFactory("Verification");
  const verification = await Verification.deploy();
  await verification.waitForDeployment();
  const verificationAddress = await verification.getAddress();
  console.log(`✅ Verification desplegado en: ${verificationAddress}`);

  // 2. Deploy MangoRegistry
  console.log("📦 Compilando y desplegando MangoRegistry...");
  const MangoRegistry = await ethers.getContractFactory("MangoRegistry");
  const mangoRegistry = await MangoRegistry.deploy();
  await mangoRegistry.waitForDeployment();
  const mangoRegistryAddress = await mangoRegistry.getAddress();
  console.log(`✅ MangoRegistry desplegado en: ${mangoRegistryAddress}`);

  // 3. Link Verification to MangoRegistry
  console.log("🔗 Vinculando Verification a MangoRegistry...");
  const setTx = await mangoRegistry.setVerificationContract(verificationAddress);
  await setTx.wait();
  console.log("✅ MangoRegistry actualizado con Verification contract");

  // 4. Deploy QualityCertification
  console.log("📦 Compilando y desplegando QualityCertification...");
  const QualityCertification = await ethers.getContractFactory("QualityCertification");
  const qualityCertification = await QualityCertification.deploy();
  await qualityCertification.waitForDeployment();
  const qualityAddress = await qualityCertification.getAddress();
  console.log(`✅ QualityCertification desplegado en: ${qualityAddress}`);

  // 5. Deploy SupplyChainTracking
  console.log("📦 Compilando y desplegando SupplyChainTracking...");
  const SupplyChainTracking = await ethers.getContractFactory("SupplyChainTracking");
  const supplyChainTracking = await SupplyChainTracking.deploy();
  await supplyChainTracking.waitForDeployment();
  const supplyAddress = await supplyChainTracking.getAddress();
  console.log(`✅ SupplyChainTracking desplegado en: ${supplyAddress}`);

  console.log("\n🎉 TODOS LOS CONTRATOS DESPLEGADOS EXITOSAMENTE!");
  console.log(`📄 Verification: ${verificationAddress}`);
  console.log(`📄 MangoRegistry: ${mangoRegistryAddress}`);
  console.log(`📄 QualityCertification: ${qualityAddress}`);
  console.log(`📄 SupplyChainTracking: ${supplyAddress}`);
  console.log("\n🔍 Verificar en PolygonScan:");
  console.log(`https://amoy.polygonscan.com/address/${mangoRegistryAddress}`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exitCode = 1;
});