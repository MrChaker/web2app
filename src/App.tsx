import "./App.css";
import { Route, Routes } from "react-router-dom";
import AppBar from "./components/app-bar";
import Downloads from "./components/downloads";

function App() {
  return (
    <Routes>
      <Route path="/app-bar" element={<AppBar />} />
      <Route path="/downloads" element={<Downloads />} />
      {/* <Route path="/license-form" element={<About />} /> */}
    </Routes>
  );
}

export default App;
