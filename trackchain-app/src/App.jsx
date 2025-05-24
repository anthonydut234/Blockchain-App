import { useEffect, useState } from "react";
import Web3 from "web3";
import abi from "./abi.json";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
  const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:7545"); // Connect to Ganache

  useEffect(() => {
    const contractAddress = "0xE3F0A59d9F70F15a98fc55d321dd3E840BeFc38f"; // Replace with current contract address
    const contract = new web3.eth.Contract(abi, contractAddress); // Replace contents of abi.json with current contract's ABI

    const fetchEvents = async () => {
      try {
        const logs = await contract.getPastEvents("MaterialLogged", {
          fromBlock: 0,
          toBlock: "latest",
        });
        setEvents(logs);
        console.log("Events fetched:", logs);
      } catch (err) {
        console.error("Failed to fetch events:", err);
      }
    };

    fetchEvents();
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
          {events.map((event, index) => (
            <div key={index} className="hover:opacity-75 transition-all">
              <h3>
                Product ID: <b>{event.returnValues.productId}</b>, Material:{" "}
                <b>{event.returnValues.name}</b>, Origin:{" "}
                <b>{event.returnValues.origin}</b>
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
