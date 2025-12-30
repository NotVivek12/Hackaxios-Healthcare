/**
 * Blockchain Integration for Health Records
 * Uses Ethereum (Sepolia testnet) to store tamper-proof record hashes
 */

import { ethers, JsonRpcProvider, Wallet, Contract, keccak256, toUtf8Bytes } from 'ethers';

// Contract ABI - only the functions we need
const HEALTH_RECORD_REGISTRY_ABI = [
    "function storeRecord(string memory recordId, bytes32 recordHash) external",
    "function verifyRecord(string memory recordId, bytes32 recordHash) external returns (bool isValid, uint256 timestamp)",
    "function verifyRecordView(string memory recordId, bytes32 recordHash) external view returns (bool isValid, uint256 storedTimestamp, bool isRevoked)",
    "function getRecord(string memory recordId) external view returns (bytes32 recordHash, address owner, uint256 timestamp, bool isRevoked)",
    "function recordExistsCheck(string memory recordId) external view returns (bool)",
    "function revokeRecord(string memory recordId) external",
    "event RecordStored(string indexed recordId, bytes32 recordHash, address indexed owner, uint256 timestamp)",
    "event RecordVerified(string indexed recordId, bool isValid, uint256 timestamp)"
];

// Configuration
const BLOCKCHAIN_CONFIG = {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '',
};

// Singleton instances
let provider: JsonRpcProvider | null = null;
let wallet: Wallet | null = null;
let contract: Contract | null = null;

/**
 * Initialize blockchain connection
 */
export function getProvider(): JsonRpcProvider {
    if (!provider) {
        provider = new JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
    }
    return provider;
}

/**
 * Get wallet instance for signing transactions
 */
export function getWallet(): Wallet {
    if (!wallet) {
        if (!BLOCKCHAIN_CONFIG.privateKey) {
            throw new Error('BLOCKCHAIN_PRIVATE_KEY is not configured');
        }
        wallet = new Wallet(BLOCKCHAIN_CONFIG.privateKey, getProvider());
    }
    return wallet;
}

/**
 * Get contract instance
 */
export function getContract(): Contract {
    if (!contract) {
        if (!BLOCKCHAIN_CONFIG.contractAddress) {
            throw new Error('BLOCKCHAIN_CONTRACT_ADDRESS is not configured');
        }
        contract = new Contract(
            BLOCKCHAIN_CONFIG.contractAddress,
            HEALTH_RECORD_REGISTRY_ABI,
            getWallet()
        );
    }
    return contract;
}

/**
 * Generate a hash from health record data
 * Uses keccak256 (Ethereum's native hashing)
 */
export function generateRecordHash(recordData: {
    userId: string;
    title: string;
    type: string;
    description: string;
    date: string;
    provider?: string;
    notes?: string;
}): string {
    // Create deterministic string from record data
    const dataString = JSON.stringify({
        userId: recordData.userId,
        title: recordData.title,
        type: recordData.type,
        description: recordData.description,
        date: recordData.date,
        provider: recordData.provider || '',
        notes: recordData.notes || ''
    });
    
    // Generate keccak256 hash
    return keccak256(toUtf8Bytes(dataString));
}

/**
 * Store health record hash on blockchain
 */
export async function storeRecordOnBlockchain(
    recordId: string,
    recordHash: string
): Promise<{
    success: boolean;
    transactionHash?: string;
    blockNumber?: number;
    error?: string;
}> {
    try {
        const contractInstance = getContract();
        
        // Check if record already exists
        const exists = await contractInstance.recordExistsCheck(recordId);
        if (exists) {
            return {
                success: false,
                error: 'Record already exists on blockchain'
            };
        }
        
        // Store the record
        const tx = await contractInstance.storeRecord(recordId, recordHash);
        const receipt = await tx.wait();
        
        return {
            success: true,
            transactionHash: receipt.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('Blockchain store error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown blockchain error'
        };
    }
}

/**
 * Verify a health record against blockchain
 */
export async function verifyRecordOnBlockchain(
    recordId: string,
    recordHash: string
): Promise<{
    isValid: boolean;
    storedTimestamp?: number;
    isRevoked?: boolean;
    error?: string;
}> {
    try {
        const contractInstance = getContract();
        
        // Use view function (no gas cost)
        const [isValid, storedTimestamp, isRevoked] = await contractInstance.verifyRecordView(
            recordId,
            recordHash
        );
        
        return {
            isValid,
            storedTimestamp: Number(storedTimestamp),
            isRevoked
        };
    } catch (error) {
        console.error('Blockchain verify error:', error);
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Unknown blockchain error'
        };
    }
}

/**
 * Get record details from blockchain
 */
export async function getRecordFromBlockchain(recordId: string): Promise<{
    exists: boolean;
    recordHash?: string;
    owner?: string;
    timestamp?: number;
    isRevoked?: boolean;
    error?: string;
}> {
    try {
        const contractInstance = getContract();
        
        // Check if exists first
        const exists = await contractInstance.recordExistsCheck(recordId);
        if (!exists) {
            return { exists: false };
        }
        
        const [recordHash, owner, timestamp, isRevoked] = await contractInstance.getRecord(recordId);
        
        return {
            exists: true,
            recordHash,
            owner,
            timestamp: Number(timestamp),
            isRevoked
        };
    } catch (error) {
        console.error('Blockchain get error:', error);
        return {
            exists: false,
            error: error instanceof Error ? error.message : 'Unknown blockchain error'
        };
    }
}

/**
 * Check blockchain connection status
 */
export async function checkBlockchainConnection(): Promise<{
    connected: boolean;
    network?: string;
    blockNumber?: number;
    walletAddress?: string;
    error?: string;
}> {
    try {
        const providerInstance = getProvider();
        const network = await providerInstance.getNetwork();
        const blockNumber = await providerInstance.getBlockNumber();
        const walletInstance = getWallet();
        
        return {
            connected: true,
            network: network.name,
            blockNumber,
            walletAddress: walletInstance.address
        };
    } catch (error) {
        return {
            connected: false,
            error: error instanceof Error ? error.message : 'Connection failed'
        };
    }
}

/**
 * Format timestamp from blockchain (Unix timestamp to Date)
 */
export function formatBlockchainTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(transactionHash: string): string {
    // Sepolia testnet explorer
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
}
