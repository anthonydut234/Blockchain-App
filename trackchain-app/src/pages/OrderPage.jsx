import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Web3 from "web3";
import abi from "../abi.json";

function OrderPage() {
  const [loggedMaterials, setLoggedMaterials] = useState([]);
  const [materialQuality, setMaterialQuality] = useState([]);

  const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545"); // Connect to Ganache
  const { id } = useParams(); // Get the order ID from the URL parameters

  useEffect(() => {
    // Replace with current contract address
    const contractAddress = "0xEc12032BFB83c0825AAD5841D8C887726f3AeeF2";
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
    <div className="m-10">
      <div className="text-center m-5">
        <h1 className="pb-1">Trackchain</h1>
        <h2>A decentralized blockchain application</h2>
      </div>

      <div className="px-10">
        <h2 className="pb-2"> Products </h2>
        <div>
          {loggedMaterials.map((loggedMaterials, index) => (
            <div key={index} className="hover:opacity-75 transition-all">
              <h3>
                Product ID: <b>{loggedMaterials.returnValues.productId}</b>,
                Material: <b>{loggedMaterials.returnValues.name}</b>, Origin:{" "}
                <b>{loggedMaterials.returnValues.origin}</b>
              </h3>
            </div>
          ))}
        </div>
        <div>
          {materialQuality.map((materialQuality, index) => (
            <div key={index} className="hover:opacity-75 transition-all">
              <h3>
                Product ID: <b>{materialQuality.returnValues.productId}</b>,
                Note: <b>{materialQuality.returnValues.note}</b>
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrderPage;
