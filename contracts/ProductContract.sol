// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12; // Changed from 0.8.20 to fix gas error

contract ProductContract {
    address public owner;

    /// @notice Enumeration of supported user roles in the supply chain
    enum Role { Unknown, Supplier, Manufacturer, Retailer, Consumer }
    enum ProductStatus {
        Created,
        MaterialsLogged,
        ManufacturingVerified,
        Manufactured,
        InTransit,
        Delivered,
        Finalised
    }

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
        ProductStatus status;
    }

    mapping(uint => mapping(address => Role)) public productRoles;
    mapping(uint => Product) public products;
    mapping(uint => bool) public isProductRegistered;
    uint public nextProductId = 1;

    /// @notice Restricts access to users with a specific role
    modifier onlyRole(uint productId, Role _role) {
        require(productRoles[productId][msg.sender] == _role, "Access denied: wrong role for product");
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

    constructor(address stakeholderAddress) {
        require(stakeholderAddress != address(0), "Invalid address inputted"); 
        owner = msg.sender;
        // Every address has Role Unknown at this stage
        // Address that registers a product will be assigned Role Supplier
        // Supplier then can assign roles to other addresses on their product.
    }

    // === ROLE MANAGEMENT ===
    /// @notice Assigns a role to a specific address
    /// @dev Only contract owner can use this function
    /// @param user Address to assign role to
    /// @param role The role enum value
    function assignRole(uint productId, address user, Role role) public {
        require(msg.sender == owner, "Only owner can assign roles");
        productRoles[productId][user] = role;
    }

    /// @notice Retrieves the role of a user in human-readable format
    /// @dev Converts internal enum to string for UI use
    /// @param user Address to retrieve role for
    /// @return The role as a string ("Supplier", "Manufacturer", etc.)
    function getRoleString(uint productId, address user) public view returns (string memory) {
        return roleToString(productRoles[productId][user]);
    }

    // === PRODUCT REGISTRATION ===
    /// @notice Registers a new product on the blockchain
    /// @dev Everyone can register a raw material product, and considered as Supplier for that product
    /// @return productId Unique ID assigned to the product
    function registerProduct() public returns (uint) {
        uint id = nextProductId++;
        
        products[id].productId = id;
        products[id].currentOwner = msg.sender;
        products[id].ownershipHistory.push(msg.sender);
        products[id].status = ProductStatus.Created;

        isProductRegistered[id] = true;
        productRoles[id][msg.sender] = Role.Supplier;
        emit ProductRegistered(id, msg.sender);
        return id;
    }

    // === MATERIAL LOGGING ===
    /// @notice Logs material input details for a product
    /// @dev Only the product's current owner (typically the supplier) can log
    /// @param productId ID of the product
    /// @param name Name of the material
    /// @param origin Geographic source of the material
    function logMaterialInput(uint productId, string memory name, string memory origin) public onlyRole(productId, Role.Supplier) {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "You don't own this product");

        Material memory mat = Material(name, origin, block.timestamp);
        products[productId].materials.push(mat);
        products[productId].status = ProductStatus.MaterialsLogged;

        emit MaterialLogged(productId, name, origin);
    }

    /// @notice Verifies the quality of received materials
    /// @dev Manufacturer must be the current owner
    /// @param productId ID of the product
    /// @param qualityNote Quality assurance or inspection note
    function verifyMaterialQuality(uint productId, string memory qualityNote) public onlyRole(productId, Role.Manufacturer) {
        require(isProductRegistered[productId], "Product not registered");
        require(products[productId].currentOwner == msg.sender, "Only owner can verify quality");

        // Log the verification as a manufacturing note (for simplicity)
        products[productId].status = ProductStatus.ManufacturingVerified;
        products[productId].manufacturerNote = qualityNote;
        emit ManufacturingLogged(productId, string(abi.encodePacked("Verified: ", qualityNote)));
    }


    // === MANUFACTURING LOG ===
    /// @notice Logs manufacturing or processing details
    /// @dev Used by the manufacturer to log actions taken on the product
    /// @param productId ID of the product
    /// @param note Description of manufacturing or transformation
    function logManufacturing(uint productId, string memory note) public onlyRole(productId, Role.Manufacturer) {
        require(isProductRegistered[productId], "Product not registered");                                                                                      
        /**
        * @notice Initiates transfer of product ownership.
        *
        * @dev Sender must be current owner.
        *
        * @param productId ID of the product to initiate transfer for
        * @param to Address of the next stakeholder in line for this product's journey (Manufacturer, Retailer or Consumer)
        */
        require(products[productId].currentOwner == msg.sender, "Only owner can log manufacturing");
        products[productId].manufacturerNote = note;
        products[productId].status = ProductStatus.Manufactured;
        
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

        Role senderRole = productRoles[productId][msg.sender];
        Role recipientRole = productRoles[productId][to];

        // Role-specific transfer restrictions: Supplier -> Manufacturer -> Retailer -> Cosumer
        if (senderRole == Role.Supplier) {
            require(recipientRole == Role.Manufacturer, "Must transfer to Manufacturer");
        } else if (senderRole == Role.Manufacturer) {
            require(recipientRole == Role.Retailer, "Must transfer to Retailer");
        } else if (senderRole == Role.Retailer) {
            require(recipientRole == Role.Consumer, "Must transfer to Consumer");
        } else if (senderRole == Role.Consumer) {
            if (recipientRole != Role.Consumer) {
                revert(string.concat("Transfer not allowed between ", roleToString(senderRole), " and ", roleToString(recipientRole)));
            }
        }

        products[productId].status = ProductStatus.InTransit;
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

        products[productId].status = ProductStatus.Finalised;
        
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


    // === HELPER FUNCTIONS
    /// @notice 
    function roleToString(Role role) internal pure returns (string memory) {
        if (role == Role.Unknown) return "Unknown";
        if (role == Role.Supplier) return "Supplier";
        if (role == Role.Manufacturer) return "Manufacturer";
        if (role == Role.Retailer) return "Retailer";
        if (role == Role.Consumer) return "Consumer";
        return "Invalid";
    }

    function getProductStatusString(uint productId) public view returns (string memory) {
        require(products[productId].currentOwner == msg.sender, "You don't own this product");
        return statusToString(products[productId].status);
    }

    function statusToString(ProductStatus status) public pure returns (string memory) {
        if (status == ProductStatus.Created) return "Created";
        if (status == ProductStatus.MaterialsLogged) return "MaterialsLogged";
        if (status == ProductStatus.ManufacturingVerified) return "ManufacturingVerified";
        if (status == ProductStatus.Manufactured) return "Manufactured";
        if (status == ProductStatus.InTransit) return "InTransit";
        if (status == ProductStatus.Delivered) return "Delivered";
        if (status == ProductStatus.Finalised) return "Finalised";
        return "Unknown";
    }


}
