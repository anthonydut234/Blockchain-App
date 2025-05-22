import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center m-5">
      <h1 className="text-4xl pb-1"> Trackchain </h1>
      <h2 className="text-"> A decentralized blockchain application</h2>
    </div>
  );
}

export default App;
