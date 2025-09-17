import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileText } from "lucide-react";

export default function DescricaoReclamacao({ formData, setFormData, errors }) {
  const caracteresRestantes = 1000 - (formData.descricao?.length || 0);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">3</span>
          </div>
          Descrição da Reclamação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="descricao" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Descreva detalhadamente sua reclamação
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            placeholder="Descreva sua demanda de acordo com o assunto selecionado. Seja específico sobre o que aconteceu, quando e onde..."
            className={`min-h-[150px] resize-none border-slate-200 focus:border-blue-500 transition-all duration-200 ${errors.descricao ? 'border-red-400' : ''}`}
            maxLength={1000}
          />
          <div className="flex justify-between items-center text-xs">
            {errors.descricao ? (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-3 h-3" />
                <span>Este campo é obrigatório (mínimo 20 caracteres)</span>
              </div>
            ) : (
              <div className="text-slate-500">
                Mínimo 20 caracteres para uma descrição adequada
              </div>
            )}
            <div className={`text-right ${caracteresRestantes < 50 ? 'text-red-500' : 'text-slate-500'}`}>
              {caracteresRestantes} caracteres restantes
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
