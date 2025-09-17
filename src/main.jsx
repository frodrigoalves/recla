import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import NovaReclamacao from "./pages/NovaReclamacao.jsx";
import PainelPublico from "./pages/PainelPublico.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NovaReclamacao />} />
        <Route path="/nova" element={<NovaReclamacao />} />
        <Route path="/painel" element={<PainelPublico />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
