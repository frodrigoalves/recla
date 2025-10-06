import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Music,
  Upload,
  User,
  Video,
  Bus,
  Phone,
  Mail,
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
import { ASSUNTOS } from "@/features/reclamacao/constants";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const GOOGLE_ALLOWED_ORIGINS = ["script.google.com", "googleusercontent.com"];

const APPS_URL = appsScriptUrl;

const INITIAL_FORM = {
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

const TIPOS_ONIBUS = ["Padron", "Convencional", "Articulado"];

const LINHAS_OPCOES = [
  {
    value: "85 - EST.S.GABRIEL/CENTRO - VIA FLORESTA",
    veiculos: ["8501", "8502", "8503"],
  },
  {
    value: "812 - ESTAÇÃO SÃO GABRIEL",
    veiculos: ["8121", "8122", "8123"],
  },
  {
    value: "815 - ESTAÇÃO SÃO GABRIEL/CONJ. PAULO VI",
    veiculos: ["8151", "8152", "8153"],
  },
  {
    value: "822 - ESTAÇÃO JOSÉ CÂNDIDO / VILA MARIA",
    veiculos: ["8221", "8222", "8223"],
  },
  {
    value: "9204 - SANTA EFIGÊNIA/ESTORIL",
    veiculos: ["920401", "920402", "920403"],
  },
  {
    value: "9250 - CAETANO FURQUIM/NOVA CINTRA",
    veiculos: ["925001", "925002", "925003"],
  },
];

export default function ReclamacaoForm() {
  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);
  const [ip, setIp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [manualLineActive, setManualLineActive] = useState(false);
  const [manualLineValue, setManualLineValue] = useState("");
  const [manualVehicleActive, setManualVehicleActive] = useState(false);
  const [manualVehicleValue, setManualVehicleValue] = useState("");

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
      if (origin && !GOOGLE_ALLOWED_ORIGINS.some((allowed) => origin.includes(allowed))) {
        return;
      }

      let payload = event.data;
      if (!payload) return;

      if (typeof payload === "string") {
        const trimmed = payload.trim();
        if (!trimmed) return;
        try {
          payload = JSON.parse(trimmed);
        } catch {
          return;
        }
      }

      if (!payload || typeof payload !== "object" || !Object.prototype.hasOwnProperty.call(payload, "ok")) {
        return;
      }

      setIsSubmitting(false);

      if (payload.ok) {
        const protocolo = payload.protocolo
          ? `Reclamação registrada. Protocolo: ${payload.protocolo}`
          : "Reclamação registrada.";
        setFeedback({ type: "success", message: protocolo });
        setFormData(INITIAL_FORM);
        setErrors({});
        setManualLineActive(false);
        setManualLineValue("");
        setManualVehicleActive(false);
        setManualVehicleValue("");
        if (formRef.current) {
          formRef.current.reset();
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const message = payload.error
          ? `Erro ao registrar reclamação: ${payload.error}`
          : "Não foi possível registrar a reclamação.";
        setFeedback({ type: "error", message });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const availableLine = useMemo(
    () => LINHAS_OPCOES.find((option) => option.value === formData.linha),
    [formData.linha],
  );

  const availableVehicles = availableLine?.veiculos ?? [];

  const vehicleSelectValue = manualVehicleActive ? "__manual__" : formData.numero_veiculo;
  const lineSelectValue = manualLineActive ? "__manual__" : formData.linha;

  const validateBeforeSubmit = () => {
    const nextErrors = {};
    if (!formData.nome_completo.trim()) {
      nextErrors.nome_completo = "Informe seu nome completo.";
    }
    const descricaoOk = formData.descricao.trim().length >= 20;
    if (!descricaoOk) {
      nextErrors.descricao = "Descreva a ocorrência com pelo menos 20 caracteres.";
    }
    if (!formData.lgpd_aceite) {
      nextErrors.lgpd_aceite = "É necessário aceitar o tratamento dos dados.";
    }
    if (!formData.email.trim() && !formData.telefone.trim()) {
      nextErrors.contato = "Informe e-mail ou telefone para contato.";
    }

    const files = formRef.current?.elements?.file1?.files;
    if (files && files.length) {
      const oversize = Array.from(files).some((file) => file.size > MAX_FILE_SIZE);
      if (oversize) {
        nextErrors.arquivos = "Cada arquivo deve ter no máximo 15MB.";
      }
    }

    return nextErrors;
  };

  const handleSubmit = (event) => {
    const nextErrors = validateBeforeSubmit();
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
      setErrors(nextErrors);
      setFeedback({ type: "error", message: "Revise os campos destacados antes de enviar." });
      return;
    }

    setErrors({});
    setFeedback(null);
    setIsSubmitting(true);
  };

  const handleLineChange = (value) => {
    if (value === "__manual__") {
      setManualLineActive(true);
      setFormData((prev) => ({ ...prev, linha: manualLineValue, numero_veiculo: "" }));
      setManualVehicleActive(true);
      setManualVehicleValue("");
      return;
    }

    setManualLineActive(false);
    setManualLineValue("");
    setManualVehicleActive(false);
    setManualVehicleValue("");
    setFormData((prev) => ({ ...prev, linha: value, numero_veiculo: "" }));
  };

  const handleVehicleChange = (value) => {
    if (value === "__manual__") {
      setManualVehicleActive(true);
      setFormData((prev) => ({ ...prev, numero_veiculo: manualVehicleValue }));
      return;
    }

    setManualVehicleActive(false);
    setManualVehicleValue("");
    setFormData((prev) => ({ ...prev, numero_veiculo: value }));
  };

  return (
    <div className="space-y-6">
      {!APPS_URL ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="status">
          Serviço não configurado. Contate o suporte.
        </div>
      ) : null}

      <form
        ref={formRef}
        method="POST"
        encType="multipart/form-data"
        target="appsFrame"
        action={APPS_URL || undefined}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <input type="hidden" name="iframe" value="true" />
        <input type="hidden" name="ip" value={ip} />
        <input type="hidden" name="linha" value={formData.linha} />
        <input type="hidden" name="numero_veiculo" value={formData.numero_veiculo} />

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
              <Label htmlFor="assunto">Assunto <span className="text-red-500">*</span></Label>
              <Select
                id="assunto"
                name="assunto"
                required
                value={formData.assunto}
                onChange={(event) => setFormData((prev) => ({ ...prev, assunto: event.target.value }))}
                placeholder="Selecione o assunto"
              >
                <SelectOption value="">Selecione o assunto</SelectOption>
                {ASSUNTOS.map((assunto) => (
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
                  Data e hora da ocorrência
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="data_hora_ocorrencia"
                  name="data_hora_ocorrencia"
                  type="datetime-local"
                  required
                  value={formData.data_hora_ocorrencia}
                  onChange={(event) => setFormData((prev) => ({ ...prev, data_hora_ocorrencia: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-500" />
                  Linha (opcional)
                </Label>
                <Select
                  value={lineSelectValue}
                  onChange={(event) => handleLineChange(event.target.value)}
                  placeholder="Selecione a linha (opcional)"
                >
                  <SelectOption value="">Nenhuma linha selecionada</SelectOption>
                  {LINHAS_OPCOES.map((linha) => (
                    <SelectOption key={linha.value} value={linha.value}>
                      {linha.value}
                    </SelectOption>
                  ))}
                  <SelectOption value="__manual__">Informar outra linha</SelectOption>
                </Select>
                {manualLineActive ? (
                  <Input
                    placeholder="Digite o número ou nome da linha"
                    value={manualLineValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      setManualLineValue(value);
                      setFormData((prev) => ({ ...prev, linha: value, numero_veiculo: "" }));
                    }}
                  />
                ) : null}
                <p className="text-xs text-slate-500">
                  Campo opcional. Escolha uma linha sugerida ou informe manualmente.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-500" />
                  Número do veículo (opcional)
                </Label>
                <Select
                  value={vehicleSelectValue}
                  onChange={(event) => handleVehicleChange(event.target.value)}
                  placeholder={manualLineActive || formData.linha
                    ? "Selecione o número do carro"
                    : "Selecione a linha primeiro"}
                  disabled={!manualLineActive && !formData.linha}
                >
                  <SelectOption value="">Nenhum veículo selecionado</SelectOption>
                  {availableVehicles.map((veiculo) => (
                    <SelectOption key={veiculo} value={veiculo}>
                      {veiculo}
                    </SelectOption>
                  ))}
                  <SelectOption value="__manual__">Informar outro veículo</SelectOption>
                </Select>
                {manualVehicleActive ? (
                  <Input
                    placeholder="Digite o número do veículo"
                    value={manualVehicleValue}
                    onChange={(event) => {
                      const value = event.target.value;
                      setManualVehicleValue(value);
                      setFormData((prev) => ({ ...prev, numero_veiculo: value }));
                    }}
                  />
                ) : null}
                <p className="text-xs text-slate-500">
                  Sugestões com base na linha selecionada. Informe manualmente se necessário.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2" htmlFor="local_ocorrencia">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  Local da ocorrência <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="local_ocorrencia"
                  name="local_ocorrencia"
                  required
                  placeholder="Rua, ponto ou região"
                  value={formData.local_ocorrencia}
                  onChange={(event) => setFormData((prev) => ({ ...prev, local_ocorrencia: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_onibus">Tipo de ônibus (opcional)</Label>
                <Select
                  id="tipo_onibus"
                  name="tipo_onibus"
                  value={formData.tipo_onibus}
                  onChange={(event) => setFormData((prev) => ({ ...prev, tipo_onibus: event.target.value }))}
                  placeholder="Selecione o tipo de ônibus"
                >
                  <SelectOption value="">Não informado</SelectOption>
                  {TIPOS_ONIBUS.map((tipo) => (
                    <SelectOption key={tipo} value={tipo}>
                      {tipo}
                    </SelectOption>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">Escolha entre Padron, Convencional ou Articulado.</p>
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
            <CardDescription>
              Seja objetivo. Evite dados sensíveis de terceiros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Detalhe o que aconteceu
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="descricao"
                name="descricao"
                minLength={20}
                required
                value={formData.descricao}
                onChange={(event) => setFormData((prev) => ({ ...prev, descricao: event.target.value }))}
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
              <Label htmlFor="file1">Anexos (até 15MB cada)</Label>
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
              Dados para contato e LGPD
            </CardTitle>
            <CardDescription>Suas informações ajudam a equipe a retornar e registrar o protocolo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_completo" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  Nome completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome_completo"
                  name="nome_completo"
                  required
                  value={formData.nome_completo}
                  onChange={(event) => setFormData((prev) => ({ ...prev, nome_completo: event.target.value }))}
                />
                {errors.nome_completo ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.nome_completo}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                />
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, telefone: event.target.value }))}
                />
                <p className="text-xs text-slate-500">Informe e-mail ou telefone para contato.</p>
                {errors.contato ? (
                  <p className="flex items-center gap-2 text-sm text-red-600" role="alert">
                    <AlertCircle className="h-4 w-4" />
                    {errors.contato}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Checkbox
                    id="quer_retorno"
                    name="quer_retorno"
                    value="on"
                    checked={formData.quer_retorno}
                    onChange={(event) => setFormData((prev) => ({ ...prev, quer_retorno: event.target.checked }))}
                  />
                  <div className="space-y-1 text-sm">
                    <Label htmlFor="quer_retorno" className="text-sm font-semibold text-slate-700">
                      Desejo receber retorno sobre minha reclamação
                    </Label>
                    <p className="text-xs text-slate-500">Marque para ser avisado sobre o andamento.</p>
                  </div>
                </div>

                <div className={`flex items-start gap-3 rounded-xl border p-3 ${errors.lgpd_aceite ? "border-red-300 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                  <Checkbox
                    id="lgpd_aceite"
                    name="lgpd_aceite"
                    value="on"
                    required
                    checked={formData.lgpd_aceite}
                    onChange={(event) => setFormData((prev) => ({ ...prev, lgpd_aceite: event.target.checked }))}
                  />
                  <div className="space-y-1 text-sm">
                    <Label htmlFor="lgpd_aceite" className={`text-sm font-semibold ${errors.lgpd_aceite ? "text-red-600" : "text-slate-700"}`}>
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

        <div className="space-y-3">
          <Button type="submit" disabled={isSubmitting || !APPS_URL} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Enviando reclamação...
              </>
            ) : (
              <>
                Enviar reclamação <Upload className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center">
            Ao enviar, você concorda em compartilhar as informações para registro oficial da ocorrência.
          </p>
        </div>
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
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700" role="status" aria-live="assertive">
          <Loader2 className="h-4 w-4 animate-spin" /> Estamos enviando sua reclamação. Aguarde a confirmação do protocolo.
        </div>
      ) : null}

      <iframe name="appsFrame" style={{ display: "none" }} title="Resposta do Apps Script" />
    </div>
  );
}
