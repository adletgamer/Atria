require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          viaIR: true,
          optimizer: { enabled: true, runs: 200 },
        },
      },
      {
        version: "0.8.19",
        settings: {
          viaIR: true,
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  networks: {
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 80002,
    }
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts"
  }
};
