import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrderPage from "./pages/OrderPage";
import OrderConfirmPage from "./pages/OrderConfirmPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order/:id" element={<OrderPage />} />
        <Route path="/" element={<OrderConfirmPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
