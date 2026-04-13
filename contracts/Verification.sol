// SPDX-License-Identifier: MIT
// DEPRECATED — see MangoChainRegistry.sol
pragma solidity ^0.8.20;

/**
 * @title Verification — DEPRECATED
 * @notice Do NOT deploy. User verification via Supabase Auth + user_roles RLS.
 * @title Verification
 * @dev Contract for managing verified status of farmers and buyers
 */
contract Verification {
    mapping(address => bool) public isVerified;
    address public owner;

    event UserVerified(address indexed user, uint256 timestamp);
    event UserRevoked(address indexed user, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Grant verified status to a user
     * @param _user Address of the user to verify
     */
    function verifyUser(address _user) public onlyOwner {
        require(!isVerified[_user], "User already verified");
        isVerified[_user] = true;
        emit UserVerified(_user, block.timestamp);
    }

    /**
     * @dev Revoke verified status from a user
     * @param _user Address of the user to revoke
     */
    function revokeUser(address _user) public onlyOwner {
        require(isVerified[_user], "User not verified");
        isVerified[_user] = false;
        emit UserRevoked(_user, block.timestamp);
    }
}
