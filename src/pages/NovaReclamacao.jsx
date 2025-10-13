import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./NovaReclamacao.css";
import topbusIcon from "../assets/topbus-icon.svg";

const API_URL =
  import.meta.env.VITE_RECLAMACAO_ENDPOINT ||
  "/.netlify/functions/submit-complaint";
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const ASSUNTOS = [
  "ACESSIBILIDADE",
  "ATRASO NA CHEGADA DO ÔNIBUS",
  "COMPORTAMENTO INADEQUADO DO MOTORISTA",
  "CONDIÇÕES DO VEÍCULO",
  "EXCESSO DE PASSAGEIROS",
  "FALTA DE ÔNIBUS",
  "ITINERÁRIO / PERCURSO",
  "LIMPEZA DO VEÍCULO",
  "OUTROS",
];

const TIPOS_ONIBUS = ["Padron", "Convencional", "Articulado"];

const LINHAS = [
  "85 - EST. S. GABRIEL/CENTRO - VIA FLORESTA",
  "262 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA",
  "812 - ESTAÇÃO SÃO GABRIEL",
  "815 - ESTAÇÃO SÃO GABRIEL/COML PAULO VI",
  "822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA",
  "5201 - DONA CLARA/JURITIS",
  "5401 - SÃO LUIZ/DOM CABIAL",
  "9105 - NOVA VISTA/SDN",
  "9204 - SANTA EFIGÊNIA/ESTORIL",
  "9208 - TACUARIL/CONJ. SANTA MARIA",
  "9211 - CAETANO FURQUIM/ATIAIANA",
  "9214 - CAETANO FURQUIM/ATIAIANA - VIA ALTO HAVAÍ",
  "9250 - CAETANO FURQUIM/ATIAIANA/ENTRA",
];

