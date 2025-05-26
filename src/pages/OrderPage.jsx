import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Web3 from "web3";
import abi from "../abi.json";

function OrderPage() {
  const [loggedMaterials, setLoggedMaterials] = useState([]);
  const [materialQuality, setMaterialQuality] = useState([]);
  const { id } = useParams(); // Get the order ID
  const navigate = useNavigate();

  const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545");
  const contractAddress = "0xc178302504fD34dd97F1a8078B5Ef9B74479328A";
  const contract = new web3.eth.Contract(abi, contractAddress);

  useEffect(() => {
    async function fetchData() {
      try {
        const logs = await contract.getPastEvents("MaterialLogged", {
          fromBlock: 0,
          toBlock: "latest",
        });
        const filtered = logs.filter((log) => log.returnValues.productId.toString() === id);
        setLoggedMaterials(filtered);
      } catch (err) {
        console.error("Failed to fetch materials:", err);
      }

      try {
        const qualityLogs = await contract.getPastEvents("ManufacturingLogged", {
          fromBlock: 0,
          toBlock: "latest",
        });
        const filtered = qualityLogs.filter((log) => log.returnValues.productId.toString() === id);
        setMaterialQuality(filtered);
      } catch (err) {
        console.error("Failed to fetch quality:", err);
      }
    }

    fetchData();
  }, [id]);

  function handleConfirm() {
    // Simulate confirmation (replace with real confirm logic if needed)
    navigate(`/order-confirm/${id}`);
  }

  return (
    <div className="m-10">
      <div className="text-center m-5">
        <h1 className="pb-1">Trackchain</h1>
        <h2>A decentralized blockchain application</h2>
      </div>

      <div className="px-10">
        <h2 className="pb-2"> Products </h2>
        <div>
          {loggedMaterials.map((mat, index) => (
            <div key={index} className="hover:opacity-75 transition-all">
              <h3>
                Product ID: <b>{mat.returnValues.productId}</b>,
                Material: <b>{mat.returnValues.name}</b>,
                Origin: <b>{mat.returnValues.origin}</b>
              </h3>
            </div>
          ))}
        </div>
        <div>
          {materialQuality.map((quality, index) => (
            <div key={index} className="hover:opacity-75 transition-all">
              <h3>
                Product ID: <b>{quality.returnValues.productId}</b>,
                Note: <b>{quality.returnValues.note}</b>
              </h3>
            </div>
          ))}
        </div>
        <button
          className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleConfirm}
        >
          Confirm Order
        </button>
      </div>
    </div>
  );
}

export default OrderPage;
