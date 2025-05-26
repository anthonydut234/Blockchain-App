import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";

function OrderConfirmPage() {
  return (
    <div>
      <h1>Thank You for Ordering</h1>
      <h3>Your order has been confirmed</h3>
      <Link to="/order/2">
        <QRCodeSVG
          className="rounded-xl hover:scale-105 transition-all"
          // Value is hardcoded via productId 2 for demo purposes
          // QR code link doesn't work outside of local environment!!!
          value={"https://trackchain.com/order/2"}
          size={256}
        />
      </Link>
    </div>
  );
}

export default OrderConfirmPage;
