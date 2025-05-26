const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SalesContract", function () {
    let productContract, salesContract;
    let owner, seller, buyer;

    beforeEach(async function () {
        [unknown, owner, seller, buyer] = await ethers.getSigners();
        const ProductContract = await ethers.getContractFactory("ProductContract");
        productContract = await ProductContract.connect(owner).deploy(owner.address);

        const SalesContract = await ethers.getContractFactory("SalesContract");
        salesContract = await SalesContract.connect(owner).deploy(await productContract.getAddress());
    });

    it("should allow seller to list a product for sale", async function () {
        await productContract.connect(seller).registerProduct();        
        await salesContract.connect(seller).listProductForSale(1, buyer.address);

        await expect(salesContract.connect(seller).listProductForSale(1, buyer.address))
            .to.emit(salesContract, "ProductListed")
            .withArgs(1, seller.address, buyer.address);

        const sale = await salesContract.getSaleDetails(1);
        expect(sale[0]).to.equal(seller.address);
        expect(sale[1]).to.equal(buyer.address);
        expect(sale[3]).to.equal(false);
    });

    it("should reject listing if caller is not the current product owner", async function () {
        await expect(salesContract.connect(unknown).listProductForSale(1, buyer.address))
            .to.be.revertedWith("Not current owner");
    });

    it("should allow buyer to confirm the sale", async function () {
        await productContract.connect(seller).registerProduct();        
        await salesContract.connect(seller).listProductForSale(1, buyer.address);

        await expect(salesContract.connect(buyer).confirmSale(1))
            .to.emit(salesContract, "SaleConfirmed")
            .withArgs(1, buyer.address);

        const sale = await salesContract.getSaleDetails(1);
        expect(sale[3]).to.equal(true);
    });

    it("should reject confirmation by someone other than buyer", async function () {
        await productContract.connect(seller).registerProduct();        
        await salesContract.connect(seller).listProductForSale(1, buyer.address);

        await expect(salesContract.connect(unknown).confirmSale(1))
            .to.be.revertedWith("Only designated buyer can confirm");
    });

    it("should track the number of sales for a product", async function () {
        await productContract.connect(seller).registerProduct();        
        await salesContract.connect(seller).listProductForSale(1, buyer.address);
        const count = await salesContract.getSalesCount(1);
        expect(count).to.equal(1);
    });
});
