import { useCallback, useState } from "react";
import { ASSUNTOS, LINHAS, MIN_DESCRICAO_LENGTH } from "../constants";
import { buildInitialForm, createSubmissionFormData, sanitizeAttachments } from "../utils";
import { uploadAttachments } from "../../../services/attachments";

const SUCCESS_MESSAGE = "Reclamação registrada com sucesso!";
const ERROR_MESSAGE = "Erro ao enviar. Tente novamente.";

export function useReclamacaoForm() {
  const [form, setForm] = useState(buildInitialForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });
  const [lastProtocolo, setLastProtocolo] = useState(() => form.protocolo);

  const update = useCallback((field, value) => {
    setForm((prev) => {
      if (field === "anexos") {
        return { ...prev, anexos: sanitizeAttachments(value) };
      }

      return { ...prev, [field]: value };
    });
  }, []);

  const validateStep = useCallback(
    (targetStep) => {
      const nextErrors = {};

      if (targetStep === 1) {
        if (!form.assunto) nextErrors.assunto = "Selecione um assunto.";
        if (!form.data_hora_ocorrencia) nextErrors.data_hora_ocorrencia = "Informe data e hora.";
        if (!form.linha) nextErrors.linha = "Selecione a linha.";
        if (!form.local_ocorrencia) nextErrors.local_ocorrencia = "Informe o local.";
      }

      if (targetStep === 2) {
        const descricao = form.descricao?.trim() ?? "";
        if (!descricao || descricao.length < MIN_DESCRICAO_LENGTH) {
          nextErrors.descricao = `Mínimo de ${MIN_DESCRICAO_LENGTH} caracteres.`;
        }
      }

      if (targetStep === 3) {
        if (!form.nome_completo) {
          nextErrors.nome_completo = "Informe seu nome.";
        }

        const hasEmail = Boolean(form.email?.trim());
        const hasPhone = Boolean(form.telefone?.trim());

        if (!hasEmail && !hasPhone) {
          nextErrors.email = "Informe e-mail ou telefone.";
          nextErrors.telefone = "Informe e-mail ou telefone.";
        }

        if (!form.lgpd_aceite) nextErrors.lgpd_aceite = "É necessário aceitar a LGPD.";
      }

      setErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    },
    [form]
  );

  const goNext = useCallback(() => {
    setFeedback((prev) => (prev.type === "error" ? { type: null, message: "" } : prev));
    const isValid = validateStep(step);
    if (!isValid) {
      return;
    }
    setStep((current) => Math.min(current + 1, 4));
  }, [step, validateStep]);

  const goPrev = useCallback(() => {
    setFeedback((prev) => (prev.type === "error" ? { type: null, message: "" } : prev));
    setErrors({});
    setStep((current) => Math.max(1, current - 1));
  }, []);

  const startNew = useCallback(() => {
    const freshForm = buildInitialForm();
    setForm(freshForm);
    setStep(1);
    setErrors({});
    setFeedback({ type: null, message: "" });
    setLastProtocolo(freshForm.protocolo);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) {
      setStep(3);
      return false;
    }

    setSending(true);
    setFeedback({ type: null, message: "" });

    const currentProtocolo = form.protocolo;

    try {
      const anexos = sanitizeAttachments(form.anexos);
      let anexosRegistrados = [];

      if (anexos.length > 0) {
        try {
          anexosRegistrados = await uploadAttachments(currentProtocolo, anexos);
        } catch (uploadError) {
          console.error(uploadError);
          setFeedback({ type: "error", message: "Erro ao enviar anexos. Tente novamente." });
          return false;
        }
      }

      const formData = createSubmissionFormData(form, anexosRegistrados, anexos);
      const response = await fetch(import.meta.env.VITE_APPSCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Invalid response");
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      const protocoloOficial =
        data?.protocolo ?? data?.Protocolo ?? data?.result?.protocolo ?? null;
      const finalProtocolo = protocoloOficial || currentProtocolo;

      setLastProtocolo(finalProtocolo);
      setFeedback({ type: "success", message: SUCCESS_MESSAGE });
      setErrors({});
      setForm(buildInitialForm());
      setStep(4);
      return true;
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: ERROR_MESSAGE });
      return false;
    } finally {
      setSending(false);
    }
  }, [form, validateStep]);

  return {
    form,
    step,
    errors,
    sending,
    feedback,
    lastProtocolo,
    goNext,
    goPrev,
    update,
    handleSubmit,
    startNew,
    assuntos: ASSUNTOS,
    linhas: LINHAS,
  };
}
