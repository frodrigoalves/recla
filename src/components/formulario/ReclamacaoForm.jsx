import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import DadosBasicos from "./DadosBasicos";
import DadosComplementares from "./DadosComplementares";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const GOOGLE_ALLOWED_ORIGINS = ["script.google.com", "googleusercontent.com"];

const INITIAL_STATE = {
  assunto: "",
  data_hora_ocorrencia: "",
  linha: "",
  numero_veiculo: "",
  local_ocorrencia: "",
  tipo_onibus: "",
  descricao: "",
  nome_completo: "",
  email: "",
  telefone: "",
  lgpd_aceite: false,
  quer_retorno: false,
};

export default function ReclamacaoForm() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [ip, setIp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.ip) {
          setIp(data.ip);
        }
      })
      .catch(() => {
        if (!cancelled) setIp("");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = (event) => {
      const origin = event.origin || "";
      if (
        origin &&
        !GOOGLE_ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))
      ) {
        return;
      }

      let data = event.data;
      if (!data) return;

      if (typeof data === "string") {
        const trimmed = data.trim();
        if (!trimmed) return;
        try {
          data = JSON.parse(trimmed);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object" || !Object.prototype.hasOwnProperty.call(data, "ok")) {
        return;
      }

      setIsSubmitting(false);

      if (data.ok) {
        const protocolo = data.protocolo ? `Reclamação registrada. Protocolo: ${data.protocolo}` : "Reclamação registrada.";
        setFeedback({ type: "success", message: protocolo });
        setErrors({});
        setFormData(INITIAL_STATE);
        if (formRef.current) {
          formRef.current.reset();
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorMessage = data.error ? `Erro ao registrar reclamação: ${data.error}` : "Não foi possível registrar a reclamação.";
        setFeedback({ type: "error", message: errorMessage });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validationMessages = useMemo(
    () => ({
      assunto: "Selecione um assunto.",
      data_hora_ocorrencia: "Informe data e hora da ocorrência.",
      linha: "Informe o número da linha.",
      numero_veiculo: "Informe o número do veículo.",
      local_ocorrencia: "Informe o local da ocorrência.",
      tipo_onibus: "Selecione o tipo de ônibus.",
      descricao: "Descreva a ocorrência com pelo menos 20 caracteres.",
      nome_completo: "Informe seu nome completo.",
      contato: "Informe e-mail ou telefone para contato.",
      lgpd_aceite: "É necessário aceitar o tratamento dos dados (LGPD).",
      arquivos: "Cada arquivo deve ter no máximo 15MB.",
    }),
    []
  );

  const handleSubmit = (event) => {
    const currentForm = formRef.current;
    const nextErrors = {};

    if (!formData.assunto) nextErrors.assunto = validationMessages.assunto;
    if (!formData.data_hora_ocorrencia) nextErrors.data_hora_ocorrencia = validationMessages.data_hora_ocorrencia;
    if (!formData.linha) nextErrors.linha = validationMessages.linha;
    if (!formData.numero_veiculo) nextErrors.numero_veiculo = validationMessages.numero_veiculo;
    if (!formData.local_ocorrencia) nextErrors.local_ocorrencia = validationMessages.local_ocorrencia;
    if (!formData.tipo_onibus) nextErrors.tipo_onibus = validationMessages.tipo_onibus;

    const descricaoValida = formData.descricao && formData.descricao.trim().length >= 20;
    if (!descricaoValida) nextErrors.descricao = validationMessages.descricao;

    if (!formData.nome_completo.trim()) nextErrors.nome_completo = validationMessages.nome_completo;
    if (!formData.lgpd_aceite) nextErrors.lgpd_aceite = validationMessages.lgpd_aceite;
    if (!formData.email.trim() && !formData.telefone.trim()) nextErrors.contato = validationMessages.contato;

    const files = currentForm?.elements?.file1?.files;
    if (files && files.length) {
      const oversize = Array.from(files).some((file) => file.size > MAX_FILE_SIZE);
      if (oversize) {
        nextErrors.arquivos = validationMessages.arquivos;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      setFeedback({ type: "error", message: "Revise os campos destacados antes de enviar." });
      return;
    }

    setFeedback(null);
    setIsSubmitting(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl bg-white/70 p-4 shadow-md backdrop-blur">
      <form
        ref={formRef}
        method="POST"
        encType="multipart/form-data"
        target="appsFrame"
        action={import.meta.env.VITE_APPSCRIPT_URL}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <input type="hidden" name="iframe" value="true" />
        <input type="hidden" name="ip" value={ip} />

        <DadosBasicos formData={formData} errors={errors} onChange={updateField} />
        <DadosComplementares formData={formData} errors={errors} onChange={updateField} />

        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-3 text-slate-800 font-semibold text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold">
                3
              </span>
              Descrição e Contato
            </h2>
          </header>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                Descrição detalhada <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                name="descricao"
                required
                minLength={20}
                value={formData.descricao}
                onChange={(event) => updateField("descricao", event.target.value)}
                className={`min-h-[160px] w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.descricao ? "border-red-400" : "border-slate-200"
                }`}
              />
              {errors.descricao ? (
                <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {errors.descricao}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Descreva o ocorrido com o máximo de detalhes. Mínimo de 20 caracteres.</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="nome_completo" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome_completo"
                  name="nome_completo"
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={(event) => updateField("nome_completo", event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.nome_completo ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.nome_completo ? (
                  <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nome_completo}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.contato ? "border-red-400" : "border-slate-200"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-semibold text-slate-700">
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(event) => updateField("telefone", event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                    errors.contato ? "border-red-400" : "border-slate-200"
                  }`}
                />
                {errors.contato ? (
                  <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.contato}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Informe e-mail ou telefone para retorno.</p>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Preferências</span>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="quer_retorno"
                    value="on"
                    checked={formData.quer_retorno}
                    onChange={(event) => updateField("quer_retorno", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  Desejo receber retorno sobre minha reclamação
                </label>
                <label className={`flex items-center gap-2 text-sm ${errors.lgpd_aceite ? "text-red-600" : "text-slate-700"}`}>
                  <input
                    type="checkbox"
                    name="lgpd_aceite"
                    value="on"
                    required
                    checked={formData.lgpd_aceite}
                    onChange={(event) => updateField("lgpd_aceite", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  Concordo com o tratamento dos dados fornecidos (LGPD)
                </label>
                {errors.lgpd_aceite ? (
                  <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.lgpd_aceite}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="file1" className="text-sm font-semibold text-slate-700">
                Anexos (até 15MB cada)
              </label>
              <input
                ref={fileInputRef}
                id="file1"
                name="file1"
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                multiple
                className={`block w-full cursor-pointer rounded-lg border border-dashed px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 ${
                  errors.arquivos ? "border-red-400 bg-red-50/40" : "border-slate-300"
                }`}
              />
              {errors.arquivos ? (
                <p className="flex items-center gap-1 text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {errors.arquivos}
                </p>
              ) : (
                <p className="text-xs text-slate-500">Formatos aceitos: imagens, vídeos, áudios, PDF, DOC e DOCX.</p>
              )}
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : "Enviar reclamação"}
          <Upload className="h-4 w-4" />
        </button>
      </form>

      {feedback ? (
        <div
          className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-md ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
          role="status"
          aria-live="polite"
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5" />
          )}
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {isSubmitting ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700" role="status" aria-live="assertive">
          Estamos enviando sua reclamação com segurança. Aguarde a confirmação do protocolo.
        </div>
      ) : null}

      <iframe name="appsFrame" style={{ display: "none" }} title="Resposta do Apps Script" />
    </div>
  );
}
