// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleWallet {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    // Function to receive Ether
    receive() external payable {}

    // Function to send Ether from contract to another address
    function sendEther(address payable _to, uint _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        (bool sent, ) = _to.call{value: _amount}("");
        require(sent, "Failed to send Ether");
    }

    // Function that returns "Hello, World"
    function sayHello() external pure returns (string memory) {
        return "Hello, World";
    }
}
