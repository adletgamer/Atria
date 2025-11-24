// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SupplyChainTracking
 * @dev Contract for tracking mango batches through the supply chain
 */
contract SupplyChainTracking {
    enum Stage {
        Harvest,
        Processing,
        QualityControl,
        Packaging,
        Export,
        Distribution,
        Retail,
        Delivered
    }
    
    struct TrackingEvent {
        Stage stage;
        string location;
        uint256 timestamp;
        address handler;
        string notes;
    }
    
    // Mapping from batchId to array of tracking events
    mapping(string => TrackingEvent[]) public batchHistory;
    
    // Mapping to track authorized handlers
    mapping(address => bool) public authorizedHandlers;
    
    // Contract owner
    address public owner;
    
    // Events
    event HandlerAuthorized(address indexed handler, uint256 timestamp);
    event HandlerRevoked(address indexed handler, uint256 timestamp);
    event TrackingEventAdded(
        string indexed batchId,
        Stage stage,
        string location,
        address indexed handler,
        uint256 timestamp
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorizedHandler() {
        require(authorizedHandlers[msg.sender], "Not an authorized handler");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedHandlers[msg.sender] = true; // Owner is automatically a handler
    }
    
    /**
     * @dev Authorize a new handler
     * @param _handler Address of the handler to authorize
     */
    function authorizeHandler(address _handler) public onlyOwner {
        require(!authorizedHandlers[_handler], "Already authorized");
        authorizedHandlers[_handler] = true;
        emit HandlerAuthorized(_handler, block.timestamp);
    }
    
    /**
     * @dev Revoke handler authorization
     * @param _handler Address of the handler to revoke
     */
    function revokeHandler(address _handler) public onlyOwner {
        require(authorizedHandlers[_handler], "Not authorized");
        require(_handler != owner, "Cannot revoke owner");
        authorizedHandlers[_handler] = false;
        emit HandlerRevoked(_handler, block.timestamp);
    }
    
    /**
     * @dev Add a tracking event for a batch
     * @param _batchId The batch ID to track
     * @param _stage Current stage in the supply chain
     * @param _location Current location
     * @param _notes Additional notes or details
     */
    function addTrackingEvent(
        string memory _batchId,
        Stage _stage,
        string memory _location,
        string memory _notes
    ) public onlyAuthorizedHandler {
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        batchHistory[_batchId].push(TrackingEvent({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender,
            notes: _notes
        }));
        
        emit TrackingEventAdded(_batchId, _stage, _location, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get all tracking events for a batch
     * @param _batchId The batch ID to query
     * @return Array of tracking events
     */
    function getBatchHistory(string memory _batchId) public view returns (TrackingEvent[] memory) {
        return batchHistory[_batchId];
    }
    
    /**
     * @dev Get the current stage of a batch
     * @param _batchId The batch ID to query
     * @return Current stage
     */
    function getCurrentStage(string memory _batchId) public view returns (Stage) {
        require(batchHistory[_batchId].length > 0, "No tracking events found");
        return batchHistory[_batchId][batchHistory[_batchId].length - 1].stage;
    }
    
    /**
     * @dev Get total number of tracking events for a batch
     * @param _batchId The batch ID to query
     * @return Number of events
     */
    function getEventCount(string memory _batchId) public view returns (uint256) {
        return batchHistory[_batchId].length;
    }
}