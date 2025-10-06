import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bus,
  CalendarClock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Music,
  Phone,
  ShieldCheck,
  Upload,
  User,
  Video,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectOption } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { appsScriptUrl } from "@/config/appsScript";
import { ASSUNTOS, LINHAS } from "@/features/reclamacao/constants";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const FALLBACK_TIPOS = ["Padron", "Convencional", "Articulado"];

const FALLBACK_VEHICLE_MAP = {
  "85 - EST.S.GABRIEL/CENTRO - VIA FLORESTA": ["8501", "8502", "8503"],
  "812 - ESTAÇÃO SÃO GABRIEL": ["8121", "8122", "8123"],
  "815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI": ["8151", "8152", "8153"],
  "822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA": ["8221", "8222", "8223", "1111"],
  "5201 - DONA CLARA/BURITIS": ["2020"],
  "5401 - SÃO LUIZ/DOM CABRAL": ["77777", "12345", "3030"],
  "9105 - NOVA VISTA/SION": ["20202", "2", "124444", "3333", "123456"],
  "9204 - SANTA EFIGÊNIA/ESTORIL": ["2020"],
  "9208 - TAQUARIL/CONJ. SANTA MARIA": ["123", "1", "1234569888"],
  "9211 - CAETANO FURQUIM/HAVAI": ["12345", "1234", "909090"],
  "9214 - CAETANO FURQUIM/HAVAI - VIA ALTO HAVAI": ["123456", "588"],
  "9250 - CAETANO FURQUIM/NOVA CINTRA": ["8878", "0", "666"],
};

const FALLBACK_LINHAS = LINHAS.map((linha) => ({
  value: linha,
  label: linha,
  vehicles: (FALLBACK_VEHICLE_MAP[linha] || []).map(String),
}));

const INITIAL_FORM = {
  assunto: "",
  data_hora_ocorrencia: "",
  linha: "",
  numero_veiculo: "",
  tipo_onibus: "",
  local_ocorrencia: "",
  descricao: "",
  nome_completo: "",
  email: "",
  telefone: "",
  lgpd_aceite: false,
  quer_retorno: false,
};

const APPS_URL = appsScriptUrl;

function extractVehiclesFromLine(line, fallbackMap = {}) {
  if (!line) return [];
  if (Array.isArray(line.vehicles)) {
    return line.vehicles.map(String);
  }
  if (Array.isArray(line.veiculos)) {
    return line.veiculos.map(String);
  }
  const possibleKeys = ["id", "codigo", "code", "value", "nome", "name", "label"];
  const identifier = possibleKeys.map((key) => line[key]).find((value) => typeof value === "string" && value.trim().length > 0);
  if (identifier && fallbackMap[identifier]) {
    return Array.isArray(fallbackMap[identifier]) ? fallbackMap[identifier].map(String) : [];
  }
  return [];
}

function mapLine(line, fallbackMap = {}) {
  if (!line) return null;
  if (typeof line === "string") {
    return { value: line, label: line, vehicles: [] };
  }

  const labelCandidate =
    line.nome ||
    line.name ||
    line.label ||
    line.descricao ||
    line.description ||
    line.value ||
    line.id ||
    line.codigo ||
    "";

  const valueCandidate =
    line.value ||
    line.id ||
    line.codigo ||
    line.nome ||
    line.name ||
    line.label ||
    labelCandidate;

  const label = typeof labelCandidate === "string" ? labelCandidate : String(labelCandidate ?? "");
  const value = typeof valueCandidate === "string" ? valueCandidate : String(valueCandidate ?? label);

  return {
    value,
    label: label || value,
    vehicles: extractVehiclesFromLine(line, fallbackMap),
  };
}

function buildVehicleDictionary(linhas, externalVehicles = {}) {
  return linhas.reduce((acc, linha) => {
    if (!linha?.value) return acc;
    if (Array.isArray(linha.vehicles) && linha.vehicles.length > 0) {
      acc[linha.value] = linha.vehicles.map(String);
      return acc;
    }
    if (Array.isArray(linha.veiculos) && linha.veiculos.length > 0) {
      acc[linha.value] = linha.veiculos.map(String);
      return acc;
    }

    const candidateKeys = [linha.value, linha.label];
    for (const key of candidateKeys) {
      if (!key) continue;
      const external = externalVehicles[key];
      if (Array.isArray(external) && external.length > 0) {
        acc[linha.value] = external.map(String);
        break;
      }
    }
    return acc;
  }, {});
}

