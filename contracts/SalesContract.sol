// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SalesContract for TrackChain
/// @notice Handles retail and consumer product sales, confirmations, and resale tracking
/// @dev Interacts with ProductContract for ownership verification

interface IProductContract {
    function getCurrentOwner(uint productId) external view returns (address);
    function initiateTransfer(uint productId, address to) external;
    function getProductHistory(uint productId) external view returns (address[] memory);
}

contract SalesContract {
    address public owner;
    IProductContract public productContract;

    /// @notice Mapping of product sales
    mapping(uint => Sale) public sales;

    /// @notice Tracks the full sales history of each product
    mapping(uint => Sale[]) public salesHistory;


    /// @notice Represents a product sale
    struct Sale {
        uint productId;
        address seller;
        address buyer;
        uint timestamp;
        bool confirmed;
    }

    /// @notice Ensures only the contract owner can perform certain actions
    // modifier onlyOwner() {
    //     require(msg.sender == owner, "Only contract owner allowed");
    //     _;
    // }

    /// @notice Ensures the caller is the product's current owner
    modifier onlyProductOwner(uint productId) {
        require(productContract.getCurrentOwner(productId) == msg.sender, "Not current owner");
        _;
    }

    /// @notice Event for product listing
    event ProductListed(uint indexed productId, address indexed seller, address indexed buyer);

    /// @notice Event for confirming product sale
    event SaleConfirmed(uint indexed productId, address indexed buyer);

    /// @notice Constructor sets the owner and links the ProductContract
    /// @param _productContract Address of the deployed ProductContract
    constructor(address _productContract) {
        owner = msg.sender;
        productContract = IProductContract(_productContract);
    }

    /// @notice Lists a product for sale to a specific buyer
    /// @param productId The ID of the product
    /// @param buyer The address of the buyer
    function listProductForSale(uint productId, address buyer) public onlyProductOwner(productId) {
        require(buyer != address(0), "Invalid buyer address");
        
        sales[productId] = Sale({
            productId: productId,
            seller: msg.sender,
            buyer: buyer,
            timestamp: block.timestamp,
            confirmed: false
        });

        salesHistory[productId].push(sales[productId]);

        emit ProductListed(productId, msg.sender, buyer);
    }

    /// @notice Buyer confirms the purchase and transfer of ownership
    /// @param productId ID of the product being confirmed
    function confirmSale(uint productId) public {
        Sale storage sale = sales[productId];
        require(sale.buyer == msg.sender, "Only designated buyer can confirm");
        require(!sale.confirmed, "Already confirmed");

        sale.confirmed = true;

        uint lastIndex = salesHistory[productId].length - 1;
        salesHistory[productId][lastIndex].confirmed = true;


        // Transfer product via ProductContract
        emit SaleConfirmed(productId, msg.sender);
    }

    /// @notice Returns sale details for a product
    /// @param productId The product ID
    function getSaleDetails(uint productId) public view returns (address, address, uint, bool) {
        Sale memory s = sales[productId];
        return (s.seller, s.buyer, s.timestamp, s.confirmed);
    }

    /// @notice Returns how many sales a product has gone through
    function getSalesCount(uint productId) public view returns (uint) {
        return salesHistory[productId].length;
    }

}
