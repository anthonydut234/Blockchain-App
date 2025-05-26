import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import abi from "../abi.json";
import { ethers } from "ethers";

function OrderConfirmPage() {
  const { productId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
  const contractAddress = "0xc178302504fD34dd97F1a8078B5Ef9B74479328A"; // Replace with your deployed address
  const contract = new ethers.Contract(contractAddress, abi, provider);

  useEffect(() => {
    async function fetchData() {
      try {
        const mat = await contract.getMaterials(productId);
        const hist = await contract.getProductHistory(productId);

        const product = await contract.products(productId);
        const statusLabels = [
          "Created",
          "Materials Logged",
          "Manufacturing Verified",
          "Manufactured",
          "In Transit",
          "Delivered",
          "Finalised"
        ];
        const readableStatus = statusLabels[product.status];

        setMaterials(mat);
        setHistory(hist);
        setStatus(readableStatus);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setStatus("❌ Failed to fetch product details");
        setLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  return (
    <div className="p-6 max-w-3xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-2">🎉 Thank You for Ordering!</h1>
      <p className="mb-4 text-lg">Your order has been confirmed for Product #{productId}.</p>

      <div className="my-6 flex flex-col md:flex-row items-center gap-6">
        <QRCodeSVG
          value={`http://localhost:5173/order/${productId}`}
          size={200}
          className="rounded-xl border-2"
        />
        <div>
          <p className="mb-2 text-sm">Scan this QR to view your order:</p>
          <Link
            to={`/order/${productId}`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            View Order Details
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-300">Loading order details...</p>
      ) : (
        <>
          <h3 className="text-xl font-semibold mt-6 mb-2"> Supply Chain History</h3>
          {history.length === 0 ? (
            <p>No history available.</p>
          ) : (
            <ul className="list-disc ml-6 text-sm">
              {history.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))}
            </ul>
          )}

          <h3 className="text-xl font-semibold mt-6 mb-2"> Materials</h3>
          {materials.length === 0 ? (
            <p>No materials recorded.</p>
          ) : (
            <ul className="list-disc ml-6 text-sm">
              {materials.map((m, i) => (
                <li key={i}>
                  <strong>{m.name}</strong> from <em>{m.origin}</em>
                </li>
              ))}
            </ul>
          )}

          <h3 className="text-xl font-semibold mt-6 mb-2">📌 Current Status</h3>
          <p className="text-sm text-green-400">{status}</p>
        </>
      )}
    </div>
  );
}

export default OrderConfirmPage;
