import React, { useMemo } from "react";
import {
  ClipboardList,
  FileText,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Upload,
  AlertCircle,
} from "lucide-react";
import { useReclamacaoForm } from "@/features/reclamacao/hooks/useReclamacaoForm";
import {
  StepChip,
  StepContato,
  StepDados,
  StepDescricao,
  Success,
} from "@/features/reclamacao/components";

export default function NovaReclamacao() {
  const {
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
    assuntos,
    linhas,
  } = useReclamacaoForm();

  const progressPct = useMemo(() => (step >= 4 ? 100 : Math.min(100, step * 33.34)), [step]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-3 md:p-4">
      <div className="max-w-2xl mx-auto py-4 md:py-8">
        <div className="text-center mb-6 md:mb-8 space-y-3 md:space-y-4">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800 px-2">Formulário de Reclamação</h1>
          <p className="text-sm md:text-base text-slate-600 px-3">
            Registre sua reclamação sobre o transporte coletivo. Sua opinião é importante para melhorarmos nossos serviços.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mx-2 md:mx-0">
            <p className="text-green-700 text-xs md:text-sm">Preencha todas as etapas e guarde seu protocolo.</p>
          </div>
        </div>

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

          <form onSubmit={onSubmit} className="p-6 space-y-8">
            {step === 1 ? (
              <StepDados form={form} update={update} errors={errors} assuntos={assuntos} linhas={linhas} />
            ) : null}
            {step === 2 ? <StepDescricao form={form} update={update} errors={errors} /> : null}
            {step === 3 ? <StepContato form={form} update={update} errors={errors} /> : null}
            {step === 4 ? <Success protocolo={lastProtocolo} message={feedback.message} onNew={startNew} /> : null}

            {step < 4 && feedback.type === "error" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{feedback.message}</div>
            ) : null}

            {step < 4 ? (
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={step === 1 || sending}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
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
            ) : null}
          </form>
        </div>

        <p className="text-xs text-gray-500 mt-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-[1px]" />
          Ao enviar, você concorda com o tratamento dos dados para fins de atendimento e melhoria do serviço.
        </p>
      </div>
    </div>
  );
}
