import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

const ASSUNTOS = [
  "ACESSIBILIDADE",
  "AUSÊNCIA DE AGENTE DE BORDO",
  "CARTÃO BHBUS / RECARGA À BORDO",
  "COMPORTAMENTO INADEQUADO DO MOTORISTA/AGENTE DE BORDO X IDOSO",
  "DESCUMPRIMENTO DE ITINERARIO",
  "ESTADO DE CONSERVAÇÃO DO VEÍCULO",
  "SUPERLOTAÇÃO",
  "TEMPO DE ESPERA",
  "TARIFA"
];

export default function DadosBasicos({ formData, setFormData, errors }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">1</span>
          </div>
          Dados da Reclamação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="assunto" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Selecione o assunto
            <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.assunto}
            onValueChange={(value) => setFormData(prev => ({ ...prev, assunto: value }))}>
            <SelectTrigger className={`h-12 border-slate-200 focus:border-blue-500 ${errors.assunto ? 'border-red-400' : ''}`}>
              <SelectValue placeholder="Escolha o assunto da sua reclamação..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {ASSUNTOS.map((assunto) => (
                <SelectItem key={assunto} value={assunto}>{assunto}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.assunto && (
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
