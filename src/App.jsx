import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import OrderConfirmPage from "./pages/OrderConfirmPage";
import "./App.css";
import { Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/order/1" />} />
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/order-confirm/:productId" element={<OrderConfirmPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
