// SPDX-License-Identifier: MIT
// DEPRECATED — see MangoChainRegistry.sol
pragma solidity ^0.8.20;

/**
 * @title QualityCertification — DEPRECATED
 * @notice Do NOT deploy. Certs stored off-chain + hashes anchored via MangoChainRegistry.sol.
 * @title QualityCertification
 * @dev Contract for quality certification of mango batches
 */
contract QualityCertification {
    struct Certificate {
        address certifier;
        string certificateHash; // IPFS hash or certificate ID
        string qualityGrade;
        uint256 timestamp;
        bool exists;
    }
    
    // Mapping from batchId to Certificate
    mapping(string => Certificate) public certificates;
    
    // Mapping to track authorized certifiers
    mapping(address => bool) public authorizedCertifiers;
    
    // Contract owner
    address public owner;
    
    // Events
    event CertifierAuthorized(address indexed certifier, uint256 timestamp);
    event CertifierRevoked(address indexed certifier, uint256 timestamp);
    event QualityCertified(
        string indexed batchId,
        address indexed certifier,
        string certificateHash,
        string qualityGrade,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorizedCertifier() {
        require(authorizedCertifiers[msg.sender], "Not an authorized certifier");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedCertifiers[msg.sender] = true; // Owner is automatically a certifier
    }
    
    /**
     * @dev Authorize a new certifier
     * @param _certifier Address of the certifier to authorize
     */
    function authorizeCertifier(address _certifier) public onlyOwner {
        require(!authorizedCertifiers[_certifier], "Already authorized");
        authorizedCertifiers[_certifier] = true;
        emit CertifierAuthorized(_certifier, block.timestamp);
    }
    
    /**
     * @dev Revoke certifier authorization
     * @param _certifier Address of the certifier to revoke
     */
    function revokeCertifier(address _certifier) public onlyOwner {
        require(authorizedCertifiers[_certifier], "Not authorized");
        require(_certifier != owner, "Cannot revoke owner");
        authorizedCertifiers[_certifier] = false;
        emit CertifierRevoked(_certifier, block.timestamp);
    }
    
    /**
     * @dev Certify the quality of a batch
     * @param _batchId The batch ID to certify
     * @param _certificateHash IPFS hash or certificate identifier
     * @param _qualityGrade Quality grade assigned
     */
    function certifyQuality(
        string memory _batchId,
        string memory _certificateHash,
        string memory _qualityGrade
    ) public onlyAuthorizedCertifier {
        require(!certificates[_batchId].exists, "Batch already certified");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        
        certificates[_batchId] = Certificate({
            certifier: msg.sender,
            certificateHash: _certificateHash,
            qualityGrade: _qualityGrade,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit QualityCertified(_batchId, msg.sender, _certificateHash, _qualityGrade, block.timestamp);
    }
    
    /**
     * @dev Get certificate details for a batch
     * @param _batchId The batch ID to query
     * @return Certificate details
     */
    function getCertificate(string memory _batchId) public view returns (Certificate memory) {
        require(certificates[_batchId].exists, "Certificate does not exist");
        return certificates[_batchId];
    }
    
    /**
     * @dev Check if a batch is certified
     * @param _batchId The batch ID to check
     * @return True if certified, false otherwise
     */
    function isCertified(string memory _batchId) public view returns (bool) {
        return certificates[_batchId].exists;
    }
}
