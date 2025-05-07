//Handles conditional payments and refunds
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PaymentContract {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    event PaymentMade(address to, uint amount);
    event RefundIssued(address to, uint amount);

    function charge(address payable _recipient) public payable onlyOwner {
        require(msg.value > 0, "No funds sent");
        _recipient.transfer(msg.value);
        emit PaymentMade(_recipient, msg.value);
    }

    function refund(address payable _recipient, uint _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient funds");
        _recipient.transfer(_amount);
        emit RefundIssued(_recipient, _amount);
    }

    // Allow receiving ether
    receive() external payable {}
}
