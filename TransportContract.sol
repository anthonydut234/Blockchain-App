// Tracks delivery checkpoints and status

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransportContract {
    address public owner;

    struct Delivery {
        uint productId;
        string status;
        string lastCheckpoint;
        bool delivered;
    }

    mapping(uint => Delivery) public deliveries;

    event DeliveryConfirmed(uint productId);
    event DeliveryFailed(uint productId, string reason);
    event CheckpointAdded(uint productId, string location);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    function addCheckpoint(uint _productId, string memory _location) public onlyOwner {
        deliveries[_productId].lastCheckpoint = _location;
        deliveries[_productId].status = "In Transit";
        emit CheckpointAdded(_productId, _location);
    }

    function confirmDelivery(uint _productId) public onlyOwner {
        deliveries[_productId].delivered = true;
        deliveries[_productId].status = "Delivered";
        emit DeliveryConfirmed(_productId);
    }

    function reportFailure(uint _productId, string memory _reason) public onlyOwner {
        deliveries[_productId].status = "Failed";
        emit DeliveryFailed(_productId, _reason);
    }

    function getDeliveryStatus(uint _productId) public view returns (string memory, string memory, bool) {
        Delivery memory d = deliveries[_productId];
        return (d.status, d.lastCheckpoint, d.delivered);
    }
}