const formatDateTime = (date = new Date()) => {
  const current = new Date(date);
  current.setMinutes(current.getMinutes() - current.getTimezoneOffset());
  return current.toISOString().slice(0, 16);
};

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.split(",")[1];
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
          content: base64,
        });
      } else {
        reject(new Error("Não foi possível ler o arquivo."));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Erro ao ler o arquivo ${file.name}.`));
    };
    reader.readAsDataURL(file);
  });

const createInitialFormState = () => ({
  assunto: "",
  tipo_onibus: "",
  data_hora_ocorrencia: formatDateTime(),
  linha: "",
  numero_veiculo: "",
  local: "",
  descricao: "",
  nome: "",
  email: "",
  telefone: "",
});

export default function NovaReclamacao() {
  const [formData, setFormData] = useState(createInitialFormState);
  const [files, setFiles] = useState([]);
  const [contactEnabled, setContactEnabled] = useState(false);
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState({ visible: false, protocolo: "", message: "" });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const existing = document.querySelector('link[data-topbus-fa="true"]');
    if (existing) {
      return undefined;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    link.crossOrigin = "anonymous";
    link.referrerPolicy = "no-referrer";
    link.dataset.topbusFa = "true";
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  const handleInputChange = useCallback((field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneChange = useCallback((event) => {
    const formatted = formatPhone(event.target.value);
    setFormData((prev) => ({ ...prev, telefone: formatted }));
  }, []);

  const handleToggleContact = useCallback((event) => {
    const enabled = event.target.checked;
    setContactEnabled(enabled);
    setLgpdAccepted(false);
    setFormData((prev) => ({
      ...prev,
      nome: enabled ? prev.nome : "",
      email: enabled ? prev.email : "",
      telefone: enabled ? prev.telefone : "",
    }));
  }, []);

  const handleFileSelection = useCallback(
    async (event) => {
      const selected = Array.from(event.target.files || []);
      if (!selected.length) {
        return;
      }

      const validFiles = [];
      for (const file of selected) {
        if (file.size > MAX_FILE_SIZE) {
          alert(`O arquivo ${file.name} excede o limite de 15MB.`);
          continue;
        }
        validFiles.push(file);
      }

      try {
        const filePayloads = await Promise.all(validFiles.map(readFileAsBase64));
        setFiles((prev) => [...prev, ...filePayloads]);
      } catch (fileError) {
        alert(fileError.message);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    []
  );

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialFormState());
    setFiles([]);
    setContactEnabled(false);
    setLgpdAccepted(false);
    setSubmitting(false);
    setError("");
    setSuccess({ visible: false, protocolo: "", message: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (contactEnabled && !lgpdAccepted) {
        alert("Para fornecer seus dados de contato, é necessário aceitar os termos de proteção de dados.");
        return;
      }

      setSubmitting(true);
      setError("");

      const sanitizedPhone = formData.telefone.replace(/\D/g, "");
      const anexosPayload = files.map(({ name, type, base64 }) => ({
        name,
        type,
        base64,
      }));

      const dados = {
        assunto: formData.assunto,
        subject: formData.assunto,
        data_hora_ocorrencia: formData.data_hora_ocorrencia,
        occurrence_date: formData.data_hora_ocorrencia,
        linha: formData.linha,
        line: formData.linha,
        rota: formData.linha,
        numero_veiculo: formData.numero_veiculo,
        vehicle_number: formData.numero_veiculo,
        veiculo: formData.numero_veiculo,
        local: formData.local,
        local_ocorrencia: formData.local,
        location: formData.local,
        tipo_onibus: formData.tipo_onibus,
        bus_type: formData.tipo_onibus,
        tipo: formData.tipo_onibus,
        descricao: formData.descricao,
        description: formData.descricao,
        mensagem: formData.descricao,
        telefone: sanitizedPhone,
        phone: sanitizedPhone,
        quer_retorno: contactEnabled ? "true" : "false",
        want_return: contactEnabled ? "true" : "false",
        lgpd_aceite: contactEnabled ? (lgpdAccepted ? "true" : "false") : "true",
        lgpd_accept: contactEnabled ? (lgpdAccepted ? "true" : "false") : "true",
      };

      if (contactEnabled) {
        dados.nome = formData.nome || "";
        dados.nome_completo = formData.nome || "";
        dados.email = formData.email || "";
      } else {
        dados.nome = "";
        dados.nome_completo = "";
        dados.email = "";
      }

      const payload = {
        dados,
        anexos: anexosPayload,
      };

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const contentType = response.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const body = isJson ? await response.json() : await response.text();

        if (!response.ok) {
          const message =
            isJson && body && typeof body === "object"
              ? body.message || "Não foi possível enviar a reclamação. Tente novamente."
              : typeof body === "string" && body.trim()
                ? body
                : "Não foi possível enviar a reclamação. Tente novamente.";
          throw new Error(message);
        }

        const result =
          isJson && body && typeof body === "object"
            ? body
            : { success: true, message: typeof body === "string" ? body : "" };

        if (!result.success) {
          throw new Error(result.message || "Erro ao enviar reclamação.");
        }

        setSuccess({
          visible: true,
          protocolo: result.protocolo || "",
          message: result.message || "Reclamação registrada com sucesso!",
        });
      } catch (submitError) {
        setError(submitError.message);
      } finally {
        setSubmitting(false);
      }
    },
    [contactEnabled, files, formData, lgpdAccepted]
  );

  const protocoloDisplayClass = useMemo(
    () => `topbus-protocol-display${success.visible ? " active" : ""}`,
    [success.visible]
  );

  const contactFieldsClass = useMemo(
    () => `topbus-contact-fields${contactEnabled ? " active" : ""}`,
    [contactEnabled]
  );

  if (success.visible) {
    return (
      <div className="topbus-container">
        <div className="topbus-header">
          <div className="topbus-logo">
            <img
              src={topbusIcon}
              alt="Logomarca TopBus"
              className="topbus-logo-icon"
            />
            <div className="topbus-logo-text">
              <h1>TOPBUS</h1>
              <p>TRANSPORTES S/A</p>
            </div>
          </div>
          <p>Formulário de Registro de Reclamações</p>
        </div>
        <div className="topbus-form-container">
          <div className={protocoloDisplayClass}>
            <div className="topbus-success-icon">
              <i className="fas fa-check-circle" aria-hidden="true"></i>
            </div>
            <h2 style={{ color: "var(--success)" }}>Reclamação Registrada com Sucesso!</h2>
            <p>Sua reclamação foi recebida e será analisada pela nossa equipe.</p>
            <div className="topbus-protocol-number">{success.protocolo}</div>
            <p>Guarde este número para acompanhar o andamento</p>
            <button type="button" className="topbus-btn topbus-btn-submit" onClick={resetForm}>
              <i className="fas fa-plus" aria-hidden="true"></i>
              Nova Reclamação
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topbus-container">
      <div className="topbus-header">
        <div className="topbus-logo">
          <img
            src={topbusIcon}
            alt="Logomarca TopBus"
            className="topbus-logo-icon"
          />
          <div className="topbus-logo-text">
            <h1>TOPBUS</h1>
            <p>TRANSPORTES S/A</p>
          </div>
        </div>
        <p>Formulário de Registro de Reclamações</p>
      </div>

      <div className="topbus-form-container">
        <form onSubmit={handleSubmit}>
          <div className="topbus-form-section">
            <h2 className="topbus-section-title">
              <i className="fas fa-clipboard-list" aria-hidden="true"></i>
              Dados da Ocorrência
            </h2>

            <div className="topbus-form-grid">
              <div className="topbus-form-group">
                <label htmlFor="assunto" className="topbus-required">
                  Assunto
                </label>
                <select
                  id="assunto"
                  className="topbus-select"
                  value={formData.assunto}
                  onChange={handleInputChange("assunto")}
                  required
                >
                  <option value="">Selecione o assunto</option>
                  {ASSUNTOS.map((assunto) => (
                    <option key={assunto} value={assunto}>
                      {assunto}
                    </option>
                  ))}
                </select>
              </div>

              <div className="topbus-form-group">
                <label htmlFor="tipo_onibus" className="topbus-required">
                  Tipo de Ônibus
                </label>
                <select
                  id="tipo_onibus"
                  className="topbus-select"
                  value={formData.tipo_onibus}
                  onChange={handleInputChange("tipo_onibus")}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {TIPOS_ONIBUS.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="topbus-form-group">
                <label htmlFor="data_hora_ocorrencia" className="topbus-required">
                  Data e Hora da Ocorrência
                </label>
                <input
                  id="data_hora_ocorrencia"
                  type="datetime-local"
                  value={formData.data_hora_ocorrencia}
                  onChange={handleInputChange("data_hora_ocorrencia")}
                  required
                />
              </div>

              <div className="topbus-form-group">
                <label htmlFor="linha" className="topbus-required">
                  Linha do Ônibus
                </label>
                <select
                  id="linha"
                  className="topbus-select"
                  value={formData.linha}
                  onChange={handleInputChange("linha")}
                  required
                >
                  <option value="">Selecione a linha</option>
                  {LINHAS.map((linha) => (
                    <option key={linha} value={linha}>
                      {linha}
                    </option>
                  ))}
                </select>
              </div>

              <div className="topbus-form-group">
                <label htmlFor="numero_veiculo">Número do Veículo</label>
                <input
                  id="numero_veiculo"
                  placeholder="Número identificador do ônibus"
                  value={formData.numero_veiculo}
                  onChange={handleInputChange("numero_veiculo")}
                />
                <div className="topbus-info-text">Ex: 10570, 20499, 20575, etc.</div>
              </div>

              <div className="topbus-form-group topbus-full-width">
                <label htmlFor="local" className="topbus-required">
                  Local da Ocorrência
                </label>
                <input
                  id="local"
                  placeholder="Ex: Terminal Central, Av. Principal, etc."
                  value={formData.local}
                  onChange={handleInputChange("local")}
                  required
                />
              </div>
            </div>
          </div>

          <div className="topbus-form-section">
            <h2 className="topbus-section-title">
              <i className="fas fa-align-left" aria-hidden="true"></i>
              Detalhes da Reclamação
            </h2>

            <div className="topbus-form-group">
              <label htmlFor="descricao" className="topbus-required">
                Descrição Detalhada
              </label>
              <textarea
                id="descricao"
                placeholder="Descreva com detalhes o que aconteceu, incluindo horários, pessoas envolvidas, circunstâncias, etc."
                value={formData.descricao}
                onChange={handleInputChange("descricao")}
                required
              ></textarea>
            </div>

            <div className="topbus-form-group">
              <label>Anexos (Opcional)</label>
              <div
                role="button"
                tabIndex={0}
                className="topbus-file-upload"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <i className="fas fa-cloud-upload-alt" aria-hidden="true"></i>
                <p>Clique para adicionar fotos, vídeos ou documentos</p>
                <small>Formatos suportados: JPG, PNG, PDF, MP4, MP3 (Máx. 15MB cada)</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileSelection}
              />

              {files.length > 0 && (
                <div className="topbus-file-list">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="topbus-file-item">
                      <div className="topbus-file-info">
                        <i className="fas fa-file topbus-file-icon" aria-hidden="true"></i>
                        <span>{file.name}</span>
                      </div>
                      <button
                        type="button"
                        className="topbus-remove-file"
                        onClick={() => removeFile(index)}
                        aria-label={`Remover arquivo ${file.name}`}
                      >
                        <i className="fas fa-times" aria-hidden="true"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="topbus-form-section">
            <h2 className="topbus-section-title">
              <i className="fas fa-user" aria-hidden="true"></i>
              Dados de Contato (Opcional)
            </h2>

            <div className="topbus-contact-toggle">
              <label className="topbus-toggle-switch">
                <input
                  type="checkbox"
                  className="topbus-toggle-checkbox"
                  checked={contactEnabled}
                  onChange={handleToggleContact}
                />
                <span className="topbus-toggle-slider" aria-hidden="true"></span>
                <span>Desejo fornecer meus dados para possível retorno</span>
              </label>
            </div>

            <div className={contactFieldsClass}>
              <div className="topbus-form-grid">
                <div className="topbus-form-group">
                  <label htmlFor="nome">Nome Completo</label>
                  <input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={handleInputChange("nome")}
                    disabled={!contactEnabled}
                  />
                </div>
                <div className="topbus-form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange("email")}
                    disabled={!contactEnabled}
                  />
                </div>
                <div className="topbus-form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    disabled={!contactEnabled}
                  />
                </div>
              </div>

              <div className="topbus-lgpd-notice">
                <strong>Aviso sobre Proteção de Dados:</strong>
                <br />
                Ao fornecer seus dados, você concorda com o tratamento das informações para fins de atendimento e retorno sobre
                esta reclamação, de acordo com a Lei Geral de Proteção de Dados (LGPD).
              </div>

              <div className="topbus-checkbox-group">
                <input
                  id="lgpd_aceite"
                  type="checkbox"
                  checked={lgpdAccepted}
                  onChange={(event) => setLgpdAccepted(event.target.checked)}
                  disabled={!contactEnabled}
                />
                <label htmlFor="lgpd_aceite" className="topbus-required">
                  Declaro que li e concordo com os termos de proteção de dados
                </label>
              </div>
            </div>
          </div>

          <div className="topbus-form-buttons">
            <button type="submit" className="topbus-btn topbus-btn-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  Enviando...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" aria-hidden="true"></i>
                  Enviar Reclamação
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="topbus-error-message">
              <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
