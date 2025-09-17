import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import NovaReclamacao from "./pages/NovaReclamacao";
import PainelPublico from "./pages/PainelPublico";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/nova" />} />
          <Route path="/nova" element={<NovaReclamacao />} />
          <Route path="/painel" element={<PainelPublico />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
