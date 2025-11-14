// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MangoChainRegistry
 * @dev Smart contract para registro y trazabilidad de lotes de mango en Polygon Amoy
 * @author MangoChain Team
 */
contract MangoChainRegistry {
    // ============ STRUCTS ============
    
    struct LoteMango {
        string loteId;
        address productor;
        string productorName;
        string ubicacion;
        string variedad;
        string calidad;
        uint256 fechaCosecha;
        uint256 fechaRegistro;
        address owner;
        string metadata; // IPFS hash para fotos/certificados
        bool activo;
    }
    
    struct Transferencia {
        address from;
        address to;
        uint256 timestamp;
        string motivo;
        string comentario;
    }
    
    // ============ STATE VARIABLES ============
    
    address public owner;
    uint256 public totalLotes;
    uint256 public totalTransferencias;
    
    // Mappings para almacenar datos
    mapping(string => LoteMango) public lotes;
    mapping(string => Transferencia[]) public historialLotes;
    mapping(address => string[]) public lotesPorProductor;
    mapping(string => bool) public loteIdExiste;
    
    // ============ EVENTS ============
    
    event LoteRegistrado(
        string indexed loteId,
        address indexed productor,
        string productorName,
        string ubicacion,
        string variedad,
        string calidad,
        uint256 fechaRegistro
    );
    
    event PropiedadTransferida(
        string indexed loteId,
        address indexed previousOwner,
        address indexed newOwner,
        string motivo,
        uint256 timestamp
    );
    
    event LoteVerificado(
        string indexed loteId,
        address verifier,
        uint256 timestamp,
        bool resultado
    );
    
    event ContratoActualizado(
        address indexed admin,
        string version,
        uint256 timestamp
    );
    
    // ============ MODIFIERS ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el owner puede ejecutar esta funcion");
        _;
    }
    
    modifier loteExiste(string memory _loteId) {
        require(loteIdExiste[_loteId], "Lote no existe");
        _;
    }
    
    modifier esOwnerDelLote(string memory _loteId) {
        require(lotes[_loteId].owner == msg.sender, "No eres el dueno de este lote");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor() {
        owner = msg.sender;
        totalLotes = 0;
        totalTransferencias = 0;
        
        emit ContratoActualizado(msg.sender, "v1.0", block.timestamp);
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Registra un nuevo lote de mango en blockchain
     */
    function registrarLote(
        string memory _loteId,
        string memory _productorName,
        string memory _ubicacion,
        string memory _variedad,
        string memory _calidad,
        uint256 _fechaCosecha,
        string memory _metadata
    ) external returns (bool) {
        // Validaciones
        require(bytes(_loteId).length > 0, "ID de lote requerido");
        require(!loteIdExiste[_loteId], "Lote ID ya existe");
        require(bytes(_productorName).length > 0, "Nombre de productor requerido");
        require(bytes(_ubicacion).length > 0, "Ubicacion requerida");
        require(_fechaCosecha <= block.timestamp, "Fecha de cosecha invalida");
        
        // Crear nuevo lote
        LoteMango memory nuevoLote = LoteMango({
            loteId: _loteId,
            productor: msg.sender,
            productorName: _productorName,
            ubicacion: _ubicacion,
            variedad: _variedad,
            calidad: _calidad,
            fechaCosecha: _fechaCosecha,
            fechaRegistro: block.timestamp,
            owner: msg.sender,
            metadata: _metadata,
            activo: true
        });
        
        // Almacenar en blockchain
        lotes[_loteId] = nuevoLote;
        loteIdExiste[_loteId] = true;
        lotesPorProductor[msg.sender].push(_loteId);
        totalLotes++;
        
        // Emitir evento
        emit LoteRegistrado(
            _loteId,
            msg.sender,
            _productorName,
            _ubicacion,
            _variedad,
            _calidad,
            block.timestamp
        );
        
        return true;
    }
    
    /**
     * @dev Transfiere la propiedad de un lote
     */
    function transferirPropiedad(
        string memory _loteId,
        address _nuevoOwner,
        string memory _motivo,
        string memory _comentario
    ) external loteExiste(_loteId) esOwnerDelLote(_loteId) returns (bool) {
        require(_nuevoOwner != address(0), "Direccion invalida");
        require(_nuevoOwner != msg.sender, "No puedes transferir a ti mismo");
        require(lotes[_loteId].activo, "Lote no esta activo");
        
        address previousOwner = lotes[_loteId].owner;
        
        // Actualizar owner
        lotes[_loteId].owner = _nuevoOwner;
        
        // Registrar transferencia en historial
        Transferencia memory nuevaTransferencia = Transferencia({
            from: previousOwner,
            to: _nuevoOwner,
            timestamp: block.timestamp,
            motivo: _motivo,
            comentario: _comentario
        });
        
        historialLotes[_loteId].push(nuevaTransferencia);
        totalTransferencias++;
        
        // Emitir evento
        emit PropiedadTransferida(
            _loteId,
            previousOwner,
            _nuevoOwner,
            _motivo,
            block.timestamp
        );
        
        return true;
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Obtiene información completa de un lote
     */
    function obtenerLote(string memory _loteId) 
        external 
        view 
        loteExiste(_loteId) 
        returns (
            string memory,
            address,
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            address,
            string memory,
            bool
        ) 
    {
        LoteMango memory lote = lotes[_loteId];
        return (
            lote.loteId,
            lote.productor,
            lote.productorName,
            lote.ubicacion,
            lote.variedad,
            lote.calidad,
            lote.fechaCosecha,
            lote.fechaRegistro,
            lote.owner,
            lote.metadata,
            lote.activo
        );
    }
    
    /**
     * @dev Obtiene el historial completo de un lote
     */
    function obtenerHistorial(string memory _loteId) 
        external 
        view 
        loteExiste(_loteId) 
        returns (Transferencia[] memory) 
    {
        return historialLotes[_loteId];
    }
    
    /**
     * @dev Verifica la autenticidad de un lote
     */
    function verificarLote(string memory _loteId) 
        external 
        view 
        loteExiste(_loteId) 
        returns (bool, string memory) 
    {
        LoteMango memory lote = lotes[_loteId];
        
        if (!lote.activo) {
            return (false, "Lote no esta activo");
        }
        
        if (lote.productor == address(0)) {
            return (false, "Productor invalido");
        }
        
        return (true, "Lote verificado correctamente");
    }
    
    /**
     * @dev Obtiene los lotes de un productor
     */
    function obtenerLotesPorProductor(address _productor) 
        external 
        view 
        returns (string[] memory) 
    {
        return lotesPorProductor[_productor];
    }
    
    /**
     * @dev Obtiene información resumida del contrato
     */
    function obtenerEstadisticas() 
        external 
        view 
        returns (uint256, uint256, uint256) 
    {
        return (totalLotes, totalTransferencias, block.timestamp);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Permite al owner desactivar un lote (solo en casos especiales)
     */
    function desactivarLote(string memory _loteId) 
        external 
        onlyOwner 
        loteExiste(_loteId) 
    {
        lotes[_loteId].activo = false;
    }
    
    /**
     * @dev Permite al owner activar un lote
     */
    function activarLote(string memory _loteId) 
        external 
        onlyOwner 
        loteExiste(_loteId) 
    {
        lotes[_loteId].activo = true;
    }
    
    /**
     * @dev Transferir ownership del contrato (para upgrades)
     */
    function transferirOwnershipContrato(address _nuevoOwner) external onlyOwner {
        require(_nuevoOwner != address(0), "Nuevo owner no puede ser address zero");
        owner = _nuevoOwner;
    }
    
    /**
     * @dev Función de emergencia - solo para debugging en testnet
     */
    function emergencyStop() external onlyOwner {
        // Esta función podría pausar el contrato en versiones futuras
        emit ContratoActualizado(msg.sender, "EMERGENCY_STOP", block.timestamp);
    }
}