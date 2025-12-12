// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MangoRegistry
 * @dev Main contract for registering mango batches on the blockchain
 */
interface IVerification {
    function isVerified(address _user) external view returns (bool);
}

contract MangoRegistry {
    address public owner;
    IVerification public verificationContract;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    struct Batch {
        string batchId;
        address producer;
        string location;
        string quality;
        uint256 timestamp;
        bool exists;
        bool isActive;
    }
    
    // Mapping from batchId to Batch details
    mapping(string => Batch) public batches;
    
    // Mapping from producer address to their batch IDs
    mapping(address => string[]) public producerBatches;
    
    // Array of all batch IDs for enumeration
    string[] public allBatchIds;

    constructor() {
        owner = msg.sender;
    }
    
    // Events
    event BatchRegistered(
        string indexed batchId,
        address indexed producer,
        string location,
        string quality,
        uint256 timestamp
    );
    
    event BatchDeactivated(string indexed batchId, uint256 timestamp);
    
    /**
     * @dev Register a new mango batch
     * @param _batchId Unique identifier for the batch
     * @param _location Location where the batch was produced
     * @param _quality Quality grade of the batch
     */
    function registerBatch(
        string memory _batchId,
        string memory _location,
        string memory _quality
    ) public {
        if (address(verificationContract) != address(0)) {
            require(verificationContract.isVerified(msg.sender), "Producer not verified");
        }

        require(!batches[_batchId].exists, "Batch already exists");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(bytes(_quality).length > 0, "Quality cannot be empty");
        
        batches[_batchId] = Batch({
            batchId: _batchId,
            producer: msg.sender,
            location: _location,
            quality: _quality,
            timestamp: block.timestamp,
            exists: true,
            isActive: true
        });
        
        producerBatches[msg.sender].push(_batchId);
        allBatchIds.push(_batchId);
        
        emit BatchRegistered(_batchId, msg.sender, _location, _quality, block.timestamp);
    }
    
    /**
     * @dev Get batch details
     * @param _batchId The batch ID to query
     * @return Batch details
     */
    function getBatch(string memory _batchId) public view returns (Batch memory) {
        require(batches[_batchId].exists, "Batch does not exist");
        return batches[_batchId];
    }
    
    /**
     * @dev Get all batches registered by a producer
     * @param _producer Address of the producer
     * @return Array of batch IDs
     */
    function getProducerBatches(address _producer) public view returns (string[] memory) {
        return producerBatches[_producer];
    }
    
    /**
     * @dev Get total number of registered batches
     * @return Total count
     */
    function getTotalBatches() public view returns (uint256) {
        return allBatchIds.length;
    }
    
    /**
     * @dev Deactivate a batch (only by producer)
     * @param _batchId The batch ID to deactivate
     */
    function deactivateBatch(string memory _batchId) public {
        require(batches[_batchId].exists, "Batch does not exist");
        require(batches[_batchId].producer == msg.sender, "Only producer can deactivate");
        require(batches[_batchId].isActive, "Batch already deactivated");
        
        batches[_batchId].isActive = false;
        emit BatchDeactivated(_batchId, block.timestamp);
    }

    /**
     * @dev Set the verification contract address
     * @param _verificationContract Address of the Verification contract
     */
    function setVerificationContract(address _verificationContract) public onlyOwner {
        verificationContract = IVerification(_verificationContract);
    }
}
