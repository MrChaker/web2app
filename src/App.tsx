import "./App.css";
import { Route, Routes } from "react-router-dom";
import AppBar from "./components/app-bar";

function App() {
  return (
    <Routes>
      <Route path="/app-bar" element={<AppBar />} />
      {/* <Route path="/license-form" element={<About />} /> */}
    </Routes>
  );
}

export default App;
