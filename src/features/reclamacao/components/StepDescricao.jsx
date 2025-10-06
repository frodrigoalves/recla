import AnexosUpload from "@/components/AnexosUpload";
import { MAX_DESCRICAO_LENGTH, MIN_DESCRICAO_LENGTH } from "../constants";
import { Field } from "./Field";

export function StepDescricao({ form, update, errors }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="md:col-span-2">
        <Field
          label="Descrição detalhada"
          error={errors.descricao}
          hint={`Mínimo ${MIN_DESCRICAO_LENGTH} caracteres. Evite dados pessoais.`}
        >
          <textarea
            value={form.descricao}
            onChange={(event) => update("descricao", event.target.value.slice(0, MAX_DESCRICAO_LENGTH))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 h-36 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            placeholder="Descreva o que aconteceu com clareza..."
            maxLength={MAX_DESCRICAO_LENGTH}
          />
          <div className="flex justify-end text-xs text-gray-500 mt-1">
            {form.descricao.length}/{MAX_DESCRICAO_LENGTH}
          </div>
        </Field>
      </div>

      <div className="md:col-span-2">
        <Field label="Anexos (até 15 MB por arquivo)">
          <AnexosUpload key={form.protocolo} data={form} onChange={update} />
          <p className="text-xs text-gray-500 mt-1">
            São aceitos arquivos de imagem, áudio ou vídeo enviados diretamente pelo formulário.
          </p>
        </Field>
      </div>
    </section>
  );
}
