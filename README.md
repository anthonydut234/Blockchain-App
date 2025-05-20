# Blockchain-App
The proposed blockchain application for a decentralized logistics and supply chain tracking platform designed to enhance the transparency, traceability, and security of online product deliveries for e-commerce stakeholders. 

ProductContract
assign roles to accounts. At the top of Remix, open the ACCOUNT dropdown and choose the first account (this is the contract owner). Expand the assignRole(address, role) function. In the first input, paste the address of the Supplier account (use one of the other listed accounts), and in the second input, type 1 (the role enum value for Supplier). Click Transact. Repeat this process for other roles:

Manufacturer = 2

Retailer = 3

Consumer = 4

Switch to the Supplier account (one of the accounts you just assigned role 1). Call the registerProduct() function. This will register a new product and return a product ID — typically 1 for the first product.

While still using the Supplier account, call the logMaterialInput(uint, string, string) function. Input the product ID (e.g., 1), a material name (e.g., "Italian Leather"), and a material origin (e.g., "Italy"), then click Transact. This logs a material entry for the product.

Still on the Supplier account, scroll to initiateTransfer(uint, address). Copy the Manufacturer’s address (from another account you assigned role 2 to), and paste it into the second input. Use the same product ID (e.g., 1) and click Transact. This transfers product ownership from Supplier to Manufacturer.

Now switch to the Manufacturer account. Call confirmTransfer(uint) with the product ID (e.g., 1) to acknowledge receipt of the product. Click Transact.

Still as Manufacturer, call verifyMaterialQuality(uint, string) and input the product ID and a quality note like "Grade A leather inspected". This logs that the Manufacturer has verified the material quality.

Next, call logManufacturing(uint, string) and input the product ID and a production note such as "Hand-stitched luxury handbag". This records the manufacturing activity for this product.

Transfer the product to the Retailer by calling initiateTransfer(uint, address) again. Use the same product ID and paste the Retailer’s address (assigned role 3). Click Transact to hand off the product.

Switch to the Retailer account and call confirmTransfer(uint) using the same product ID to confirm receipt.

As the Retailer, now transfer the product to the final stakeholder — the Consumer. Use initiateTransfer(uint, address) with the product ID and the Consumer's address (assigned role 4). Click Transact.

Switch to the Consumer account, and call confirmTransfer(uint) with the product ID to confirm final delivery.

To view the full chain of ownership, call getProductHistory(uint) and input the product ID. This returns an array of all Ethereum addresses that previously owned the product, in order.

To view the logged material inputs, call getMaterials(uint). The third value in each entry is a Unix timestamp (e.g., 1747759647).
