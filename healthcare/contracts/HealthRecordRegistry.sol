// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthRecordRegistry
 * @dev Smart contract for storing tamper-proof health record hashes on blockchain
 * @notice This contract stores only hashes, not actual health data (HIPAA compliant)
 */
contract HealthRecordRegistry {
    
    struct RecordEntry {
        bytes32 recordHash;      // SHA-256 hash of the health record
        address owner;           // Wallet address of record owner
        uint256 timestamp;       // Block timestamp when record was stored
        bool exists;             // Flag to check if record exists
        bool isRevoked;          // Flag to check if record is revoked
    }
    
    // Mapping from recordId to RecordEntry
    mapping(string => RecordEntry) private records;
    
    // Mapping from owner address to their record IDs
    mapping(address => string[]) private ownerRecords;
    
    // Events for transparency and auditability
    event RecordStored(
        string indexed recordId,
        bytes32 recordHash,
        address indexed owner,
        uint256 timestamp
    );
    
    event RecordVerified(
        string indexed recordId,
        bool isValid,
        uint256 timestamp
    );
    
    event RecordRevoked(
        string indexed recordId,
        address indexed revokedBy,
        uint256 timestamp
    );
    
    // Modifiers
    modifier recordExists(string memory recordId) {
        require(records[recordId].exists, "Record does not exist");
        _;
    }
    
    modifier onlyRecordOwner(string memory recordId) {
        require(records[recordId].owner == msg.sender, "Not the record owner");
        _;
    }
    
    /**
     * @dev Store a new health record hash on the blockchain
     * @param recordId Unique identifier for the health record (MongoDB ObjectId)
     * @param recordHash SHA-256 hash of the health record data
     */
    function storeRecord(string memory recordId, bytes32 recordHash) external {
        require(!records[recordId].exists, "Record already exists");
        require(recordHash != bytes32(0), "Invalid record hash");
        
        records[recordId] = RecordEntry({
            recordHash: recordHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true,
            isRevoked: false
        });
        
        ownerRecords[msg.sender].push(recordId);
        
        emit RecordStored(recordId, recordHash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify if a record hash matches the stored hash
     * @param recordId Unique identifier for the health record
     * @param recordHash Hash to verify against stored hash
     * @return isValid True if hashes match, false otherwise
     * @return timestamp When the record was originally stored
     */
    function verifyRecord(string memory recordId, bytes32 recordHash) 
        external 
        recordExists(recordId)
        returns (bool isValid, uint256 timestamp) 
    {
        RecordEntry storage entry = records[recordId];
        
        require(!entry.isRevoked, "Record has been revoked");
        
        isValid = (entry.recordHash == recordHash);
        timestamp = entry.timestamp;
        
        emit RecordVerified(recordId, isValid, block.timestamp);
        
        return (isValid, timestamp);
    }
    
    /**
     * @dev Get record details (read-only, no gas for external calls)
     * @param recordId Unique identifier for the health record
     * @return recordHash The stored hash
     * @return owner Address of record owner
     * @return timestamp When record was stored
     * @return isRevoked Whether record is revoked
     */
    function getRecord(string memory recordId) 
        external 
        view 
        recordExists(recordId)
        returns (
            bytes32 recordHash,
            address owner,
            uint256 timestamp,
            bool isRevoked
        ) 
    {
        RecordEntry storage entry = records[recordId];
        return (entry.recordHash, entry.owner, entry.timestamp, entry.isRevoked);
    }
    
    /**
     * @dev Check if a record exists
     * @param recordId Unique identifier for the health record
     * @return True if record exists
     */
    function recordExistsCheck(string memory recordId) external view returns (bool) {
        return records[recordId].exists;
    }
    
    /**
     * @dev Revoke a health record (only owner can revoke)
     * @param recordId Unique identifier for the health record
     */
    function revokeRecord(string memory recordId) 
        external 
        recordExists(recordId)
        onlyRecordOwner(recordId)
    {
        records[recordId].isRevoked = true;
        emit RecordRevoked(recordId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get all record IDs owned by an address
     * @param owner Address to query
     * @return Array of record IDs
     */
    function getOwnerRecords(address owner) external view returns (string[] memory) {
        return ownerRecords[owner];
    }
    
    /**
     * @dev Verify record without state change (pure verification)
     * @param recordId Unique identifier for the health record
     * @param recordHash Hash to verify
     * @return isValid True if valid
     * @return storedTimestamp Original storage timestamp
     * @return isRevoked Whether record is revoked
     */
    function verifyRecordView(string memory recordId, bytes32 recordHash) 
        external 
        view 
        returns (bool isValid, uint256 storedTimestamp, bool isRevoked) 
    {
        if (!records[recordId].exists) {
            return (false, 0, false);
        }
        
        RecordEntry storage entry = records[recordId];
        return (
            entry.recordHash == recordHash,
            entry.timestamp,
            entry.isRevoked
        );
    }
}
