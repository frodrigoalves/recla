import React, { useState } from "react";

export default function ReclamacaoForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    const form = e.target;
    const data = {
      assunto: form.assunto.value,
      data_hora_ocorrencia: form.data_hora_ocorrencia.value,
      linha: form.linha.value,
      numero_veiculo: form.numero_veiculo.value,
      local_ocorrencia: form.local_ocorrencia.value,
      tipo_onibus: form.tipo_onibus.value,
      tipo_servico: form.tipo_servico.value,
      descricao: form.descricao.value,
      nome_completo: form.nome_completo.value,
      email: form.email.value,
      telefone: form.telefone.value,
      lgpd_aceite: form.lgpd_aceite.checked,
      quer_retorno: form.quer_retorno.checked,
    };

    try {
      const res = await fetch(import.meta.env.VITE_APPSCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (json.ok) {
        setSuccessMsg(
          ` Reclamação registrada com sucesso. Protocolo: ${json.protocolo}`
        );
        form.reset();
      } else {
        setErrorMsg(" Erro ao registrar: " + json.erro);
      }
    } catch (err) {
      setErrorMsg(" Falha de conexão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Registrar Reclamação</h2>

      <label className="block mb-2">Assunto:</label>
      <input type="text" name="assunto" required className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Data e Hora da Ocorrência:</label>
      <input type="datetime-local" name="data_hora_ocorrencia" required className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Linha:</label>
      <select name="linha" required size={6} className="w-full p-2 border rounded mb-4 overflow-y-scroll max-h-40">
        <option>85 - EST.S.GABRIEL/CENTRO</option>
        <option>1502 - MOVE 51</option>
        <option>9501 - MOVE 61</option>
        <option>941 - SANTA AMÉLIA</option>
        <option>9206 - SÃO GABRIEL</option>
      </select>

      <label className="block mb-2">Número do Veículo:</label>
      <input type="text" name="numero_veiculo" className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Local da Ocorrência:</label>
      <input type="text" name="local_ocorrencia" className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Tipo de Ônibus:</label>
      <select name="tipo_onibus" required className="w-full p-2 border rounded mb-4">
        <option>Convencional</option>
        <option>Articulado</option>
        <option>Executivo</option>
      </select>

      <label className="block mb-2">Tipo de Serviço:</label>
      <select name="tipo_servico" required className="w-full p-2 border rounded mb-4">
        <option>Troncal</option>
        <option>Alimentador</option>
      </select>

      <label className="block mb-2">Descrição:</label>
      <textarea name="descricao" required minLength={20} className="w-full p-2 border rounded mb-4"></textarea>

      <label className="block mb-2">Nome completo:</label>
      <input type="text" name="nome_completo" required className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">E-mail:</label>
      <input type="email" name="email" required className="w-full p-2 border rounded mb-4" />

      <label className="block mb-2">Telefone:</label>
      <input type="tel" name="telefone" className="w-full p-2 border rounded mb-4" />

      <label className="inline-flex items-center mb-4">
        <input type="checkbox" name="lgpd_aceite" required className="mr-2" />
        Aceito os termos da LGPD
      </label>

      <label className="inline-flex items-center mb-4 ml-4">
        <input type="checkbox" name="quer_retorno" className="mr-2" />
        Desejo receber retorno
      </label>

      <button type="submit" disabled={loading} className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        {loading ? "Enviando..." : "Enviar Reclamação"}
      </button>

      {successMsg && <p className="mt-4 p-2 bg-green-100 text-green-800 rounded">{successMsg}</p>}
      {errorMsg && <p className="mt-4 p-2 bg-red-100 text-red-800 rounded">{errorMsg}</p>}
    </form>
  );
}
