import React from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import ReclamacaoForm from "@/components/formulario/ReclamacaoForm";
import { useAppsHealth } from "@/features/reclamacao/hooks/useAppsHealth";
import { appsScriptUrl } from "@/config/appsScript";
import { Badge } from "@/components/ui/badge";

const APPS_URL = appsScriptUrl;

export default function NovaReclamacao() {
  const { loading, ok } = useAppsHealth();

  const healthLabel = loading
    ? "Verificando serviço..."
    : ok
      ? "Serviço ativo"
      : "Serviço indisponível";

  const healthVariant = loading ? "warning" : ok ? "default" : "danger";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 py-6 px-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-4 text-center">
          <div className="flex justify-center">
            <Badge variant={healthVariant} className="text-xs">
              <span className="relative flex h-2 w-2 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
              </span>
              {healthLabel}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Formulário de Reclamação</h1>
          <p className="text-sm text-slate-600 md:text-base">
            Registre reclamações sobre o transporte coletivo e acompanhe o protocolo retornado pelo Apps Script após o envio.
          </p>
          <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-700">
            <ShieldCheck className="mt-0.5 h-5 w-5" />
            <span>
              O formulário envia os dados diretamente ao Apps Script via <code className="font-mono text-xs">multipart/form-data</code>.
              O protocolo aparecerá aqui somente quando a resposta for confirmada.
            </span>
          </div>
          {!APPS_URL ? (
            <div className="mx-auto flex max-w-2xl items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700" role="alert">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <span>Defina <code className="font-mono text-xs">VITE_APPSCRIPT_URL</code> para habilitar o envio.</span>
            </div>
          ) : null}
        </header>

        <ReclamacaoForm />
      </div>
    </div>
  );
}
