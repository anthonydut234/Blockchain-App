// Manages stock levels

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ProductContract {
    address public owner;

    struct Product {
        uint productId;
        string name;
        uint quantity;
    }

    mapping(uint => Product) public products;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorised");
        _;
    }

    function addStock(uint _productId, string memory _name, uint _quantity) public onlyOwner {
        Product storage p = products[_productId];
        p.productId = _productId;
        p.name = _name;
        p.quantity += _quantity;
    }

    function deductStock(uint _productId, uint _quantity) public onlyOwner {
        Product storage p = products[_productId];
        require(p.quantity >= _quantity, "Insufficient stock");
        p.quantity -= _quantity;
    }

    function getProduct(uint _productId) public view returns (string memory, uint) {
        Product memory p = products[_productId];
        return (p.name, p.quantity);
    }
}
