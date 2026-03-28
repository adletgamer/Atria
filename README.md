# 🥭 HarvestLink Protocol (MangoChain Pilot) - Supply chain for Farmers

![MangoChain](https://img.shields.io/badge/MangoChain-Blockchain%20Supply%20Chain-orange)
![Polygon](https://img.shields.io/badge/Polygon-Amoy%20Testnet-purple)
![React](https://img.shields.io/badge/React-18.2+-61dafb)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636)

This repository contains the MangoChain pilot, the first implementation of the HarvestLink Protocol vision. HarvestLink is a blockchain-based protocol designed to tokenize future harvests, providing smallholder farmers with access to upfront capital and equitable markets. This specific dApp tracks the Peruvian mango supply chain as a proof-of-concept for the broader tokenization model.

## 🌟 Key Features

### 📦 Batch Registration (`MangoRegistry`)
- Producers can register mango batches with immutable data:
  - Variety (Kent, Edward, Haden)
  - Origin Location (GPS/Region)
  - Harvest Date
- Generates a unique **Batch ID** on the blockchain.

### ⭐ Quality Certification (`QualityCertification`)
- Authorized certifiers can issue digital quality certificates.
- Verifies grades: **Premium**, **Export**, **First Grade**, **Second Grade**.
- Certificates are linked to the batch and stored permanently.

### 🚚 Supply Chain Tracking (`SupplyChainTracking`)
- Tracks the batch through 8 distinct stages:
  1. 🌾 **Harvest**
  2. 🏭 **Processing**
  3. 🔬 **Quality Control**
  4. 📦 **Packaging**
  5. 🚢 **Export**
  6. 🚛 **Distribution**
  7. 🏪 **Retail**
  8. ✅ **Delivered**
- Each event is timestamped and signed by an authorized handler.

### 📱 Consumer Experience
- **QR Code Integration**: Consumers can scan a QR code to view the full history.
- **Interactive Dashboard**: Real-time metrics on production and distribution.
- **Visual Maps**: Production regions visualization.

---

## 🛠️ Tech Stack

**Frontend:**
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Animations**: Framer Motion
- **Web3 Integration**: Wagmi v2 + Viem + RainbowKit
- **Icons**: Lucide React

**Blockchain:**
- **Network**: Polygon Amoy Testnet
- **Languages**: Solidity ^0.8.0
- **Development Environment**: Hardhat
- **Wallet**: MetaMask

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MetaMask extension installed in your browser
- Some test MATIC on Polygon Amoy (get it from a faucet)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/adletgamer/mango-rastreo-chain.git
   cd mango-rastreo-chain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   - Visit `http://localhost:5173` (or the port shown in your terminal).
   - Connect your MetaMask wallet.

---

## 📜 Smart Contracts Architecture

The system is built on three main interacting contracts:

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **MangoRegistry.sol** | Core database of batches | `registerBatch()`, `getBatch()` |
| **QualityCertification.sol** | Quality assurance layer | `certifyQuality()`, `revokeCertifier()` |
| **SupplyChainTracking.sol** | Logistics and movement | `addTrackingEvent()`, `getBatchHistory()` |
| **Verification.sol** | User verification | `verifyUser()`, `revokeUser()` |

---

## 🧪 Running Tests

To run the smart contract tests (requires Hardhat setup):

```bash
npx hardhat test
```

## 🚢 Deployment

To deploy the smart contracts to Polygon Amoy:

1. Create a `.env` file with your private key and Alchemy/Infura URL.
2. Run the deployment script:
   ```bash
   npx hardhat run scripts/deploy.js --network amoy
   ```

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
