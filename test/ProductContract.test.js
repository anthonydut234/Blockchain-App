const { expect } = require("chai");

describe("ProductContract", function () {
    let contract;
    let unknown, owner, supplier, manufacturer, retailer, consumer;

    beforeEach(async function () {
        [unknown, owner, supplier, manufacturer, retailer, consumer] = await ethers.getSigners();
        const ProductContract = await ethers.getContractFactory("ProductContract");
        contract = await ProductContract.connect(owner).deploy(owner.address);
    });

    it("owner should be able to assign roles", async function () {
        await contract.assignRole(0, supplier.address, 1);
        expect(await contract.getRoleString(0, supplier.address)).to.equal("Supplier");

        await contract.assignRole(0, manufacturer.address, 2);
        expect(await contract.getRoleString(0, manufacturer.address)).to.equal("Manufacturer");

        await contract.assignRole(0, retailer.address, 3);
        expect(await contract.getRoleString(0, retailer.address)).to.equal("Retailer");

        await contract.assignRole(0, consumer.address, 4);
        expect(await contract.getRoleString(0, consumer.address)).to.equal("Consumer");
    });

    it("addresses role should be Unknown type before being assigned", async function () {
        expect(await contract.getRoleString(0, supplier.address)).to.equal("Unknown");
        expect(await contract.getRoleString(0, manufacturer.address)).to.equal("Unknown");
        expect(await contract.getRoleString(0, retailer.address)).to.equal("Unknown");
        expect(await contract.getRoleString(0, consumer.address)).to.equal("Unknown");
    });

    it("every address should be able to register a product", async function () {
        await contract.connect(unknown).registerProduct();
        expect(await contract.nextProductId()).to.equal(2);

        await contract.connect(owner).registerProduct();
        expect(await contract.nextProductId()).to.equal(3);

        await contract.connect(supplier).registerProduct();
        expect(await contract.nextProductId()).to.equal(4);

        await contract.connect(manufacturer).registerProduct();
        expect(await contract.nextProductId()).to.equal(5);

        await contract.connect(retailer).registerProduct();
        expect(await contract.nextProductId()).to.equal(6);

        await contract.connect(consumer).registerProduct();
        expect(await contract.nextProductId()).to.equal(7);
    });

    it("an address should be of Supplier type after registered a product", async function () {
        await contract.connect(unknown).registerProduct();
        expect(await contract.getRoleString(1, unknown.address)).to.equal("Supplier");

        await contract.connect(owner).registerProduct();
        expect(await contract.getRoleString(2, owner.address)).to.equal("Supplier");

        await contract.connect(supplier).registerProduct();
        expect(await contract.getRoleString(3, supplier.address)).to.equal("Supplier");

        await contract.connect(manufacturer).registerProduct();
        expect(await contract.getRoleString(4, manufacturer.address)).to.equal("Supplier");

        await contract.connect(retailer).registerProduct();
        expect(await contract.getRoleString(5, retailer.address)).to.equal("Supplier");

        await contract.connect(consumer).registerProduct();
        expect(await contract.getRoleString(6, consumer.address)).to.equal("Supplier");
    });

    it("should restrict unauthorised roles", async function () {
        await contract.connect(supplier).registerProduct();
        await expect(contract.connect(unknown).logMaterialInput(1, "Leather", "Italy")).to.be.revertedWith("Access denied: wrong role for product");
        await expect(contract.connect(owner).logMaterialInput(1, "Leather", "Italy")).to.be.revertedWith("Access denied: wrong role for product");
        await expect(contract.connect(manufacturer).logMaterialInput(1, "Leather", "Italy")).to.be.revertedWith("Access denied: wrong role for product");
        await expect(contract.connect(retailer).logMaterialInput(1, "Leather", "Italy")).to.be.revertedWith("Access denied: wrong role for product");
        await expect(contract.connect(consumer).logMaterialInput(1, "Leather", "Italy")).to.be.revertedWith("Access denied: wrong role for product");
    });

    it("should permit authorised role to log materials", async function () {
        await contract.connect(supplier).registerProduct();
        const materials = [
            {
                "name": "Leather",
                "origin": "Italy",
            },
            {
                "name": "Button",
                "origin": "England",
            },
            {
                "name": "Wool",
                "origin": "France",
            }
        ];

        for (const material of materials) {
            const res = await contract.connect(supplier).logMaterialInput(1, material.name, material.origin);
            // should emit with correct args
            expect(res).to.emit(contract, "MaterialLogged").withArgs(1, material.name, material.origin);
        }

        const loggedMaterials = await contract.getMaterials(1);
        for (let i = 0; i < loggedMaterials.length; i++) {
            expect(loggedMaterials[i].name).to.equal(materials[i].name);
            expect(loggedMaterials[i].origin).to.equal(materials[i].origin);
        }
    });

    it("should permit authorised role to log manufacturing details", async function () {
        await contract.connect(supplier).registerProduct();
        await contract.connect(owner).assignRole(1, manufacturer.address, 2); 
        await contract.connect(supplier).initiateTransfer(1, manufacturer.address);
        await contract.connect(manufacturer).confirmTransfer(1);

        await expect(contract.connect(manufacturer).logManufacturing(1, "This might take longer than expected")).to.emit(contract, "ManufacturingLogged").withArgs(1, "This might take longer than expected");
    });

    it("should be able to transfer onwership based on production process", async function () {
        // Register a product
        await contract.connect(supplier).registerProduct();
        // Assign role for manufacturer
        await contract.connect(owner).assignRole(1, manufacturer.address, 2); 
        // Assign role for retailer
        await contract.connect(owner).assignRole(1, retailer.address, 3); 
        // Assign role for consumer
        await contract.connect(owner).assignRole(1, consumer.address, 4); 

        // Transfer onwership to manufacturer
        await expect(contract.connect(supplier).initiateTransfer(1, manufacturer.address)).to.emit(contract, "OwnershipTransferred").withArgs(1, supplier.address, manufacturer.address);
        expect(await contract.connect(manufacturer).getProductStatusString(1)).to.equal("InTransit");
        // Confirm transfer 
        await contract.connect(manufacturer).confirmTransfer(1);
        expect(await contract.connect(manufacturer).getProductStatusString(1)).to.equal("Finalised");

        await expect(contract.connect(manufacturer).initiateTransfer(1, retailer.address)).to.emit(contract, "OwnershipTransferred").withArgs(1, manufacturer.address, retailer.address);
        expect(await contract.connect(retailer).getProductStatusString(1)).to.equal("InTransit");
        await contract.connect(retailer).confirmTransfer(1);
        expect(await contract.connect(retailer).getProductStatusString(1)).to.equal("Finalised");

        await expect(contract.connect(retailer).initiateTransfer(1, consumer.address)).to.emit(contract, "OwnershipTransferred").withArgs(1, retailer.address, consumer.address);
        expect(await contract.connect(consumer).getProductStatusString(1)).to.equal("InTransit");
        await contract.connect(consumer).confirmTransfer(1);
        expect(await contract.connect(consumer).getProductStatusString(1)).to.equal("Finalised");
    });

    it("should revert when does not follow production process", async function () {
        await contract.connect(owner).assignRole(1, manufacturer.address, 2); 
        await contract.connect(owner).assignRole(1, retailer.address, 3); 
        await contract.connect(owner).assignRole(1, consumer.address, 4); 

        await contract.connect(supplier).registerProduct();
        await expect(contract.connect(supplier).initiateTransfer(1, retailer.address)).to.be.revertedWith("Must transfer to Manufacturer");

        await contract.connect(supplier).initiateTransfer(1, manufacturer.address);
        await contract.connect(manufacturer).initiateTransfer(1, retailer.address);
        await contract.connect(retailer).initiateTransfer(1, consumer.address);

        await expect(contract.connect(consumer).initiateTransfer(1, retailer.address)).to.be.revertedWith("Transfer not allowed between Consumer and Retailer");

        const expectedOwners = [supplier.address,manufacturer.address,retailer.address,consumer.address];

        expect(await contract.getProductHistory(1)).to.deep.equal(expectedOwners);
    });
    
    it("should permit authorised role to verify materials quality", async function () {
        // Register a product
        await contract.connect(supplier).registerProduct();
        // Assign role for manufacturer
        await contract.connect(owner).assignRole(1, manufacturer.address, 2); 
        // Transfer onwership to manufacturer
        await contract.connect(supplier).initiateTransfer(1, manufacturer.address);
        // Confirm transfer 
        await contract.connect(manufacturer).confirmTransfer(1);
        await expect(contract.connect(manufacturer).verifyMaterialQuality(1, "This is good!")).to.emit(contract, "ManufacturingLogged").withArgs(1, "Verified: This is good!");
    });

    it("should get correct current owner", async function () {
        await contract.connect(supplier).registerProduct();
        expect(await contract.getCurrentOwner(1)).to.equal(supplier.address);
    });

    it("should get correct product ownership history", async function () {
        await contract.connect(owner).assignRole(1, manufacturer.address, 2); 
        await contract.connect(owner).assignRole(1, retailer.address, 3); 
        await contract.connect(owner).assignRole(1, consumer.address, 4); 

        await contract.connect(supplier).registerProduct();
        await contract.connect(supplier).initiateTransfer(1, manufacturer.address);
        await contract.connect(manufacturer).confirmTransfer(1);

        await contract.connect(manufacturer).initiateTransfer(1, retailer.address);
        await contract.connect(retailer).confirmTransfer(1);

        await contract.connect(retailer).initiateTransfer(1, consumer.address);
        await contract.connect(consumer).confirmTransfer(1);

        const expectedOwners = [supplier.address,manufacturer.address,retailer.address,consumer.address];

        expect(await contract.getProductHistory(1)).to.deep.equal(expectedOwners);
    });
});