export default function ReclamacaoForm() {
  const formRef = useRef(null);
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);
  const submissionTimeoutRef = useRef(null);
  const feedbackRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ip, setIp] = useState("");

  const [assuntos, setAssuntos] = useState(ASSUNTOS);
  const linhas = FALLBACK_LINHAS;
  const [tiposOnibus, setTiposOnibus] = useState(FALLBACK_TIPOS);
  const [vehiclesByLine, setVehiclesByLine] = useState(() => buildVehicleDictionary(FALLBACK_LINHAS));

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
    if (!APPS_URL) return undefined;

    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const response = await fetch(`${APPS_URL}?catalogo=1`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Catálogo indisponível (${response.status})`);
        }

        const data = await response.json();
        const externalVehicles = data?.veiculos && typeof data.veiculos === "object" ? data.veiculos : {};

        const assuntosPayload = Array.isArray(data?.assuntos) ? data.assuntos : [];
        if (assuntosPayload.length > 0) {
          setAssuntos(assuntosPayload.map(String));
        }

        const linhasPayload = Array.isArray(data?.linhas) ? data.linhas : [];
        if (linhasPayload.length > 0) {
          const mapped = linhasPayload
            .map((linha) => mapLine(linha, externalVehicles))
            .filter((linha) => linha && linha.value && linha.label);
          if (mapped.length > 0) {
            setVehiclesByLine((prev) => ({
              ...prev,
              ...buildVehicleDictionary(mapped, externalVehicles),
            }));
          }
        }

        const tiposPayload = Array.isArray(data?.tipos_onibus)
          ? data.tipos_onibus
          : Array.isArray(data?.tipos)
            ? data.tipos
            : Array.isArray(data?.tiposOnibus)
              ? data.tiposOnibus
              : [];

        if (tiposPayload.length > 0) {
          setTiposOnibus(tiposPayload.map(String));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Falha ao carregar catálogo", error);
      }
    }

    loadCatalog();

    return () => {
      controller.abort();
    };
  }, []);

  const availableVehicles = useMemo(() => {
    if (!formData.linha) return [];
    const vehicles = vehiclesByLine[formData.linha];
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      return vehicles.map(String);
    }
    return [];
  }, [formData.linha, vehiclesByLine]);

  useEffect(() => {
    if (!formData.linha) {
      setFormData((prev) => ({ ...prev, numero_veiculo: "" }));
    } else if (availableVehicles.length === 0) {
      setFormData((prev) => ({ ...prev, numero_veiculo: prev.numero_veiculo }));
    } else if (!availableVehicles.includes(formData.numero_veiculo)) {
      setFormData((prev) => ({ ...prev, numero_veiculo: "" }));
    }
  }, [formData.linha, formData.numero_veiculo, availableVehicles]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateBeforeSubmit = () => {
    const nextErrors = {};

    if (!formData.assunto) nextErrors.assunto = "Selecione o assunto.";
    if (!formData.data_hora_ocorrencia) nextErrors.data_hora_ocorrencia = "Informe data e hora.";
    if (!formData.linha) nextErrors.linha = "Selecione a linha.";
    if (!formData.numero_veiculo) nextErrors.numero_veiculo = "Selecione ou informe o veículo.";
    if (!formData.tipo_onibus) nextErrors.tipo_onibus = "Informe o tipo de ônibus.";
    if (!formData.local_ocorrencia.trim()) nextErrors.local_ocorrencia = "Informe o local da ocorrência.";

    const descricao = formData.descricao.trim();
    if (descricao.length < 20) {
      nextErrors.descricao = "Descreva com pelo menos 20 caracteres.";
    }

    const email = formData.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Informe um e-mail válido.";
    }

    if (!formData.lgpd_aceite) nextErrors.lgpd_aceite = "Você precisa aceitar o tratamento de dados.";

    const files = fileInputRef.current?.files;
    if (files && files.length) {
      const oversize = Array.from(files).some((file) => file.size > MAX_FILE_SIZE);
      if (oversize) {
        nextErrors.arquivos = "Cada arquivo deve ter no máximo 15MB.";
      }
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = (event) => {
    const validationErrors = validateBeforeSubmit();
    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
      setFeedback({ type: "error", message: "Revise os campos destacados antes de enviar." });
      return;
    }

    if (!APPS_URL) {
      event.preventDefault();
      setFeedback({ type: "error", message: "Serviço não configurado. Contate o suporte." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    if (submissionTimeoutRef.current) {
      window.clearTimeout(submissionTimeoutRef.current);
    }
    submissionTimeoutRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setFeedback((prev) =>
        prev || {
          type: "error",
          message: "Não recebemos confirmação do serviço. Verifique se a reclamação foi registrada antes de reenviar.",
        },
      );
      submissionTimeoutRef.current = null;
    }, 15000);
  };

  useEffect(() => {
    function handleIframeMessage(event) {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;

      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || typeof data !== "object" || !("ok" in data)) return;

      setIsSubmitting(false);
      if (submissionTimeoutRef.current) {
        window.clearTimeout(submissionTimeoutRef.current);
        submissionTimeoutRef.current = null;
      }

      if (data.ok) {
        const protocolo = (data.protocolo || data?.result?.protocolo || "").toString();
        setFeedback({
          type: "success",
          message: "Reclamação registrada com sucesso.",
          protocolo: protocolo.trim(),
        });
        setFormData(INITIAL_FORM);
        setErrors({});
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (formRef.current) {
          formRef.current.reset();
        }
      } else {
        const errorMessage = data.error || data.message || "Não foi possível enviar sua reclamação.";
        setFeedback({ type: "error", message: errorMessage });
      }
    }

    window.addEventListener("message", handleIframeMessage);
    return () => {
      window.removeEventListener("message", handleIframeMessage);
      if (submissionTimeoutRef.current) {
        window.clearTimeout(submissionTimeoutRef.current);
        submissionTimeoutRef.current = null;
      }
    };
  }, []);

  const linhaSelecionada = useMemo(
    () => linhas.find((linha) => linha.value === formData.linha),
    [formData.linha, linhas],
  );

  useEffect(() => {
    if (!feedback || !feedbackRef.current) return;
    const el = feedbackRef.current;
    window.requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [feedback]);

  return (
    <div className="space-y-6">
      {!APPS_URL ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="status">
          Serviço não configurado. Contate o suporte.
        </div>
      ) : null}

      <form
        ref={formRef}
        action={APPS_URL || undefined}
        method="POST"
        encType="multipart/form-data"
        target="appsFrame"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <input type="hidden" name="ip" value={ip} readOnly />
        <input type="hidden" name="iframe" value="true" />

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                1
              </span>
              Dados da reclamação
            </CardTitle>
            <CardDescription>
              Preencha os dados principais da ocorrência. Os campos marcados com * são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assunto">
                Assunto <span className="text-red-500">*</span>
              </Label>
              <Select
                id="assunto"
                name="assunto"
                aria-required="true"
                value={formData.assunto}
                onChange={handleFieldChange("assunto")}
                placeholder="Selecione o assunto"
              >
                <SelectOption value="">Selecione o assunto</SelectOption>
                {assuntos.map((assunto) => (
                  <SelectOption key={assunto} value={assunto}>
                    {assunto}
                  </SelectOption>
                ))}
              </Select>
              {errors.assunto ? (
                <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {errors.assunto}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_hora_ocorrencia" className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                  Data e hora da ocorrência <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="data_hora_ocorrencia"
                  name="data_hora_ocorrencia"
                  type="datetime-local"
                  aria-required="true"
                  value={formData.data_hora_ocorrencia}
                  onChange={handleFieldChange("data_hora_ocorrencia")}
                />
                {errors.data_hora_ocorrencia ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.data_hora_ocorrencia}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2" htmlFor="linha">
                  <Bus className="h-4 w-4 text-blue-500" />
                  Linha <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="linha"
                  name="linha"
                  aria-required="true"
                  value={formData.linha}
                  onChange={handleFieldChange("linha")}
                  placeholder="Selecione a linha"
                >
                  <SelectOption value="">Selecione a linha</SelectOption>
                  {linhas.map((linha) => (
                    <SelectOption key={linha.value} value={linha.value}>
                      {linha.label}
                    </SelectOption>
                  ))}
                </Select>
                {errors.linha ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.linha}
                  </p>
                ) : null}
                {linhaSelecionada ? (
                  <p className="text-xs text-slate-500">{linhaSelecionada.label}</p>
                ) : (
                  <p className="text-xs text-slate-500">Selecione a linha do ônibus envolvido.</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label className="flex items-center gap-2" htmlFor="numero_veiculo">
                  <Bus className="h-4 w-4 text-blue-500" />
                  Número do veículo <span className="text-red-500">*</span>
                </Label>
                {availableVehicles.length > 0 ? (
                  <Select
                    id="numero_veiculo"
                    name="numero_veiculo"
                    aria-required="true"
                    value={formData.numero_veiculo}
                    onChange={handleFieldChange("numero_veiculo")}
                    placeholder="Selecione o número do carro"
                    disabled={!formData.linha}
                  >
                    <SelectOption value="">Selecione o número do carro</SelectOption>
                    {availableVehicles.map((veiculo) => (
                      <SelectOption key={veiculo} value={veiculo}>
                        {veiculo}
                      </SelectOption>
                    ))}
                  </Select>
                ) : (
                  <Input
                    id="numero_veiculo"
                    name="numero_veiculo"
                    aria-required="true"
                    value={formData.numero_veiculo}
                    onChange={handleFieldChange("numero_veiculo")}
                    placeholder={formData.linha ? "Informe o número do veículo" : "Selecione a linha primeiro"}
                    disabled={!formData.linha}
                  />
                )}
                {errors.numero_veiculo ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.numero_veiculo}
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">Escolha um veículo disponível para a linha selecionada.</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2" htmlFor="tipo_onibus">
                  <Bus className="h-4 w-4 text-blue-500" />
                  Tipo de ônibus <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="tipo_onibus"
                  name="tipo_onibus"
                  aria-required="true"
                  value={formData.tipo_onibus}
                  onChange={handleFieldChange("tipo_onibus")}
                  placeholder="Selecione o tipo de ônibus"
                >
                  <SelectOption value="">Selecione o tipo de ônibus</SelectOption>
                  {tiposOnibus.map((tipo) => (
                    <SelectOption key={tipo} value={tipo}>
                      {tipo}
                    </SelectOption>
                  ))}
                </Select>
                {errors.tipo_onibus ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.tipo_onibus}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2" htmlFor="local_ocorrencia">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Local da ocorrência <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="local_ocorrencia"
                  name="local_ocorrencia"
                  aria-required="true"
                  placeholder="Rua, ponto ou região"
                  value={formData.local_ocorrencia}
                  onChange={handleFieldChange("local_ocorrencia")}
                />
                {errors.local_ocorrencia ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.local_ocorrencia}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                2
              </span>
              Descrição da ocorrência
            </CardTitle>
            <CardDescription>Seja objetivo. Evite dados sensíveis de terceiros.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Detalhe o que aconteceu <span className="text-red-500">*</span>
              </Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  minLength={20}
                  aria-required="true"
                  value={formData.descricao}
                  onChange={handleFieldChange("descricao")}
                  placeholder="Descreva a situação, horários, pessoas envolvidas e outros detalhes importantes."
                />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Mínimo de 20 caracteres.</span>
                <span>{Math.max(0, 1000 - formData.descricao.length)} caracteres restantes</span>
              </div>
              {errors.descricao ? (
                <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {errors.descricao}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label htmlFor="file1">Anexos (opcional, até 15MB cada)</Label>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                <p className="font-medium text-slate-700">Adicionar arquivos de apoio</p>
                <p className="mt-1 text-xs text-slate-500">
                  Aceitamos imagens, vídeos, áudios, PDF, DOC e DOCX. Você pode selecionar múltiplos arquivos.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                    <ImageIcon className="h-3 w-3" /> Fotos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                    <Video className="h-3 w-3" /> Vídeos
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                    <Music className="h-3 w-3" /> Áudios
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                    <FileText className="h-3 w-3" /> Documentos
                  </span>
                </div>
                <Input
                  ref={fileInputRef}
                  id="file1"
                  name="file1"
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  className="mt-4 cursor-pointer bg-white"
                />
              </div>
              {errors.arquivos ? (
                <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                  <AlertCircle className="h-4 w-4" />
                  {errors.arquivos}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                3
              </span>
              Dados de contato
            </CardTitle>
            <CardDescription>Informe seus dados para retorno e acompanhamento do protocolo (opcional).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_completo" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Nome completo (opcional)
                </Label>
                <Input
                  id="nome_completo"
                  name="nome_completo"
                  placeholder="Seu nome completo"
                  value={formData.nome_completo}
                  onChange={handleFieldChange("nome_completo")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  E-mail (opcional)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChange={handleFieldChange("email")}
                />
                {errors.email ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-500" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  placeholder="(31) 99999-9999"
                  value={formData.telefone}
                  onChange={handleFieldChange("telefone")}
                />
                <p className="text-xs text-slate-500">Telefone é opcional, mas ajuda no retorno.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Checkbox
                    id="quer_retorno"
                    name="quer_retorno"
                    value="on"
                    checked={formData.quer_retorno}
                    onChange={handleFieldChange("quer_retorno")}
                  />
                  <div className="space-y-1 text-sm">
                    <Label htmlFor="quer_retorno" className="text-sm font-semibold text-slate-700">
                      Desejo receber retorno sobre minha reclamação
                    </Label>
                    <p className="text-xs text-slate-500">Marque para ser avisado sobre o andamento.</p>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    errors.lgpd_aceite ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <Checkbox
                    id="lgpd_aceite"
                    name="lgpd_aceite"
                    value="on"
                    required
                    checked={formData.lgpd_aceite}
                    onChange={handleFieldChange("lgpd_aceite")}
                  />
                  <div className="space-y-1 text-sm">
                    <Label
                      htmlFor="lgpd_aceite"
                      className={`text-sm font-semibold ${errors.lgpd_aceite ? "text-red-600" : "text-slate-700"}`}
                    >
                      Concordo com o tratamento dos dados fornecidos (LGPD)
                    </Label>
                    <p className="text-xs text-slate-500">
                      Os dados serão usados apenas para registrar e acompanhar a manifestação.
                    </p>
                    {errors.lgpd_aceite ? (
                      <p className="flex items-center gap-2 text-xs text-red-600" role="alert">
                        <AlertCircle className="h-4 w-4" />
                        {errors.lgpd_aceite}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Ao enviar, você autoriza o tratamento dos dados conforme a Política de Privacidade da TopBus.
          </p>
          <Button type="submit" className="h-12 px-8" disabled={isSubmitting || !APPS_URL}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" /> Enviar reclamação
              </span>
            )}
          </Button>
        </div>
        {feedback ? (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className={`mt-4 rounded-2xl border-2 px-5 py-4 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              feedback.type === "success"
                ? "border-emerald-400 bg-emerald-50/80 text-emerald-800 focus:ring-emerald-500"
                : "border-red-300 bg-red-50 text-red-700 focus:ring-red-500"
            }`}
            role="status"
            aria-live="polite"
          >
            {feedback.type === "success" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <ShieldCheck className="h-5 w-5" />
                  {feedback.message}
                </div>
                {feedback.protocolo ? (
                  <p className="text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl">
                    Protocolo: <span className="font-black">{feedback.protocolo}</span>
                  </p>
                ) : null}
                <p className="text-sm text-emerald-700/80">
                  Guarde este número para consultar o andamento da reclamação.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <span>{feedback.message}</span>
              </div>
            )}
          </div>
        ) : null}
      </form>

      <iframe ref={iframeRef} name="appsFrame" title="Apps Script" style={{ display: "none" }} aria-hidden="true" />
    </div>
  );
}
