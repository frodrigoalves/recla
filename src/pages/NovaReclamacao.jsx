import React, { useMemo, useState } from "react";
import { MapPin, Bus, Mail, Phone, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import AnexosUpload from "../components/AnexosUpload";

const APPSCRIPT_ENDPOINT = (import.meta.env.VITE_APPSCRIPT_URL || "").trim();
const MISSING_GAS_MESSAGE = "MISSING_GAS_URL";
const makeProtocolo = () => `TOP-${Date.now()}`;

const createInitialForm = () => ({
  assunto: "",
  data_hora_ocorrencia: "",
  linha: "",
  numero_veiculo: "",
  local_ocorrencia: "",
  tipo_onibus: "",
  descricao: "",
  anexos: [],
  quer_retorno: false,
  nome_completo: "",
  email: "",
  telefone: "",
  lgpd_aceite: false,
  status: "Pendente",
  prazo_sla: "",
});

export default function NovaReclamacao() {
  const ASSUNTOS = useMemo(
    () => [
      "ACESSIBILIDADE",
      "AUSÊNCIA DE AGENTE DE BORDO",
      "COMPORTAMENTO INADEQUADO DO MOTORISTA",
      "CONDIÇÕES DO VEÍCULO",
      "EXCESSO DE PASSAGEIROS",
      "FALTA DE ÔNIBUS",
      "FALTA DE PARADA",
      "HORÁRIOS / ATRASOS",
      "ITINERÁRIO / ROTA",
      "LIMPEZA DO VEÍCULO",
      "OUTROS",
    ],
    []
  );

  const LINHAS = useMemo(
    () => [
      "85 - EST.S.GABRIEL/CENTRO - VIA FLORESTA",
      "812 - ESTAÇÃO SÃO GABRIEL",
      "815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI",
      "822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA",
      "5201 - DONA CLARA/BURITIS",
      "5401 - SÃO LUIZ/DOM CABRAL",
      "9105 - NOVA VISTA/SION",
      "9204 - SANTA EFIGÊNIA/ESTORIL",
      "9208 - TAQUARIL/CONJ. SANTA MARIA",
      "9211 - CAETANO FURQUIM/HAVAI",
      "9214 - CAETANO FURQUIM/HAVAI - VIA ALTO HAVAI",
      "9250 - CAETANO FURQUIM/NOVA CINTRA",
    ],
    []
  );

  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [submittedProtocolo, setSubmittedProtocolo] = useState(null);
  const [formKey, setFormKey] = useState(0);

  const missingGasEndpoint = !APPSCRIPT_ENDPOINT;

  const isFileObject = (item) => {
    if (!item) return false;
    if (typeof File !== "undefined" && item instanceof File) return true;
    return Object.prototype.toString.call(item) === "[object File]";
  };

  const isAllowedMediaFile = (file) => {
    if (!isFileObject(file)) return false;
    const type = (file?.type || "").toLowerCase();
    return (
      type.startsWith("image/") ||
      type.startsWith("audio/") ||
      type.startsWith("video/")
    );
  };

  const update = (field, value) => {
    if (field === "anexos") {
      const toArray = (input) => {
        if (!input) return [];
        if (typeof FileList !== "undefined" && input instanceof FileList) {
          return Array.from(input);
        }
        if (Array.isArray(input)) {
          return input;
        }
        return [];
      };

      const nextFiles = toArray(value).filter((file) => isAllowedMediaFile(file));
      setForm((prev) => ({ ...prev, anexos: nextFiles }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const e = {};
    if (!form.assunto) e.assunto = "Selecione um assunto.";
    if (!form.data_hora_ocorrencia) e.data_hora_ocorrencia = "Informe data e hora.";
    if (!form.linha) e.linha = "Selecione a linha.";
    if (!form.local_ocorrencia) e.local_ocorrencia = "Informe o local.";
    if (!form.descricao || form.descricao.trim().length < 20) {
      e.descricao = "Descreva a ocorrência com pelo menos 20 caracteres.";
    }
    if (form.quer_retorno) {
      if (!form.nome_completo) e.nome_completo = "Informe seu nome.";
      if (!form.email && !form.telefone) {
        e.contato = "Informe e-mail ou telefone para receber retorno.";
      }
    }
    if (!form.lgpd_aceite) e.lgpd_aceite = "É necessário aceitar a LGPD.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setForm(createInitialForm());
    setErrors({});
    setFormKey((prev) => prev + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 7);

    setSending(true);
    setResultMsg("");

    try {
      if (missingGasEndpoint) {
        setResultMsg(MISSING_GAS_MESSAGE);
        return;
      }

      const payload = {
        assunto: form.assunto,
        data_hora_ocorrencia: form.data_hora_ocorrencia,
        linha: form.linha,
        numero_veiculo: form.numero_veiculo,
        local_ocorrencia: form.local_ocorrencia,
        tipo_onibus: form.tipo_onibus,
        descricao: form.descricao,
        quer_retorno: form.quer_retorno,
        nome_completo: form.nome_completo,
        email: form.email,
        telefone: form.telefone,
        lgpd_aceite: form.lgpd_aceite,
        status: form.status,
        prazo_sla: prazo.toISOString(),
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, String(value));
        }
      });

      (form.anexos || []).forEach((file, index) => {
        if (file) {
          formData.append(`arquivo${index + 1}`, file);
        }
      });

      const response = await fetch(APPSCRIPT_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const protocolo =
        data?.protocolo ?? data?.Protocolo ?? data?.result?.protocolo ?? null;
      const protocoloFinal = protocolo || makeProtocolo();

      setSubmittedProtocolo(protocoloFinal);
      setResultMsg("Reclamação registrada com sucesso!");
      resetForm();
    } catch {
      setResultMsg("Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const showForm = !submittedProtocolo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3 md:p-4">
      <div className="max-w-2xl mx-auto py-4 md:py-8">
        <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800 px-2">
            Formulário de Reclamação
          </h1>
          <p className="text-sm md:text-base text-slate-600 px-3">
            Registre sua reclamação sobre o transporte coletivo. Sua opinião é importante para melhorarmos nossos serviços.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mx-2 md:mx-0">
            <p className="text-green-700 text-xs md:text-sm">
              Preencha todos os campos obrigatórios para gerar o protocolo ao final.
            </p>
          </div>
        </div>

        {missingGasEndpoint && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
            <p>
              Configure <code className="font-mono">VITE_APPSCRIPT_URL</code> com a URL <code className="font-mono">/exec</code> publicada do Apps Script.
            </p>
            <p className="font-semibold text-amber-900">Código: {MISSING_GAS_MESSAGE}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow mb-6">
          {showForm ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <section className="space-y-6">
                <h2 className="text-base font-semibold text-slate-800">Dados da ocorrência</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Assunto" error={errors.assunto}>
                    <select
                      value={form.assunto}
                      onChange={(event) => update("assunto", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Selecione...</option>
                      {ASSUNTOS.map((assunto) => (
                        <option key={assunto} value={assunto}>
                          {assunto}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Data e hora da ocorrência" error={errors.data_hora_ocorrencia}>
                    <input
                      type="datetime-local"
                      value={form.data_hora_ocorrencia}
                      onChange={(event) => update("data_hora_ocorrencia", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </Field>

                  <Field label="Linha" error={errors.linha}>
                    <select
                      value={form.linha}
                      onChange={(event) => update("linha", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Selecione...</option>
                      {LINHAS.map((linha) => (
                        <option key={linha} value={linha}>
                          {linha}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Número do veículo" hint="Opcional">
                    <div className="relative">
                      <Bus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        value={form.numero_veiculo}
                        onChange={(event) => update("numero_veiculo", event.target.value)}
                        placeholder="Ex.: 12345"
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </Field>

                  <Field label="Local da ocorrência" error={errors.local_ocorrencia}>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        value={form.local_ocorrencia}
                        onChange={(event) => update("local_ocorrencia", event.target.value)}
                        placeholder="Rua/Estação/Ponto"
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </Field>

                  <Field label="Tipo de ônibus" hint="Opcional">
                    <select
                      value={form.tipo_onibus}
                      onChange={(event) => update("tipo_onibus", event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Selecione...</option>
                      <option value="Padron">Padron</option>
                      <option value="Convencional">Convencional</option>
                      <option value="Articulado">Articulado</option>
                    </select>
                  </Field>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-base font-semibold text-slate-800">Descrição e anexos</h2>
                <Field label="Descrição detalhada" error={errors.descricao} hint="Mínimo de 20 caracteres. Evite dados pessoais.">
                  <textarea
                    value={form.descricao}
                    onChange={(event) => update("descricao", event.target.value.slice(0, 1000))}
                    maxLength={1000}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 h-36 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                    placeholder="Descreva o que aconteceu com clareza..."
                  />
                  <div className="flex justify-end text-xs text-gray-500 mt-1">
                    {form.descricao.length}/1000
                  </div>
                </Field>

                <Field
                  label="Anexos (até 15 MB por arquivo)"
                  hint="Envie fotos, áudios ou vídeos diretamente do seu dispositivo. Links públicos não são aceitos."
                >
                  <AnexosUpload key={formKey} data={form} onChange={update} />
                </Field>
              </section>

              <section className="space-y-6">
                <h2 className="text-base font-semibold text-slate-800">Contato (opcional)</h2>

                <label className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.quer_retorno}
                    onChange={(event) => update("quer_retorno", event.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    Desejo receber um retorno sobre esta reclamação.
                  </span>
                </label>

                {form.quer_retorno && (
                  <>
                    <p className="text-sm text-gray-700">
                      Se quiser acompanhar o andamento, preencha os dados abaixo para receber o status atualizado da sua reclamação.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Nome completo" error={errors.nome_completo}>
                        <input
                          value={form.nome_completo}
                          onChange={(event) => update("nome_completo", event.target.value)}
                          placeholder="Seu nome"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </Field>

                      <Field label="E-mail">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(event) => update("email", event.target.value)}
                            placeholder="seuemail@dominio.com"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </Field>

                      <Field label="Telefone" error={errors.contato && !form.email ? errors.contato : undefined}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            value={form.telefone}
                            onChange={(event) => update("telefone", event.target.value)}
                            placeholder="(31) 9 9999-9999"
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        </div>
                      </Field>
                    </div>
                  </>
                )}

                <div>
                  <label
                    className={`flex items-start gap-3 p-4 rounded-lg border ${errors.lgpd_aceite ? "border-red-300 bg-red-50" : "bg-gray-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={form.lgpd_aceite}
                      onChange={(event) => update("lgpd_aceite", event.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">
                      Li e concordo com o tratamento dos meus dados pessoais nos termos da LGPD.
                    </span>
                  </label>
                  {errors.lgpd_aceite && (
                    <p className="mt-1 text-xs text-red-600">{errors.lgpd_aceite}</p>
                  )}
                  {errors.contato && form.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.contato}</p>
                  )}
                </div>
              </section>

              {resultMsg && resultMsg !== "Reclamação registrada com sucesso!" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resultMsg}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending || missingGasEndpoint}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? "Enviando..." : "Enviar reclamação"}
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            <Success
              protocolo={submittedProtocolo}
              resultMsg={resultMsg}
              onNew={() => {
                setSubmittedProtocolo(null);
                setResultMsg("");
                resetForm();
              }}
            />
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-[1px]" />
          Ao enviar, você concorda com o tratamento dos dados para fins de atendimento e melhoria do serviço.
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div className="flex flex-col">
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Success({ protocolo, resultMsg, onNew }) {
  return (
    <section className="flex flex-col items-center text-center py-10">
      <CheckCircle2 className="w-14 h-14 text-green-600" />
      <h2 className="text-2xl font-bold mt-4">Reclamação enviada!</h2>
      <p className="text-gray-600 mt-2">
        Guarde seu protocolo para acompanhamento:
      </p>
      <div className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded font-mono">
        {protocolo}
      </div>
      {resultMsg && <p className="mt-4 text-gray-700">{resultMsg}</p>}
      <button
        onClick={onNew}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Registrar nova reclamação
      </button>
    </section>
  );
}
