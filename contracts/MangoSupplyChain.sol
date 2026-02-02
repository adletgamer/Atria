// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MangoSupplyChain
 * @dev Contract for registering and tracking mango batches with variety support
 * @notice This contract manages the complete lifecycle of mango batches
 */
contract MangoSupplyChain {
    
    // ============ ENUMS ============
    
    /**
     * @dev Supply chain stages
     */
    enum Stage {
        Registered,      // 0 - Just registered
        Harvested,       // 1 - Harvested from farm
        Processing,      // 2 - Being processed
        QualityControl,  // 3 - Quality inspection
        Packaging,       // 4 - Packaged for shipment
        InTransit,       // 5 - In transit
        Delivered        // 6 - Delivered to destination
    }

    /**
     * @dev Quality grades for mangos
     */
    enum QualityGrade {
        Premium,         // 0 - Highest quality
        Export,          // 1 - Export quality
        FirstGrade,      // 2 - First class
        SecondGrade      // 3 - Second class
    }

    // ============ STRUCTS ============

    /**
     * @dev Mango batch information
     */
    struct MangoBatch {
        string batchId;           // Unique batch identifier
        address producer;         // Producer wallet address
        string producerName;      // Producer's business name
        string location;          // Geographic location (Piura, Lambayeque, Ica)
        string variety;           // Mango variety ID (tommy-atkins, haden, etc.)
        string varietyName;       // Human-readable variety name
        QualityGrade qualityGrade;// Quality classification
        uint256 registrationTime; // Block timestamp when registered
        uint256 quantity;         // Quantity in kg
        bool isExportable;        // Whether this batch meets export standards
        Stage currentStage;       // Current supply chain stage
        string dataHash;          // IPFS hash for additional data
    }

    /**
     * @dev Tracking event for a batch
     */
    struct TrackingEvent {
        Stage stage;              // Supply chain stage
        string location;          // Location at this stage
        uint256 timestamp;        // When this event occurred
        address handler;          // Who added this event
        string notes;             // Additional details
    }

    /**
     * @dev Variety metadata (stored for quick reference)
     */
    struct VarietyInfo {
        string id;                // Variety ID
        string name;              // Human-readable name
        bool exportable;          // Can be exported
        bool active;              // Is this variety accepting registrations
    }

    // ============ STATE VARIABLES ============

    // Main batch registry
    mapping(string => MangoBatch) public batches;
    mapping(string => TrackingEvent[]) public batchHistory;
    mapping(string => VarietyInfo) public registeredVarieties;
    
    // Indexes for querying
    string[] public allBatchIds;
    mapping(address => string[]) public producerBatches;
    
    // Authorization
    mapping(address => bool) public authorizedHandlers;
    address public owner;
    
    uint256 public batchCount;
    uint256 public minimallyRequiredQuantity = 100; // kg

    // ============ EVENTS ============

    /**
     * @dev Emitted when a batch is registered
     */
    event BatchRegistered(
        string indexed batchId,
        address indexed producer,
        string variety,
        string varietyName,
        QualityGrade qualityGrade,
        uint256 timestamp,
        uint256 quantity
    );

    /**
     * @dev Emitted when a tracking event is added
     */
    event TrackingEventAdded(
        string indexed batchId,
        Stage stage,
        string location,
        address indexed handler,
        uint256 timestamp
    );

    /**
     * @dev Emitted when batch stage is updated
     */
    event StageUpdated(
        string indexed batchId,
        Stage newStage,
        uint256 timestamp
    );

    /**
     * @dev Emitted when a variety is registered in the system
     */
    event VarietyRegistered(
        string indexed varietyId,
        string name,
        bool exportable,
        uint256 timestamp
    );

    /**
     * @dev Emitted when handlers are authorized/revoked
     */
    event HandlerAuthorized(address indexed handler, uint256 timestamp);
    event HandlerRevoked(address indexed handler, uint256 timestamp);

    // ============ MODIFIERS ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAuthorizedHandler() {
        require(authorizedHandlers[msg.sender], "Not an authorized handler");
        _;
    }

    modifier batchExists(string memory _batchId) {
        require(bytes(batches[_batchId].batchId).length > 0, "Batch does not exist");
        _;
    }

    modifier varietyActive(string memory _varietyId) {
        require(registeredVarieties[_varietyId].active, "Variety is not active");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor() {
        owner = msg.sender;
        authorizedHandlers[msg.sender] = true;
        batchCount = 0;

        // Register default varieties
        _registerDefaultVarieties();
    }

    // ============ VARIETY MANAGEMENT ============

    /**
     * @dev Register a mango variety in the system
     */
    function registerVariety(
        string memory _varietyId,
        string memory _name,
        bool _exportable
    ) public onlyOwner {
        require(bytes(_varietyId).length > 0, "Variety ID cannot be empty");
        require(bytes(_name).length > 0, "Variety name cannot be empty");
        require(!registeredVarieties[_varietyId].active, "Variety already registered");

        registeredVarieties[_varietyId] = VarietyInfo({
            id: _varietyId,
            name: _name,
            exportable: _exportable,
            active: true
        });

        emit VarietyRegistered(_varietyId, _name, _exportable, block.timestamp);
    }

    /**
     * @dev Deactivate a variety from accepting new batches
     */
    function deactivateVariety(string memory _varietyId) public onlyOwner {
        require(registeredVarieties[_varietyId].active, "Variety is not active");
        registeredVarieties[_varietyId].active = false;
    }

    /**
     * @dev Internal: Register default Peruvian mango varieties
     */
    function _registerDefaultVarieties() internal {
        string[8] memory ids = [
            "tommy-atkins",
            "haden",
            "pico-de-pajaro",
            "kent",
            "ataulfo",
            "edward",
            "criollo",
            "francis"
        ];
        
        string[8] memory names = [
            "Tommy Atkins",
            "Haden",
            "Pico de Pajaro",
            "Kent",
            "Ataulfo",
            "Edward",
            "Criollo",
            "Francis"
        ];
        
        bool[8] memory exportable = [
            true, true, false, true, true, true, false, true
        ];

        for (uint256 i = 0; i < ids.length; i++) {
            registeredVarieties[ids[i]] = VarietyInfo({
                id: ids[i],
                name: names[i],
                exportable: exportable[i],
                active: true
            });
        }
    }

    // ============ BATCH REGISTRATION ============

    /**
     * @dev Register a new mango batch
     * @param _batchId Unique batch identifier
     * @param _producerName Producer's business name
     * @param _location Geographic location
     * @param _varietyId Mango variety ID
     * @param _qualityGrade Quality classification
     * @param _quantity Quantity in kg
     * @param _dataHash IPFS hash for additional batch data
     */
    function registerBatch(
        string memory _batchId,
        string memory _producerName,
        string memory _location,
        string memory _varietyId,
        QualityGrade _qualityGrade,
        uint256 _quantity,
        string memory _dataHash
    ) public varietyActive(_varietyId) {
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        require(bytes(batches[_batchId].batchId).length == 0, "Batch already exists");
        require(bytes(_location).length > 0, "Location cannot be empty");
        require(_quantity >= minimallyRequiredQuantity, "Quantity too small");

        VarietyInfo memory variety = registeredVarieties[_varietyId];
        
        // Create batch
        batches[_batchId] = MangoBatch({
            batchId: _batchId,
            producer: msg.sender,
            producerName: _producerName,
            location: _location,
            variety: _varietyId,
            varietyName: variety.name,
            qualityGrade: _qualityGrade,
            registrationTime: block.timestamp,
            quantity: _quantity,
            isExportable: variety.exportable && _qualityGrade <= QualityGrade.Export,
            currentStage: Stage.Registered,
            dataHash: _dataHash
        });

        // Index batch
        allBatchIds.push(_batchId);
        producerBatches[msg.sender].push(_batchId);
        batchCount++;

        // Add registration event
        batchHistory[_batchId].push(TrackingEvent({
            stage: Stage.Registered,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender,
            notes: "Batch registered in the system"
        }));

        emit BatchRegistered(
            _batchId,
            msg.sender,
            _varietyId,
            variety.name,
            _qualityGrade,
            block.timestamp,
            _quantity
        );
    }

    // ============ BATCH TRACKING ============

    /**
     * @dev Add a tracking event to a batch
     */
    function addTrackingEvent(
        string memory _batchId,
        Stage _stage,
        string memory _location,
        string memory _notes
    ) public onlyAuthorizedHandler batchExists(_batchId) {
        require(bytes(_location).length > 0, "Location cannot be empty");

        MangoBatch storage batch = batches[_batchId];
        batch.currentStage = _stage;

        batchHistory[_batchId].push(TrackingEvent({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender,
            notes: _notes
        }));

        emit TrackingEventAdded(_batchId, _stage, _location, msg.sender, block.timestamp);
        emit StageUpdated(_batchId, _stage, block.timestamp);
    }

    /**
     * @dev Get complete batch history
     */
    function getBatchHistory(string memory _batchId) 
        public 
        view 
        batchExists(_batchId)
        returns (TrackingEvent[] memory)
    {
        return batchHistory[_batchId];
    }

    /**
     * @dev Get batch information
     */
    function getBatch(string memory _batchId) 
        public 
        view 
        batchExists(_batchId)
        returns (MangoBatch memory)
    {
        return batches[_batchId];
    }

    /**
     * @dev Get all batches for a producer
     */
    function getProducerBatches(address _producer)
        public
        view
        returns (string[] memory)
    {
        return producerBatches[_producer];
    }

    /**
     * @dev Get variety information
     */
    function getVariety(string memory _varietyId)
        public
        view
        returns (VarietyInfo memory)
    {
        return registeredVarieties[_varietyId];
    }

    // ============ AUTHORIZATION ============

    /**
     * @dev Authorize a handler to add tracking events
     */
    function authorizeHandler(address _handler) public onlyOwner {
        require(!authorizedHandlers[_handler], "Already authorized");
        authorizedHandlers[_handler] = true;
        emit HandlerAuthorized(_handler, block.timestamp);
    }

    /**
     * @dev Revoke handler authorization
     */
    function revokeHandler(address _handler) public onlyOwner {
        require(authorizedHandlers[_handler], "Not authorized");
        require(_handler != owner, "Cannot revoke owner");
        authorizedHandlers[_handler] = false;
        emit HandlerRevoked(_handler, block.timestamp);
    }

    // ============ CONFIGURATION ============

    /**
     * @dev Update minimum quantity requirement
     */
    function setMinQuantity(uint256 _quantity) public onlyOwner {
        minimallyRequiredQuantity = _quantity;
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
        authorizedHandlers[_newOwner] = true;
    }
}
