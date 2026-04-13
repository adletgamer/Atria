// SPDX-License-Identifier: MIT
// DEPRECATED — see MangoChainRegistry.sol
pragma solidity ^0.8.20;

/**
 * @title SupplyChainTracking — DEPRECATED
 * @notice Do NOT deploy. Tracking off-chain (Supabase) + hashes anchored via MangoChainRegistry.sol.
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
        bytes32 certificateHash; // IFPS hash or certificate ID 
        uint256 transactionValue; // Price/value for trasnsaction at this stage
        bytes32 qrCodeHash; // Hash of QR code data
    }
    struct Batch {
        bool exists;
        bool frozen; // If batch is frozen (fraud/error)
        Stage currentStage;
        bytes32 batchHash; // bytes32 version of batchId for optimization
        uint256 creationTimestamp;
        address creator;
        string metadata; // Additional metadata in JSON string format
    }
    
    // Mapping from batchId (as bytes32) to Batch struct
    mapping(bytes32 => Batch) public batches;
    
    // Mapping from batchId (as bytes32) to array of tracking events
    mapping(bytes32 => TrackingEvent[]) public batchHistory;
    
    // Mapping to define which stages each handler can register
    mapping(address => Stage[]) public handlerPermissions;
    
    // Mapping to track if address is authorized handler
    mapping(address => bool) public authorizedHandlers;
    
    // Contract owner
    address public owner;
    
    // Events
    event HandlerAuthorized(address indexed handler, Stage[] permissions, uint256 timestamp);
    event HandlerRevoked(address indexed handler, uint256 timestamp);
    event TrackingEventAdded(
        bytes32 indexed batchIdHash,
        string batchId,
        Stage stage,
        string location,
        address indexed handler,
        uint256 timestamp,
        string notes,
        bytes32 certificateHash,
        uint256 transactionValue,
        bytes32 qrCodeHash
    );

    event BatchCreated(bytes32 indexed batchIdHash, string batchId, address indexed creator, uint256 timestamp);
    event BatchFrozen(bytes32 indexed batchIdHash, string batchId, address indexed by, uint256 timestamp, string reason);
    event BatchUnfrozen(bytes32 indexed batchIdHash, string batchId, address indexed by, uint256 timestamp);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorizedHandler() {
        require(authorizedHandlers[msg.sender], "Not an authorized handler");
        _;
    }

    modifier batchExists(string memory _batchId) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(batches[batchHash].exists, "Batch does not exist");
        _;
    }
    
    modifier batchNotFrozen(string memory _batchId) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(!batches[batchHash].frozen, "Batch is frozen");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedHandlers[msg.sender] = true; // Owner is automatically a handler

        // Owner can register all stages by default
        Stage[] memory allStages = new Stage[](8);
        allStages[0] = Stage.Harvest;
        allStages[1] = Stage.Processing;
        allStages[2] = Stage.QualityControl;
        allStages[3] = Stage.Packaging;
        allStages[4] = Stage.Export;
        allStages[5] = Stage.Distribution;
        allStages[6] = Stage.Retail;
        allStages[7] = Stage.Delivered;
        
        handlerPermissions[msg.sender] = allStages;
    }
    
    /**
     * @dev Authorize a new handler
     * @param _handler Address of the handler to authorize
     */
    function authorizeHandler(address _handler, Stage[] memory _permissions) public onlyOwner {
        require(!authorizedHandlers[_handler], "Already authorized");
        require(_permissions.length > 0, "Handler must have at least one permission");
        
        authorizedHandlers[_handler] = true;
        handlerPermissions[_handler] = _permissions;
        
        emit HandlerAuthorized(_handler, _permissions, block.timestamp);
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
     * @dev Create a new batch (must be done before adding tracking events)
     * @param _batchId The batch ID
     * @param _metadata Additional metadata (JSON string)
     */
    function createBatch(string memory _batchId, string memory _metadata) public onlyAuthorizedHandler {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(!batches[batchHash].exists, "Batch already exists");
        require(bytes(_batchId).length > 0, "Batch ID cannot be empty");
        
        batches[batchHash] = Batch({
            exists: true,
            frozen: false,
            currentStage: Stage.Harvest, // Start at first stage
            batchHash: batchHash,
            creationTimestamp: block.timestamp,
            creator: msg.sender,
            metadata: _metadata
        });
        
        emit BatchCreated(batchHash, _batchId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Check if handler has permission to register a specific stage
     */
    function canRegisterStage(address _handler, Stage _stage) internal view returns (bool) {
        Stage[] memory permissions = handlerPermissions[_handler];
        for (uint i = 0; i < permissions.length; i++) {
            if (permissions[i] == _stage) {
                return true;
            }
        }
        return false;
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
    ) public onlyAuthorizedHandler batchExists(_batchId) batchNotFrozen(_batchId) {
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        Batch storage batch = batches[batchHash];
        
        // 1. VALIDACIÓN: El batch debe existir (ya lo hace el modifier)
        
        // 2. VALIDACIÓN: Verificar orden de etapas
        // Permitir Harvest como primera etapa sin validación previa
        if (batchHistory[batchHash].length > 0) {
            require(uint8(_stage) > uint8(batch.currentStage), "Stage must be after current stage");
        }
        
        // 3. VALIDACIÓN: Verificar permisos del handler
        require(canRegisterStage(msg.sender, _stage), "Handler not authorized for this stage");
        
        // Crear evento de tracking
        TrackingEvent memory newEvent = TrackingEvent({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender,
            notes: _notes,
            certificateHash: bytes32(0), // Valor por defecto
            transactionValue: 0, // Valor por defecto
            qrCodeHash: bytes32(0) // Valor por defecto
        });
        
        batchHistory[batchHash].push(newEvent);
        
        // Actualizar etapa actual del batch
        batch.currentStage = _stage;
        
        // Emitir evento
        emit TrackingEventAdded(
            batchHash,
            _batchId,
            _stage,
            _location,
            msg.sender,
            block.timestamp,
            _notes,
            bytes32(0),
            0,
            bytes32(0)
        );
    }
    
    /**
     * @dev Add a tracking event with enhanced data
     */
    function addTrackingEventWithData(
        string memory _batchId,
        Stage _stage,
        string memory _location,
        string memory _notes,
        bytes32 _certificateHash,
        uint256 _transactionValue,
        bytes32 _qrCodeHash
    ) public onlyAuthorizedHandler batchExists(_batchId) batchNotFrozen(_batchId) {
        require(bytes(_location).length > 0, "Location cannot be empty");
        
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        Batch storage batch = batches[batchHash];
        
        // Validaciones
        if (batchHistory[batchHash].length > 0) {
            require(uint8(_stage) > uint8(batch.currentStage), "Stage must be after current stage");
        }
        
        require(canRegisterStage(msg.sender, _stage), "Handler not authorized for this stage");
        
        // Crear evento de tracking con datos adicionales
        TrackingEvent memory newEvent = TrackingEvent({
            stage: _stage,
            location: _location,
            timestamp: block.timestamp,
            handler: msg.sender,
            notes: _notes,
            certificateHash: _certificateHash,
            transactionValue: _transactionValue,
            qrCodeHash: _qrCodeHash
        });
        
        batchHistory[batchHash].push(newEvent);
        
        // Actualizar etapa actual del batch
        batch.currentStage = _stage;
        
        // Emitir evento
        emit TrackingEventAdded(
            batchHash,
            _batchId,
            _stage,
            _location,
            msg.sender,
            block.timestamp,
            _notes,
            _certificateHash,
            _transactionValue,
            _qrCodeHash
        );
    }
    
    /**
     * @dev Get all tracking events for a batch
     * @param _batchId The batch ID to query
     * @return Array of tracking events
     */
    function getBatchHistory(string memory _batchId) public view returns (TrackingEvent[] memory) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        return batchHistory[batchHash];
    }
    
    /**
     * @dev Get the current stage of a batch
     * @param _batchId The batch ID to query
     * @return Current stage
     */
    function getCurrentStage(string memory _batchId) public view returns (Stage) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(batches[batchHash].exists, "Batch does not exist");
        require(batchHistory[batchHash].length > 0, "No tracking events found");
        
        return batches[batchHash].currentStage;
    }
    
    /**
     * @dev Get total number of tracking events for a batch
     * @param _batchId The batch ID to query
     * @return Number of events
     */
    function getEventCount(string memory _batchId) public view returns (uint256) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        return batchHistory[batchHash].length;
    }
    
    /**
     * @dev Freeze a batch (owner only, in case of fraud or error)
     * @param _batchId The batch ID to freeze
     * @param _reason Reason for freezing
     */
    function freezeBatch(string memory _batchId, string memory _reason) public onlyOwner batchExists(_batchId) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(!batches[batchHash].frozen, "Batch already frozen");
        
        batches[batchHash].frozen = true;
        emit BatchFrozen(batchHash, _batchId, msg.sender, block.timestamp, _reason);
    }
    
    /**
     * @dev Unfreeze a batch (owner only)
     * @param _batchId The batch ID to unfreeze
     */
    function unfreezeBatch(string memory _batchId) public onlyOwner batchExists(_batchId) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(batches[batchHash].frozen, "Batch is not frozen");
        
        batches[batchHash].frozen = false;
        emit BatchUnfrozen(batchHash, _batchId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get batch information
     * @param _batchId The batch ID to query
     * @return Batch struct
     */
    function getBatchInfo(string memory _batchId) public view returns (Batch memory) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        require(batches[batchHash].exists, "Batch does not exist");
        return batches[batchHash];
    }
    
    /**
     * @dev Check if batch exists
     * @param _batchId The batch ID to check
     * @return True if batch exists
     */
    function batchExistsCheck(string memory _batchId) public view returns (bool) {
        bytes32 batchHash = keccak256(abi.encodePacked(_batchId));
        return batches[batchHash].exists;
    }
    
    /**
     * @dev Get handler permissions
     * @param _handler Address to check
     * @return Array of allowed stages
     */
    function getHandlerPermissions(address _handler) public view returns (Stage[] memory) {
        return handlerPermissions[_handler];
    }
}