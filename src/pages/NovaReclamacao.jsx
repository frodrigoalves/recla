import React, { useMemo, useState } from "react";
import { ClipboardList, FileText, ShieldCheck, ArrowLeft, ArrowRight, Upload, MapPin, Bus, Mail, Phone, CheckCircle2, AlertCircle } from "lucide-react";

// Página pública de reclamações  layout e UX equivalentes ao modelo fornecido
export default function NovaReclamacao() {
  // Opções (podem ser expandidas depois)
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

  const SENTIDOS = ["IDA", "VOLTA"];
  const TIPOS_ONIBUS = ["Convencional", "MOVE", "Suplementar"];
  const TIPOS_SERVICO = ["Troncal", "Alimentador", "Circular", "Seletivo"];

  // Estado
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [form, setForm] = useState({
    protocolo: makeProtocolo(),
    assunto: "",
    data_hora_ocorrencia: "",
    linha: "",
    numero_veiculo: "",
    local_ocorrencia: "",
    
    tipo_onibus: "",
    tipo_servico: "",
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
  const [errors, setErrors] = useState({});

  function makeProtocolo() {
    return `TOP-${Date.now()}`; // idêntico ao modelo em formato
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addAnexo(url) {
    if (!url) return;
    update("anexos", [...form.anexos, url.trim()]);
  }

  function removeAnexo(idx) {
    const copy = [...form.anexos];
    copy.splice(idx, 1);
    update("anexos", copy);
  }

  // Validação por etapa (espelha as regras do modelo)
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!form.assunto) e.assunto = "Selecione um assunto.";
      if (!form.data_hora_ocorrencia) e.data_hora_ocorrencia = "Informe data e hora.";
      if (!form.linha) e.linha = "Selecione a linha.";
      
      if (!form.local_ocorrencia) e.local_ocorrencia = "Informe o local.";
    }
    if (s === 2) {
      if (!form.tipo_onibus) e.tipo_onibus = "Selecione o tipo de ônibus.";
      if (!form.tipo_servico) e.tipo_servico = "Selecione o tipo de serviço.";
      if (!form.descricao || form.descricao.trim().length < 20)
        e.descricao = "Mínimo de 20 caracteres.";
    }
    if (s === 3) {
      if (form.quer_retorno) {
        if (!form.nome_completo) e.nome_completo = "Informe seu nome.";
        if (!form.email && !form.telefone)
          e.contato = "Informe e-mail ou telefone.";
      }
      if (!form.lgpd_aceite) e.lgpd_aceite = "É necessário aceitar a LGPD.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const progressPct = useMemo(() => (step >= 4 ? 100 : step * 33.34), [step]);

  async function handleNext() {
    if (validateStep(step)) setStep(step + 1);
  }
  function handlePrev() {
    setStep(step - 1);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    // calcula SLA (7 dias corridos) para manter o comportamento do modelo
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 7);

    setSending(true);
    setResultMsg("");

    try {
      const payload = { ...form, prazo_sla: prazo.toISOString() };

      // Apps Script (sem headers p/ evitar preflight CORS)
      await fetch(import.meta.env.VITE_APPSCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setResultMsg(" Reclamação registrada com sucesso!");
      const nextProtocolo = makeProtocolo();
      setForm({
        protocolo: nextProtocolo,
        assunto: "",
        data_hora_ocorrencia: "",
        linha: "",
        numero_veiculo: "",
        local_ocorrencia: "",
        
        tipo_onibus: "",
        tipo_servico: "",
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
      setStep(4);
    } catch (err) {
      setResultMsg(" Erro ao enviar. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3 md:p-4">
      <div className="max-w-2xl mx-auto py-4 md:py-8">
        {/* Cabeçalho idêntico em tipografia e espaçamento */}
        <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800 px-2">
            Formulário de Reclamação
          </h1>
          <p className="text-sm md:text-base text-slate-600 px-3">
            Registre sua reclamação sobre o transporte coletivo. Sua opinião é importante para melhorarmos nossos serviços.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mx-2 md:mx-0">
            <p className="text-green-700 text-xs md:text-sm">Preencha todas as etapas e guarde seu protocolo.</p>
          </div>
        </div>

        {/* Stepper + barra de progresso (visual compatível) */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="px-6 pt-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <StepChip active={step >= 1} icon={<ClipboardList className="w-4 h-4" />} label="Dados" />
              <StepChip active={step >= 2} icon={<FileText className="w-4 h-4" />} label="Descrição" />
              <StepChip active={step >= 3} icon={<ShieldCheck className="w-4 h-4" />} label="Contato & LGPD" />
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Form content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {step === 1 && <StepDados form={form} update={update} errors={errors} ASSUNTOS={ASSUNTOS} LINHAS={LINHAS} SENTIDOS={SENTIDOS} />}
            {step === 2 && <StepDescricao form={form} update={update} errors={errors} TIPOS_ONIBUS={TIPOS_ONIBUS} TIPOS_SERVICO={TIPOS_SERVICO} addAnexo={addAnexo} removeAnexo={removeAnexo} />}
            {step === 3 && <StepContato form={form} update={update} errors={errors} />}
            {step === 4 && <Success protocolo={form.protocolo} resultMsg={resultMsg} onNew={() => { setStep(1); setResultMsg(""); }} />}

            {step < 4 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={step === 1 || sending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    Avançar <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? "Enviando..." : "Enviar reclamação"} <Upload className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Aviso LGPD/Privacidade */}
        <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-[1px]" />
          Ao enviar, você concorda com o tratamento dos dados para fins de atendimento e melhoria do serviço.
        </p>
      </div>
    </div>
  );
}

/* ----------------- Subcomponentes ----------------- */
function StepChip({ active, icon, label }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-blue-700" : "text-gray-400"}`}>
      {icon}
      <span className="font-medium">{label}</span>
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

function StepDados({ form, update, errors, ASSUNTOS, LINHAS, SENTIDOS }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Protocolo">
        <input
          value={form.protocolo}
          disabled
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-gray-100 text-gray-700"
        />
      </Field>

      <Field label="Assunto" error={errors.assunto}>
        <select
          value={form.assunto}
          onChange={(e) => update("assunto", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {ASSUNTOS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Data e hora da ocorrência" error={errors.data_hora_ocorrencia}>
        <input
          type="datetime-local"
          value={form.data_hora_ocorrencia}
          onChange={(e) => update("data_hora_ocorrencia", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </Field>

      <Field label="Linha" error={errors.linha}>
        <select
          value={form.linha}
          onChange={(e) => update("linha", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
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

      <Field label="Local da ocorrência" error={errors.local_ocorrencia}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            placeholder="Rua/Estação/Ponto"
            value={form.local_ocorrencia}
            onChange={(e) => update("local_ocorrencia", e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </Field>

      <Field label="Sentido da viagem" error={errors.sentido_viagem}>
        <select
          value={form.sentido_viagem}
          onChange={(e) => update("sentido_viagem", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {SENTIDOS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}

function StepDescricao({ form, update, errors, TIPOS_ONIBUS, TIPOS_SERVICO, addAnexo, removeAnexo }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Tipo de ônibus" error={errors.tipo_onibus}>
        <select
          value={form.tipo_onibus}
          onChange={(e) => update("tipo_onibus", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {TIPOS_ONIBUS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Tipo de serviço" error={errors.tipo_servico}>
        <select
          value={form.tipo_servico}
          onChange={(e) => update("tipo_servico", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Selecione...</option>
          {TIPOS_SERVICO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>

      <div className="md:col-span-2">
        <Field label="Descrição detalhada" error={errors.descricao} hint="Mínimo 20 caracteres. Evite dados pessoais.">
          <textarea
            value={form.descricao}
            onChange={(e) => update("descricao", e.target.value.slice(0, 1000))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 h-36 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            placeholder="Descreva o que aconteceu com clareza..."
            maxLength={1000}
          />
          <div className="flex justify-end text-xs text-gray-500 mt-1">{form.descricao.length}/1000</div>
        </Field>
      </div>

      <div className="md:col-span-2">
        <Field label="Anexos (URLs públicas de imagens/vídeos/documentos)">
          <Anexos anexos={form.anexos} onAdd={addAnexo} onRemove={removeAnexo} />
          <p className="text-xs text-gray-500 mt-1">Dica: suba no Google Drive/Imgur e cole o link compartilhável.</p>
        </Field>
      </div>
    </section>
  );
}

function StepContato({ form, update, errors }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Nome completo" error={errors.nome_completo}>
        <input
          value={form.nome_completo}
          onChange={(e) => update("nome_completo", e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          placeholder="Seu nome"
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

      <Field label="Telefone">
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

      <div className="md:col-span-2">
        <label className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50">
          <input
            type="checkbox"
            checked={form.quer_retorno}
            onChange={(e) => update("quer_retorno", e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">Desejo ser contatado(a) sobre esta reclamação.</span>
        </label>
      </div>

      <div className="md:col-span-2">
        <label className={`flex items-start gap-3 p-4 rounded-lg border ${errors.lgpd_aceite ? "border-red-300 bg-red-50" : "bg-gray-50"}`}>
          <input
            type="checkbox"
            checked={form.lgpd_aceite}
            onChange={(e) => update("lgpd_aceite", e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-700">
            Li e concordo com o tratamento dos meus dados pessoais nos termos da LGPD para fins de registro e resposta desta reclamação.
          </span>
        </label>
        {errors.lgpd_aceite && <p className="mt-1 text-xs text-red-600">{errors.lgpd_aceite}</p>}
      </div>
    </section>
  );
}

function Success({ protocolo, resultMsg, onNew }) {
  return (
    <section className="flex flex-col items-center text-center py-10">
      <CheckCircle2 className="w-14 h-14 text-green-600" />
      <h2 className="text-2xl font-bold mt-4">Reclamação enviada!</h2>
      <p className="text-gray-600 mt-2">Guarde seu protocolo para acompanhamento:</p>
      <div className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded font-mono">{protocolo}</div>
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

function Anexos({ anexos, onAdd, onRemove }) {
  const [url, setUrl] = useState("");
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole a URL pública do anexo"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <button
          type="button"
          onClick={() => {
            onAdd(url);
            setUrl("");
          }}
          className="rounded-lg px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Adicionar
        </button>
      </div>
      {anexos?.length > 0 && (
        <ul className="mt-3 space-y-2">
          {anexos.map((u, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
              <a
                href={u}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline truncate max-w-[75%]"
              >
                {u}
              </a>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-sm text-red-600 hover:underline"
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
