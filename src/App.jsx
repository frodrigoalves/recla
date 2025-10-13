import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import NovaReclamacao from "./pages/NovaReclamacao";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/nova" replace />} />
        <Route path="/nova" element={<NovaReclamacao />} />
      </Routes>
    </BrowserRouter>
  );
}
