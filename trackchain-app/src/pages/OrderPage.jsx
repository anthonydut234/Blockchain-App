import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import abi from "../abi.json";

import { BookText } from "lucide-react";

function OrderPage() {
  const [loggedMaterials, setLoggedMaterials] = useState([]);
  const [materialQuality, setMaterialQuality] = useState([]);

  const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545"); // Connect to Ganache
  const { id } = useParams(); // Get the order ID from the URL parameters

  useEffect(() => {
    // Replace with current contract address
    const contractAddress = "0xC726D9af405E9A5799677f261DB96855B5ADCc33";
    // Replace contents of abi.json with current contract's ABI if changes were made
    const contract = new web3.eth.Contract(abi, contractAddress);
    const fetchMaterialsLogged = async () => {
      try {
        const logs = await contract.getPastEvents("MaterialLogged", {
          fromBlock: 0,
          toBlock: "latest",
        });
        // Gets all material logs by productId
        const filteredLogs = logs.filter(
          (log) => log.returnValues.productId.toString() === id.toString()
        );
        setLoggedMaterials(filteredLogs);
        console.log("Events fetched:", logs);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };

    const fetchMaterialQuality = async () => {
      try {
        const qualityLogs = await contract.getPastEvents(
          "ManufacturingLogged",
          {
            fromBlock: 0,
            toBlock: "latest",
          }
        );
        // Gets all material logs by productId
        const filteredLogs = qualityLogs.filter(
          (log) => log.returnValues.productId.toString() === id.toString()
        );
        setMaterialQuality(filteredLogs);
        console.log("Quality events fetched:", qualityLogs);
      } catch (err) {
        console.error("Failed to fetch quality events:", err);
      }
    };

    fetchMaterialsLogged();
    fetchMaterialQuality();
  }, []);

  return (
    <div className="m-20">
      <div className="mb-8">
        <h1 className="pb-1">Your Order: #{id}</h1>
        <h3>Transparent outlook of how your product is being made</h3>
      </div>

      <div>
        <div className="flex justify-between items-start gap-8 flex-wrap">
          {/* Supplier History */}
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 pb-4">
              <h1>Supplier History</h1>
              <BookText />
            </div>
            {loggedMaterials.map((loggedMaterials, index) => (
              <div
                key={index}
                className="hover:opacity-75 transition-all p-4 mb-4 border border-white rounded-lg text-wrap "
              >
                <h3>
                  Address: <b>{loggedMaterials.address}</b> <br />
                  Product ID: <b>{loggedMaterials.returnValues.productId}</b>,
                  Material: <b>{loggedMaterials.returnValues.name}</b>, Origin:{" "}
                  <b>{loggedMaterials.returnValues.origin}</b>
                </h3>
              </div>
            ))}
          </div>

          {/* Manufacturer History */}
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-2 pb-4">
              <h1>Manufacturer History</h1>
              <BookText />
            </div>
            {materialQuality.map((materialQuality, index) => (
              <div
                key={index}
                className="hover:opacity-75 transition-all p-4 mb-4 border border-white rounded-lg text-wrap break-words"
              >
                <h3>
                  Address: <b>{materialQuality.address}</b> <br />
                  Product ID: <b>{materialQuality.returnValues.productId}</b>
                  <br />
                  Note: <b>{materialQuality.returnValues.note}</b>
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderPage;
