import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  FileText,
  ShieldCheck,
  Upload,
  MapPin,
  Bus,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { enviarReclamacaoFormData } from "../api/reclamacao";

// Página pública de reclamações – experiência em página única
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

  const TIPOS_ONIBUS = useMemo(() => ["Convencional", "Padrão", "Articulado"], []);

  const MB15 = 15 * 1024 * 1024;
  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState(() => ({
    protocolo: makeProtocolo(),
    assunto: "",
    data_hora_ocorrencia: "",
    linha: "",
    numero_veiculo: "",
    local_ocorrencia: "",
    sentido_viagem: "",
    tipo_onibus: "",
    tipo_servico: "OCULTO_NO_FRONT",
    descricao: "",
    anexos: [],
    quer_retorno: false,
    nome_completo: "",
    email: "",
    telefone: "",
    lgpd_aceite: false,
    status: "Pendente",
    prazo_sla: "",
    ip: "IP_NAO_DETECTADO",
  }));
  const [errors, setErrors] = useState({});
  const [lastProtocolo, setLastProtocolo] = useState(form.protocolo);

  useEffect(() => {
    let active = true;

    fetch("https://api.ipify.org?format=json")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (active && data?.ip) {
          setForm((prev) => ({ ...prev, ip: data.ip }));
        }
      })
      .catch(() => {
        if (active) {
          setForm((prev) => ({ ...prev, ip: "IP_NAO_DETECTADO" }));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function makeProtocolo() {
    return `TOP-${Date.now()}`;
  }

  function update(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quer_retorno" && !value) {
        next.nome_completo = "";
        next.email = "";
        next.telefone = "";
      }
      return next;
    });
    setErrors((prev) => {
      if (!prev[field] && field !== "email" && field !== "telefone" && field !== "quer_retorno") {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      if (field === "email" || field === "telefone") {
        delete next.contato;
      }
      if (field === "quer_retorno" && !value) {
        delete next.nome_completo;
        delete next.contato;
      }
      return next;
    });
  }

  function addAnexo(url) {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      new URL(trimmed);
    } catch {
      setErrors((prev) => ({ ...prev, anexos: "Informe um link público válido." }));
      return false;
    }
    if (form.anexos.includes(trimmed)) {
      setErrors((prev) => ({ ...prev, anexos: "Este link já foi adicionado." }));
      return false;
    }
    update("anexos", [...form.anexos, trimmed]);
    clearAnexoError();
    return true;
  }

  function removeAnexo(idx) {
    const copy = [...form.anexos];
    copy.splice(idx, 1);
    update("anexos", copy);
    clearAnexoError();
  }

  function clearAnexoError() {
    setErrors((prev) => {
      if (!prev.anexos) return prev;
      const next = { ...prev };
      delete next.anexos;
      return next;
    });
  }

  function validateForm() {
    const e = {};
    if (!form.assunto) e.assunto = "Selecione um assunto.";
    if (!form.data_hora_ocorrencia) e.data_hora_ocorrencia = "Informe data e hora.";
    if (!form.linha) e.linha = "Selecione a linha.";
    if (!form.local_ocorrencia) e.local_ocorrencia = "Informe o local.";
    if (!form.tipo_onibus) e.tipo_onibus = "Selecione o tipo de veículo.";
    if (!form.descricao || form.descricao.trim().length < 20)
      e.descricao = "Descreva o ocorrido com no mínimo 20 caracteres.";
    if (form.quer_retorno) {
      if (!form.nome_completo) e.nome_completo = "Informe seu nome.";
      if (!form.email && !form.telefone) e.contato = "Informe e-mail ou telefone.";
    }
    if (!form.lgpd_aceite) e.lgpd_aceite = "É necessário aceitar a LGPD.";

    setErrors(e);

    if (Object.keys(e).length > 0) {
      setTimeout(() => {
        const firstError = document.querySelector("[data-field-error='true']");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }

    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResultMsg("");

    if (!validateForm()) {
      setShowSuccess(false);
      setResultMsg("Revise os campos destacados e tente novamente.");
      return;
    }

    const files = Array.from(fileInputRef.current?.files || []);
    const oversize = files.filter((file) => file.size > MB15);
    if (oversize.length > 0) {
      const nomes = oversize.map((file) => file.name).join(", ");
      setErrors((prev) => ({
        ...prev,
        anexos: `Os arquivos acima de 15 MB não podem ser enviados (${nomes}).`,
      }));
      setResultMsg("Um ou mais anexos ultrapassam o limite de 15 MB.");
      setShowSuccess(false);
      return;
    }

    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 7);

    setSending(true);
    setShowSuccess(false);

    try {
      const currentProtocolo = form.protocolo;
      const fd = new FormData();
      fd.append("protocolo", currentProtocolo);
      fd.append("assunto", form.assunto);
      fd.append("data_hora_ocorrencia", form.data_hora_ocorrencia);
      fd.append("linha", form.linha);
      fd.append("numero_veiculo", form.numero_veiculo);
      fd.append("local_ocorrencia", form.local_ocorrencia);
      fd.append("sentido_viagem", form.sentido_viagem || "");
      fd.append("tipo_onibus", form.tipo_onibus);
      fd.append("tipo_servico", form.tipo_servico);
      fd.append("descricao", form.descricao);
      fd.append("status", form.status);
      fd.append("prazo_sla", prazo.toISOString());
      fd.append("quer_retorno", form.quer_retorno ? "true" : "false");
      fd.append("nome_completo", form.nome_completo);
      fd.append("email", form.email);
      fd.append("telefone", form.telefone);
      fd.append("lgpd_aceite", form.lgpd_aceite ? "true" : "false");
      fd.append("ip", form.ip);

      files.forEach((file) => {
        fd.append("anexos", file);
      });
      if (form.anexos.length > 0) {
        fd.append("anexos", JSON.stringify(form.anexos));
      }

      const data = await enviarReclamacaoFormData(fd);

      if (!data?.ok) {
        if (data?.code === "FILE_TOO_LARGE") {
          setErrors((prev) => ({
            ...prev,
            anexos: "Algum arquivo ultrapassou o limite de 15 MB no servidor.",
          }));
          setResultMsg("Algum arquivo ultrapassou 15 MB e foi bloqueado.");
        } else {
          setResultMsg(data?.error || data?.code || "Não foi possível enviar agora.");
        }
        setShowSuccess(false);
        return;
      }

      const protocoloOficial =
        data?.protocolo ?? data?.Protocolo ?? data?.result?.protocolo ?? currentProtocolo;

      setLastProtocolo(protocoloOficial || currentProtocolo);
      setResultMsg("Reclamação registrada com sucesso!");
      setShowSuccess(true);
      setErrors({});

      const nextProtocolo = makeProtocolo();
      setForm({
        protocolo: nextProtocolo,
        assunto: "",
        data_hora_ocorrencia: "",
        linha: "",
        numero_veiculo: "",
        local_ocorrencia: "",
        sentido_viagem: "",
        tipo_onibus: "",
        tipo_servico: "OCULTO_NO_FRONT",
        descricao: "",
        anexos: [],
        quer_retorno: false,
        nome_completo: "",
        email: "",
        telefone: "",
        lgpd_aceite: false,
        status: "Pendente",
        prazo_sla: "",
        ip: form.ip,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setLinkDraft("");
    } catch {
      setResultMsg("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3 md:p-6">
      <div className="max-w-3xl mx-auto py-4 md:py-8">
        <header className="text-center mb-6 md:mb-10 space-y-3 md:space-y-4">
          <h1 className="text-lg md:text-3xl font-bold text-slate-800 px-2">
            Formulário de Reclamação
          </h1>
          <p className="text-sm md:text-lg text-slate-600 px-3">
            Registre sua reclamação sobre o transporte coletivo. Seus relatos nos ajudam a melhorar o serviço para toda a cidadania.
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {showSuccess ? (
            <Success
              protocolo={lastProtocolo}
              message={resultMsg}
              onNew={() => {
                setShowSuccess(false);
                setResultMsg("");
              }}
            />
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              {resultMsg && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {resultMsg}
                </div>
              )}

              <Section
                icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
                title="Dados da ocorrência"
                description="Nos ajude a localizar o fato informando quando e onde aconteceu."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Assunto" error={errors.assunto} dataFieldError={Boolean(errors.assunto)}>
                    <select
                      value={form.assunto}
                      onChange={(e) => update("assunto", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.assunto ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-600"
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {ASSUNTOS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Data e hora da ocorrência"
                    error={errors.data_hora_ocorrencia}
                    dataFieldError={Boolean(errors.data_hora_ocorrencia)}
                  >
                    <input
                      type="datetime-local"
                      value={form.data_hora_ocorrencia}
                      onChange={(e) => update("data_hora_ocorrencia", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.data_hora_ocorrencia
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-600"
                      }`}
                    />
                  </Field>

                  <Field label="Linha" error={errors.linha} dataFieldError={Boolean(errors.linha)}>
                    <select
                      value={form.linha}
                      onChange={(e) => update("linha", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.linha ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-600"
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {LINHAS.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Número do veículo">
                    <div className="relative">
                      <Bus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        placeholder="Ex.: 12345"
                        value={form.numero_veiculo}
                        onChange={(e) => update("numero_veiculo", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </Field>

                  <Field label="Local da ocorrência" error={errors.local_ocorrencia} dataFieldError={Boolean(errors.local_ocorrencia)}>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        placeholder="Rua, estação ou ponto"
                        value={form.local_ocorrencia}
                        onChange={(e) => update("local_ocorrencia", e.target.value)}
                        className={`w-full rounded-lg border pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                          errors.local_ocorrencia
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-600"
                        }`}
                      />
                    </div>
                  </Field>

                  <Field label="Tipo de ônibus" error={errors.tipo_onibus} dataFieldError={Boolean(errors.tipo_onibus)}>
                    <select
                      value={form.tipo_onibus}
                      onChange={(e) => update("tipo_onibus", e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                        errors.tipo_onibus
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-600"
                      }`}
                    >
                      <option value="">Selecione...</option>
                      {TIPOS_ONIBUS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>

                </div>
              </Section>

              <Section
                icon={<FileText className="w-5 h-5 text-blue-600" />}
                title="Descrição da ocorrência"
                description="Conte com detalhes o que aconteceu e, se possível, adicione links de evidências."
              >
                <div className="space-y-5">
                  <Field
                    label="Descrição detalhada"
                    hint="Mínimo de 20 caracteres. Evite inserir dados pessoais."
                    error={errors.descricao}
                    dataFieldError={Boolean(errors.descricao)}
                  >
                    <textarea
                      value={form.descricao}
                      onChange={(e) => update("descricao", e.target.value.slice(0, 1000))}
                      className={`w-full rounded-lg border px-3 py-3 h-40 bg-white text-gray-900 focus:outline-none focus:ring-2 resize-y ${
                        errors.descricao
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-600"
                      }`}
                      placeholder="Descreva o ocorrido com clareza..."
                      maxLength={1000}
                    />
                    <div className="flex justify-end text-xs text-gray-500 mt-1">{form.descricao.length}/1000</div>
                  </Field>

                  <Field
                    label="Anexos"
                    hint="Até 15 MB por arquivo. Você pode anexar arquivos de mídia ou indicar links públicos."
                    error={errors.anexos}
                    dataFieldError={Boolean(errors.anexos)}
                  >
                    <Anexos
                      fileInputRef={fileInputRef}
                      files={selectedFiles}
                      onFilesChange={setSelectedFiles}
                      linkDraft={linkDraft}
                      onLinkDraftChange={setLinkDraft}
                      anexos={form.anexos}
                      onAdd={addAnexo}
                      onRemove={removeAnexo}
                      onClearError={clearAnexoError}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
                title="Contato e privacidade"
                description="Informe seus dados de contato apenas se desejar receber um retorno."
              >
                <div className="space-y-5">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.quer_retorno}
                        onChange={(e) => update("quer_retorno", e.target.checked)}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        Desejo receber atualizações sobre o andamento da minha reclamação.
                      </span>
                    </label>
                    {errors.contato && (
                      <p className="mt-2 text-xs text-red-600" data-field-error="true">
                        {errors.contato}
                      </p>
                    )}
                  </div>

                  {form.quer_retorno && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Nome completo" error={errors.nome_completo} dataFieldError={Boolean(errors.nome_completo)}>
                        <input
                          value={form.nome_completo}
                          onChange={(e) => update("nome_completo", e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 ${
                            errors.nome_completo
                              ? "border-red-300 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-600"
                          }`}
                          placeholder="Como devemos te chamar"
                        />
                      </Field>

                      <Field label="E-mail" error={errors.email}>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="seuemail@dominio.com"
                          />
                        </div>
                      </Field>

                      <Field label="Telefone" error={!errors.email && errors.contato}>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            value={form.telefone}
                            onChange={(e) => update("telefone", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="(31) 9 9999-9999"
                          />
                        </div>
                      </Field>
                    </div>
                  )}

                  <div className="rounded-xl border p-4 bg-gray-50">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={form.lgpd_aceite}
                        onChange={(e) => update("lgpd_aceite", e.target.checked)}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">
                        Declaro que li e concordo com o tratamento dos meus dados pessoais conforme a LGPD para registro e resposta desta reclamação.
                      </span>
                    </label>
                    {errors.lgpd_aceite && (
                      <p className="mt-2 text-xs text-red-600" data-field-error="true">
                        {errors.lgpd_aceite}
                      </p>
                    )}
                  </div>
                </div>
              </Section>

              <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs text-blue-800">
                O número de protocolo será exibido após o envio bem-sucedido. Anote-o para eventuais acompanhamentos.
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-[2px]" />
                  Ao enviar, você concorda com o tratamento dos dados para fins de atendimento e melhoria do serviço de transporte.
                </p>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {sending ? "Enviando..." : "Enviar reclamação"}
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, description, children }) {
  return (
    <section className="space-y-5" data-field-error="false">
      <header className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-base md:text-lg font-semibold text-slate-800">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children, dataFieldError }) {
  return (
    <div className="flex flex-col" data-field-error={dataFieldError ? "true" : undefined}>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function Success({ protocolo, message, onNew }) {
  return (
    <section className="flex flex-col items-center text-center px-6 py-12 gap-4">
      <CheckCircle2 className="w-16 h-16 text-green-600" />
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reclamação enviada!</h2>
        <p className="text-gray-600 mt-2 max-w-md">
          Guarde o número abaixo para acompanhar o andamento junto aos canais oficiais. Você pode enviar uma nova reclamação quando quiser.
        </p>
      </div>
      <div className="px-5 py-3 bg-green-50 text-green-700 rounded font-mono text-lg border border-green-200">{protocolo}</div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
      <button
        onClick={onNew}
        className="mt-2 inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
      >
        Registrar nova reclamação
      </button>
    </section>
  );
}

function Anexos({
  fileInputRef,
  files,
  onFilesChange,
  linkDraft,
  onLinkDraftChange,
  anexos,
  onAdd,
  onRemove,
  onClearError,
}) {
  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target?.files || []);
    onFilesChange(nextFiles);
    onClearError?.();
  };

  const handleAddLink = () => {
    const success = onAdd(linkDraft);
    if (success) {
      onLinkDraftChange("");
    }
  };

  const formatFileSize = (size) => {
    if (!size && size !== 0) return "";
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          id="anexos"
          name="anexos"
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFileChange}
          className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        {files.length > 0 && (
          <ul className="space-y-1 text-sm text-gray-600">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-1.5"
              >
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={linkDraft}
          onChange={(e) => onLinkDraftChange(e.target.value)}
          placeholder="Cole um link público (opcional)"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="button"
          onClick={handleAddLink}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900/10 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-900/20"
        >
          Adicionar link
        </button>
      </div>

      {anexos?.length > 0 && (
        <ul className="space-y-2 text-sm">
          {anexos.map((u, i) => (
            <li
              key={u}
              className="flex items-center justify-between gap-3 rounded border border-blue-100 bg-blue-50/70 px-3 py-2"
            >
              <a href={u} target="_blank" rel="noreferrer" className="truncate text-blue-700 underline">
                {u}
              </a>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
