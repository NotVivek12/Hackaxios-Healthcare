# Blockchain Health Records Integration

This project integrates blockchain technology for **tamper-proof health records storage**. Records are hashed and stored on the Ethereum blockchain, ensuring data integrity and immutability.

## 🔐 How It Works

1. **Record Creation**: When a health record is created, a cryptographic hash (keccak256) of the record data is generated
2. **Blockchain Storage**: The hash is stored on the Ethereum blockchain with a timestamp
3. **Verification**: Records can be verified by comparing the current data hash with the stored blockchain hash
4. **Tamper Detection**: Any modification to the record data will result in a different hash, indicating tampering

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Health Record │ --> │   Generate Hash  │ --> │   Store on      │
│   (MongoDB)     │     │   (keccak256)    │     │   Blockchain    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          v
                                                 ┌─────────────────┐
                                                 │  Transaction    │
                                                 │  Hash + Block # │
                                                 └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Hardhat (installed with project)

### Local Development Setup

1. **Start the local blockchain node:**
   ```bash
   cd healthcare
   npx hardhat node
   ```
   Keep this terminal running. You'll see 20 test accounts with 10,000 ETH each.

2. **Deploy the smart contract (in a new terminal):**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Update `.env` with the contract address** (if different):
   ```
   BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
   BLOCKCHAIN_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   BLOCKCHAIN_CONTRACT_ADDRESS=<deployed_address>
   ```

4. **Start the Next.js app:**
   ```bash
   npm run dev
   ```

### Deploy to Sepolia Testnet

1. **Get Sepolia ETH**: Use a faucet like https://sepoliafaucet.com/

2. **Get an Alchemy API key**: Sign up at https://www.alchemy.com/

3. **Update `.env`:**
   ```
   BLOCKCHAIN_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   BLOCKCHAIN_PRIVATE_KEY=your_wallet_private_key
   ```

4. **Deploy to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

## 📡 API Endpoints

### Create Health Record (with blockchain)
```
POST /api/health-records
```
Creates a health record and stores its hash on the blockchain.

**Response includes:**
```json
{
  "_id": "...",
  "title": "...",
  "isOnBlockchain": true,
  "blockchain": {
    "transactionHash": "0x...",
    "blockNumber": 1234,
    "recordHash": "0x...",
    "storedAt": "2025-12-30T..."
  },
  "blockchainResult": {
    "success": true,
    "transactionHash": "0x...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
  }
}
```

### Verify Record on Blockchain
```
GET /api/health-records/verify/{recordId}
```
Verifies the current record data against the blockchain hash.

**Response:**
```json
{
  "verified": true,
  "isOnBlockchain": true,
  "tamperDetected": false,
  "blockchain": {
    "transactionHash": "0x...",
    "blockNumber": 1234,
    "storedAt": "2025-12-30T...",
    "explorerUrl": "https://sepolia.etherscan.io/tx/0x..."
  },
  "verification": {
    "currentHash": "0x...",
    "storedHash": "0x...",
    "hashesMatch": true,
    "lastVerifiedAt": "2025-12-30T..."
  }
}
```

### Check Blockchain Status
```
GET /api/health-records/blockchain-status
```
Returns connection status and network info.

## 🔍 How to Verify a Record

### Method 1: API Verification
```bash
curl -X GET "http://localhost:3000/api/health-records/verify/{recordId}" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

### Method 2: Manual Verification (Using Etherscan)

1. Get the record's `transactionHash` from the database
2. Visit https://sepolia.etherscan.io/tx/{transactionHash}
3. View the transaction details and input data
4. The `recordHash` in the input data should match what's stored

### Method 3: Direct Contract Interaction

Using ethers.js or web3.js:
```javascript
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  ["function verifyRecordView(string,bytes32) view returns (bool,uint256,bool)"],
  provider
);

const [isValid, timestamp, isRevoked] = await contract.verifyRecordView(
  recordId,
  recordHash
);

console.log("Is Valid:", isValid);
console.log("Timestamp:", new Date(Number(timestamp) * 1000));
```

## 🛡️ Security Features

1. **Hash-Only Storage**: Only hashes are stored on-chain (HIPAA compliant)
2. **Immutable Records**: Once stored, blockchain records cannot be modified
3. **Audit Trail**: All transactions are timestamped and traceable
4. **Owner Verification**: Records are tied to wallet addresses
5. **Revocation Support**: Records can be revoked if needed

## 📋 Smart Contract Functions

| Function | Description |
|----------|-------------|
| `storeRecord(recordId, hash)` | Store a new record hash |
| `verifyRecord(recordId, hash)` | Verify with event emission |
| `verifyRecordView(recordId, hash)` | Verify without gas cost |
| `getRecord(recordId)` | Get record details |
| `revokeRecord(recordId)` | Revoke a record (owner only) |
| `recordExistsCheck(recordId)` | Check if record exists |

## 🔧 Troubleshooting

### "Cannot connect to network localhost"
- Make sure `npx hardhat node` is running in a separate terminal

### "Record already exists on blockchain"
- Each record ID can only be stored once. Create a new record instead.

### "Blockchain storage failed, record saved to database only"
- The record is still saved to MongoDB, but blockchain storage failed
- Check blockchain connection and contract address

### "BLOCKCHAIN_PRIVATE_KEY is not configured"
- Make sure your `.env` file has the private key set

## 📁 File Structure

```
healthcare/
├── contracts/
│   └── HealthRecordRegistry.sol    # Smart contract
├── scripts/
│   └── deploy.js                   # Deployment script
├── src/
│   ├── lib/
│   │   └── blockchain/
│   │       └── index.ts            # Blockchain integration lib
│   └── app/
│       └── api/
│           └── health-records/
│               ├── route.ts        # Create/list records
│               ├── verify/
│               │   └── [id]/
│               │       └── route.ts # Verify endpoint
│               └── blockchain-status/
│                   └── route.ts    # Status endpoint
└── hardhat.config.js               # Hardhat configuration
```

## 🎯 Best Practices

1. **Always verify before sharing**: Verify records before sharing with providers
2. **Keep backups**: MongoDB still stores the full record; blockchain stores verification
3. **Monitor gas costs**: Use view functions when possible (no gas)
4. **Use testnets first**: Test thoroughly on Sepolia before mainnet
