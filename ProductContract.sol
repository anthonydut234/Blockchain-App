// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProductContract {
    address public owner;

    /// @notice Enumeration of supported user roles in the supply chain
    enum Role { Unknown, Supplier, Manufacturer, Retailer, Consumer }

    /// @notice Struct representing a raw material component
    struct Material {
        string name;        // e.g., "Italian Leather"
        string origin;      // e.g., "Tuscany, Italy"
        uint timestamp;     // When the material was logged in Unix time
    }

    /// @notice Struct representing a full product's lifecycle data
    struct Product {
        uint productId;
        Material[] materials;       // All input materials
        string manufacturerNote;    // Manufacturing or quality log
        address currentOwner;
        address[] ownershipHistory;
    }

    mapping(address => Role) public roles;
    mapping(uint => Product) public products;
    mapping(uint => bool) public isProductRegistered;
    uint public nextProductId = 1;

    /// @notice Restricts access to users with a specific role
    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Access denied: wrong role");
        _;
    }

    /// @notice Emitted when a product is registered
    event ProductRegistered(uint productId, address by);
    /// @notice Emitted when a material is logged
    event MaterialLogged(uint productId, string name, string origin);
    /// @notice Emitted when a manufacturer logs production or quality
    event ManufacturingLogged(uint productId, string note);
    /// @notice Emitted when product ownership changes
    event OwnershipTransferred(uint productId, address from, address to);

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.Supplier; // Initial role assignment
    }

    // === ROLE MANAGEMENT ===
    /// @notice Assigns a role to a specific address
    /// @dev Only contract owner can use this function
    /// @param user Address to assign role to
    /// @param role The role enum value
    function assignRole(address user, Role role) public {
        require(msg.sender == owner, "Only owner can assign roles");
        roles[user] = role;
    }

    // === PRODUCT REGISTRATION ===
    /// @notice Registers a new product on the blockchain
    /// @dev Only a Supplier can register raw material product
    /// @return productId Unique ID assigned to the product
    function registerProduct() public onlyRole(Role.Supplier) returns (uint) {
        uint id = nextProductId++;
        products[id].productId = id;
        products[id].currentOwner = msg.sender;
        products[id].ownershipHistory.push(msg.sender);
        isProductRegistered[id] = true;
        emit ProductRegistered(id, msg.sender);
        return id;
    }

    // === MATERIAL LOGGING ===
    /// @notice Logs material input details for a product
    /// @dev Only the product's current owner (typically the supplier) can log
    /// @param productId ID of the product
    /// @param name Name of the material
    /// @param origin Geographic source of the material
    function logMaterialInput(uint productId, string memory name, string memory origin) public onlyRole(Role.Supplier) {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "You don't own this product");

        Material memory mat = Material(name, origin, block.timestamp);
        products[productId].materials.push(mat);
        emit MaterialLogged(productId, name, origin);
    }

    /// @notice Verifies the quality of received materials
    /// @dev Manufacturer must be the current owner
    /// @param productId ID of the product
    /// @param qualityNote Quality assurance or inspection note
    function verifyMaterialQuality(uint productId, string memory qualityNote) public onlyRole(Role.Manufacturer) {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "Only owner can verify quality");

    // Log the verification as a manufacturing note (for simplicity)
    products[productId].manufacturerNote = qualityNote;
    emit ManufacturingLogged(productId, string(abi.encodePacked("Verified: ", qualityNote)));
}


    // === MANUFACTURING LOG ===
    /// @notice Logs manufacturing or processing details
    /// @dev Used by the manufacturer to log actions taken on the product
    /// @param productId ID of the product
    /// @param note Description of manufacturing or transformation
    function logManufacturing(uint productId, string memory note) public onlyRole(Role.Manufacturer) {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "Only owner can log manufacturing");
        products[productId].manufacturerNote = note;
        emit ManufacturingLogged(productId, note);
    }

    // === TRANSFER FUNCTION ===
    /// @notice Initiates transfer of product ownership
    /// @dev Sender must be current owner
    /// @param productId ID of the product
    /// @param to Address of the next stakeholder
    function initiateTransfer(uint productId, address to) public {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "Only owner can initiate transfer");
        require(to != address(0), "Invalid recipient");

        products[productId].currentOwner = to;
        products[productId].ownershipHistory.push(to);

        emit OwnershipTransferred(productId, msg.sender, to);
    }
    /// @notice Confirms transfer of ownership (e.g., by recipient)
    /// @dev Called by new owner to confirm receipt
    /// @param productId ID of the product being confirmed
    function confirmTransfer(uint productId) public {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "Only current owner can confirm transfer");

    // For now, just acknowledge confirmation — could extend later
    emit OwnershipTransferred(productId, msg.sender, msg.sender); // Optional: log confirmation
}


    // === PRODUCT HISTORY ===
    /// @notice Returns the full ownership history of a product
    /// @param productId ID of the product
    /// @return Array of addresses who previously owned the product
    function getProductHistory(uint productId) public view returns (address[] memory) {
        return products[productId].ownershipHistory;
    }

    // === CURRENT OWNER ===
    /// @notice Returns the current owner of a product
    /// @param productId ID of the product
    /// @return Address of the current owner
    function getCurrentOwner(uint productId) public view returns (address) {
        return products[productId].currentOwner;
    }

    // === MATERIALS VIEW ===
    /// @notice Retrieves all materials logged for a product
    /// @param productId ID of the product
    /// @return Array of Material structs
    function getMaterials(uint productId) public view returns (Material[] memory) {
        return products[productId].materials;
    }
}
