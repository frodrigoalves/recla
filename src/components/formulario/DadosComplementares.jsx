import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function DadosComplementares({ formData, setFormData, errors }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">2</span>
          </div>
          Dados Complementares
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data e hora */}
        <div className="space-y-2">
          <Label htmlFor="data_hora_ocorrencia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Data e hora da ocorrência
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="datetime-local"
            id="data_hora_ocorrencia"
            value={formData.data_hora_ocorrencia}
            onChange={(e) => setFormData(prev => ({ ...prev, data_hora_ocorrencia: e.target.value }))}
            className={`${errors.data_hora_ocorrencia ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.data_hora_ocorrencia && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este campo é obrigatório</span>
            </div>
          )}
        </div>

        {/* Linha */}
        <div className="space-y-2">
          <Label htmlFor="linha" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Número da linha
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="linha"
            value={formData.linha}
            onChange={(e) => setFormData(prev => ({ ...prev, linha: e.target.value }))}
            className={`${errors.linha ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.linha && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este campo é obrigatório</span>
            </div>
          )}
        </div>

        {/* Veículo */}
        <div className="space-y-2">
          <Label htmlFor="numero_veiculo" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Número do veículo
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="numero_veiculo"
            value={formData.numero_veiculo}
            onChange={(e) => setFormData(prev => ({ ...prev, numero_veiculo: e.target.value }))}
            className={`${errors.numero_veiculo ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.numero_veiculo && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este campo é obrigatório</span>
            </div>
          )}
        </div>

        {/* Local */}
        <div className="space-y-2">
          <Label htmlFor="local_ocorrencia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Local da ocorrência
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="local_ocorrencia"
            value={formData.local_ocorrencia}
            onChange={(e) => setFormData(prev => ({ ...prev, local_ocorrencia: e.target.value }))}
            className={`${errors.local_ocorrencia ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.local_ocorrencia && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este campo é obrigatório</span>
            </div>
          )}
        </div>

        {/* Tipo de ônibus */}
        <div className="space-y-2">
          <Label htmlFor="tipo_onibus" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Tipo de ônibus
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="tipo_onibus"
            value={formData.tipo_onibus}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo_onibus: e.target.value }))}
            className={`${errors.tipo_onibus ? "border-red-400" : "border-slate-200"}`}
          />
          {errors.tipo_onibus && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Este campo é obrigatório</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
