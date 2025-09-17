import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Bus, MapPin, Clock } from "lucide-react";

const LINHAS_SUGERIDAS = [
  "82",
  "85 / EST.S.GABRIEL/CENTRO-VIA FLORESTA",
  "83D / EST.SÃO GABRIEL/CENTRO-DIRETA",
  "209",
  "9204 / SANTA EFIGENIA/ESTORIL",
  "9250 / CAETANO FURQUIM/NOVA CINTRA VIA SAVASSI"
];

export default function DadosComplementares({ formData, setFormData, errors }) {
  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">2</span>
          </div>
          Dados da Ocorrência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="data_hora" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Data e horário
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="datetime-local"
            id="data_hora"
            value={formData.data_hora_ocorrencia}
            onChange={(e) => setFormData(prev => ({ ...prev, data_hora_ocorrencia: e.target.value }))}
            className={`h-11 border-slate-200 focus:border-blue-500 ${errors.data_hora_ocorrencia ? 'border-red-400' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linha" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Bus className="w-4 h-4 text-blue-500" />
            Linha
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="linha"
            list="linhas-datalist"
            value={formData.linha}
            onChange={(e) => setFormData(prev => ({ ...prev, linha: e.target.value }))}
            placeholder="Ex: 85 ou 9204"
            className={`h-11 border-slate-200 focus:border-blue-500 ${errors.linha ? 'border-red-400' : ''}`}
          />
          <datalist id="linhas-datalist">
            {LINHAS_SUGERIDAS.map((linha) => (
              <option key={linha} value={linha} />
            ))}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero_veiculo" className="text-sm font-semibold text-slate-700">
            Número do Veículo
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="numero_veiculo"
            value={formData.numero_veiculo}
            onChange={(e) => setFormData(prev => ({ ...prev, numero_veiculo: e.target.value }))}
            placeholder="Ex: 12345"
            className={`h-11 border-slate-200 focus:border-blue-500 ${errors.numero_veiculo ? 'border-red-400' : ''}`}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="local_ocorrencia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" />
            Local da Ocorrência
            <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="local_ocorrencia"
            value={formData.local_ocorrencia}
            onChange={(e) => setFormData(prev => ({ ...prev, local_ocorrencia: e.target.value }))}
            placeholder="Digite o local"
            className={`h-11 border-slate-200 focus:border-blue-500 ${errors.local_ocorrencia ? 'border-red-400' : ''}`}
          />
        </div>

      </CardContent>
    </Card>
  );
}
