import React from "react";
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
    update,
    handleSubmit,
    startNew,
    assuntos,
    linhas,
  } = useReclamacaoForm();

  const onSubmit = async (event) => {
    event.preventDefault();
    await handleSubmit();
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto py-8">
          <Success protocolo={lastProtocolo} message={feedback.message} onNew={startNew} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                1️⃣ Dados básicos da ocorrência
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protocolo
                  </label>
                  <input
                    value={form.protocolo}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto *
                  </label>
                  <select
                    value={form.assunto}
                    onChange={(event) => update("assunto", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione o assunto</option>
                    {assuntos.map((assunto) => (
                      <option key={assunto} value={assunto}>
                        {assunto}
                      </option>
                    ))}
                  </select>
                  {errors.assunto && <p className="text-red-600 text-xs mt-1">{errors.assunto}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data e hora da ocorrência *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.data_hora_ocorrencia}
                    onChange={(event) => update("data_hora_ocorrencia", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.data_hora_ocorrencia && (
                    <p className="text-red-600 text-xs mt-1">{errors.data_hora_ocorrencia}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Linha *
                  </label>
                  <select
                    value={form.linha}
                    onChange={(event) => update("linha", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione a linha</option>
                    {linhas.map((linha) => (
                      <option key={linha} value={linha}>
                        {linha}
                      </option>
                    ))}
                  </select>
                  {errors.linha && <p className="text-red-600 text-xs mt-1">{errors.linha}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do veículo
                  </label>
                  <input
                    placeholder="Ex.: 12345"
                    value={form.numero_veiculo}
                    onChange={(event) => update("numero_veiculo", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Local da ocorrência *
                  </label>
                  <input
                    placeholder="Rua/Estação/Ponto de referência"
                    value={form.local_ocorrencia}
                    onChange={(event) => update("local_ocorrencia", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.local_ocorrencia && (
                    <p className="text-red-600 text-xs mt-1">{errors.local_ocorrencia}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de ônibus
                  </label>
                  <input
                    placeholder="Convencional, Articulado, etc."
                    value={form.tipo_onibus}
                    onChange={(event) => update("tipo_onibus", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                2️⃣ Descrição da ocorrência
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descreva o que aconteceu * (mínimo 50 caracteres)
                </label>
                <textarea
                  placeholder="Descreva detalhadamente o que aconteceu. Inclua informações como horário, pessoas envolvidas, circunstâncias, etc."
                  value={form.descricao}
                  onChange={(event) => update("descricao", event.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.descricao && <p className="text-red-600 text-xs">{errors.descricao}</p>}
                  <p className="text-gray-500 text-xs">
                    {form.descricao?.length || 0} caracteres
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anexos (opcional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                  onChange={(event) => update("anexos", Array.from(event.target.files))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Aceitos: imagens, áudio, vídeo, PDF e documentos (máx. 15MB cada)
                </p>
                {form.anexos?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {form.anexos.length} arquivo(s) selecionado(s)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dados de Contato */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                3️⃣ Dados de contato
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo *
                  </label>
                  <input
                    placeholder="Seu nome completo"
                    value={form.nome_completo}
                    onChange={(event) => update("nome_completo", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.nome_completo && (
                    <p className="text-red-600 text-xs mt-1">{errors.nome_completo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone (opcional)
                  </label>
                  <input
                    placeholder="(31) 99999-9999"
                    value={form.telefone}
                    onChange={(event) => update("telefone", event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.telefone && <p className="text-red-600 text-xs mt-1">{errors.telefone}</p>}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={form.quer_retorno}
                      onChange={(event) => update("quer_retorno", event.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">
                      Desejo retorno sobre minha reclamação (informe e-mail ou telefone)
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={form.lgpd_aceite}
                      onChange={(event) => update("lgpd_aceite", event.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="text-sm text-gray-700">
                      Concordo com o tratamento dos dados informados para fins de atendimento e melhoria do serviço (LGPD) *
                    </label>
                  </div>
                  {errors.lgpd_aceite && <p className="text-red-600 text-xs mt-1">{errors.lgpd_aceite}</p>}
                </div>
              </div>
            </div>

            {feedback.type === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700 text-sm">{feedback.message}</p>
              </div>
            )}

            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Enviando..." : "Enviar Reclamação"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
