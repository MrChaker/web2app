import "./App.css";
import { Route, Routes } from "react-router-dom";
import AppBar from "./components/app-bar";
import License from "./components/license";

function App() {
  return (
    <Routes>
      <Route path="/" element={<License />} />
      <Route path="/app-bar" element={<AppBar />} />
    </Routes>
  );
}

export default App;
