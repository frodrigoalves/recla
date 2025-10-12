import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import NovaReclamacao from "./pages/NovaReclamacao";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/nova" />} />
          <Route path="/nova" element={<NovaReclamacao />} />
          {/* Dashboard removido para acesso público apenas ao formulário */}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
