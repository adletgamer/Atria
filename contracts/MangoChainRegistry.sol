// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MangoChainRegistry
 * @dev Evidence anchoring contract for consignment compliance protocol.
 *
 * DESIGN PRINCIPLE:
 *   Nothing sensitive lives on-chain.
 *   On-chain = root hashes, attestation hashes, state snapshot hashes.
 *   Off-chain = documents, metadata, PII, events, scoring, analytics.
 *
 * PATTERN:
 *   1. System gathers evidence off-chain (Supabase).
 *   2. Computes content hashes per evidence object (SHA-256).
 *   3. Builds a bundle hash / Merkle root per consignment.
 *   4. Generates state snapshot hash.
 *   5. Anchors root + snapshot on-chain via this contract.
 *   6. Third party verifies pack matches commitment.
 *
 * ANCHOR TYPES:
 *   0 = evidence_pack    — Merkle root of all evidence objects
 *   1 = attestation      — hash of a critical attestation
 *   2 = state_snapshot   — hash of current consignment state
 *   3 = custody_chain    — hash of full custody transfer chain
 *   4 = full_consignment — combined root of entire dossier
 *
 * @author MangoChain Protocol
 */
contract MangoChainRegistry {

    // ============ ENUMS ============

    enum AnchorType {
        EvidencePack,
        Attestation,
        StateSnapshot,
        CustodyChain,
        FullConsignment
    }

    // ============ STRUCTS ============

    struct Anchor {
        bytes32   rootHash;
        AnchorType anchorType;
        bytes32   scope;          // keccak256(consignment_id) — no PII on-chain
        uint32    version;
        address   submitter;
        uint64    anchoredAt;
    }

    // ============ STATE ============

    address public owner;
    bool    public paused;

    uint256 public totalAnchors;

    // scope → version → Anchor
    mapping(bytes32 => mapping(uint32 => Anchor)) public anchors;
    // scope → latest version
    mapping(bytes32 => uint32) public latestVersion;
    // rootHash → exists (for O(1) verification)
    mapping(bytes32 => bool) public hashExists;

    // Authorized submitters (export managers, system wallets)
    mapping(address => bool) public authorizedSubmitters;

    // ============ EVENTS ============

    event AnchorCommitted(
        bytes32 indexed scope,
        bytes32 indexed rootHash,
        AnchorType  anchorType,
        uint32      version,
        address     submitter,
        uint64      anchoredAt
    );

    event SubmitterAuthorized(address indexed submitter, bool authorized);
    event OwnershipTransferred(address indexed previous, address indexed next);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ============ MODIFIERS ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedSubmitters[msg.sender] || msg.sender == owner,
            "Not authorized"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor() {
        owner = msg.sender;
        authorizedSubmitters[msg.sender] = true;
    }

    // ============ CORE: ANCHOR ============

    /**
     * @dev Commits an evidence anchor on-chain.
     * @param _rootHash    Merkle root or bundle hash (computed off-chain)
     * @param _anchorType  Type of anchor (see AnchorType enum)
     * @param _scope       keccak256(consignment_id) — identifies the case
     * @param _version     Monotonically increasing version for this scope
     */
    function commitAnchor(
        bytes32    _rootHash,
        AnchorType _anchorType,
        bytes32    _scope,
        uint32     _version
    )
        external
        onlyAuthorized
        whenNotPaused
        returns (uint256 anchorIndex)
    {
        require(_rootHash != bytes32(0), "Empty hash");
        require(_version > latestVersion[_scope], "Version must increase");

        Anchor memory a = Anchor({
            rootHash:   _rootHash,
            anchorType: _anchorType,
            scope:      _scope,
            version:    _version,
            submitter:  msg.sender,
            anchoredAt: uint64(block.timestamp)
        });

        anchors[_scope][_version] = a;
        latestVersion[_scope]     = _version;
        hashExists[_rootHash]     = true;
        totalAnchors++;

        emit AnchorCommitted(
            _scope,
            _rootHash,
            _anchorType,
            _version,
            msg.sender,
            uint64(block.timestamp)
        );

        return totalAnchors;
    }

    // ============ VERIFICATION ============

    /**
     * @dev Verifies that a root hash was anchored on-chain.
     *      Third party calls this with the hash from the evidence pack.
     */
    function verifyHash(bytes32 _rootHash) external view returns (bool) {
        return hashExists[_rootHash];
    }

    /**
     * @dev Gets the latest anchor for a consignment scope.
     */
    function getLatestAnchor(bytes32 _scope)
        external
        view
        returns (
            bytes32  rootHash,
            uint8    anchorType,
            uint32   version,
            address  submitter,
            uint64   anchoredAt
        )
    {
        uint32 v = latestVersion[_scope];
        require(v > 0, "No anchors for scope");
        Anchor memory a = anchors[_scope][v];
        return (
            a.rootHash,
            uint8(a.anchorType),
            a.version,
            a.submitter,
            a.anchoredAt
        );
    }

    /**
     * @dev Gets a specific version anchor for a scope.
     */
    function getAnchor(bytes32 _scope, uint32 _version)
        external
        view
        returns (
            bytes32  rootHash,
            uint8    anchorType,
            address  submitter,
            uint64   anchoredAt
        )
    {
        Anchor memory a = anchors[_scope][_version];
        require(a.anchoredAt > 0, "Anchor not found");
        return (
            a.rootHash,
            uint8(a.anchorType),
            a.submitter,
            a.anchoredAt
        );
    }

    /**
     * @dev Full verification: checks hash AND returns anchor metadata.
     */
    function verifyAndGet(bytes32 _rootHash, bytes32 _scope, uint32 _version)
        external
        view
        returns (
            bool   valid,
            uint8  anchorType,
            address submitter,
            uint64  anchoredAt
        )
    {
        if (!hashExists[_rootHash]) {
            return (false, 0, address(0), 0);
        }
        Anchor memory a = anchors[_scope][_version];
        if (a.rootHash != _rootHash) {
            return (false, 0, address(0), 0);
        }
        return (true, uint8(a.anchorType), a.submitter, a.anchoredAt);
    }

    // ============ ADMIN ============

    function authorizeSubmitter(address _submitter, bool _authorized)
        external
        onlyOwner
    {
        authorizedSubmitters[_submitter] = _authorized;
        emit SubmitterAuthorized(_submitter, _authorized);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }
}