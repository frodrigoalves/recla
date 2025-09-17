import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

export default function ContatoLGPD({ formData, setFormData, errors }) {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-slate-800">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">4</span>
          </div>
          Contato e LGPD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pergunta se deseja retorno */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Deseja receber um retorno sobre o status da reclamação? <span className="italic">(Opcional)</span>
          </p>
          <Input
            type="text"
            placeholder="Nome"
            value={formData.nome_completo}
            onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
          />
          <Input
            type="tel"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
          />
          <Input
            type="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>

        {/* LGPD */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="lgpd"
            checked={formData.lgpd_aceite}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lgpd_aceite: checked }))}
          />
          <Label htmlFor="lgpd" className="text-sm text-slate-700">
            Autorizo o uso dos meus dados pessoais para contato e tratamento da reclamação.
            <span className="text-red-500">*</span>
          </Label>
        </div>
        {errors.lgpd_aceite && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Você deve aceitar a LGPD para enviar o formulário</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
