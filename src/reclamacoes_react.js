import React, { useState } from "react";
import DadosBasicos from "./DadosBasicos";
import DadosComplementares from "./DadosComplementares";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ReclamacaoForm() {
  const [formData, setFormData] = useState({
    assunto: "",
    data_hora_ocorrencia: "",
    linha: "",
    numero_veiculo: "",
    local_ocorrencia: "",
    descricao: "",
    nome_completo: "",
    email: "",
    telefone: "",
    lgpd_aceite: false,
    quer_retorno: false,
  });

  const [errors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(import.meta.env.VITE_APPSCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.ok) {
        setSuccessMsg(`Reclamação registrada com sucesso. Protocolo: ${json.protocolo}`);
      } else {
        setErrorMsg("Erro ao registrar: " + json.error);
      }
    } catch (err) {
      setErrorMsg("Falha de conexão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto p-4">
      <DadosBasicos formData={formData} setFormData={setFormData} errors={errors} />
      <DadosComplementares formData={formData} setFormData={setFormData} errors={errors} />

      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">3</span>
            </div>
            Descrição e Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-semibold text-slate-700">Descrição <span className="text-red-500">*</span></Label>
          <Textarea
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            required
            minLength={20}
            className="border-slate-200 focus:border-blue-500"
          />

          <p className="text-sm font-semibold">
            Deseja receber um retorno sobre o status da reclamação? OPCIONAL
          </p>

          <Label>Nome completo:</Label>
          <Input
            value={formData.nome_completo}
            onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
            className="border-slate-200 focus:border-blue-500"
          />

          <Label>E-mail:</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="border-slate-200 focus:border-blue-500"
          />

          <Label>Telefone:</Label>
          <Input
            type="tel"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
            className="border-slate-200 focus:border-blue-500"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.lgpd_aceite}
              onChange={(e) => setFormData(prev => ({ ...prev, lgpd_aceite: e.target.checked }))}
            />
            Aceito os termos da LGPD
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.quer_retorno}
              onChange={(e) => setFormData(prev => ({ ...prev, quer_retorno: e.target.checked }))}
            />
            Desejo receber retorno
          </label>
        </CardContent>
      </Card>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "Enviando..." : "Enviar Reclamação"}
      </button>

      {successMsg && <p className="p-2 bg-green-100 text-green-800 rounded">{successMsg}</p>}
      {errorMsg && <p className="p-2 bg-red-100 text-red-800 rounded">{errorMsg}</p>}
    </form>
  );
}
