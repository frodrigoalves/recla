/* eslint-env node */
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { neon } from "@netlify/neon";

const sql = neon();

function parseBody(body) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    console.error("Erro ao analisar JSON", error);
    return null;
  }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS reclamacao_arquivos (
      id TEXT PRIMARY KEY,
      protocolo TEXT NOT NULL,
      nome TEXT NOT NULL,
      mime_type TEXT,
      tamanho INTEGER,
      conteudo BYTEA NOT NULL,
      criado_em TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Allow": "POST" },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const payload = parseBody(event.body);

  if (!payload?.protocolo) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Protocolo é obrigatório." }),
    };
  }

  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  if (attachments.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, attachments: [] }),
    };
  }

  try {
    await ensureTable();
    const results = [];

    for (const file of attachments) {
      if (!file?.content) {
        continue;
      }

      const id = randomUUID();
      const buffer = Buffer.from(file.content, "base64");

      await sql`
        INSERT INTO reclamacao_arquivos (id, protocolo, nome, mime_type, tamanho, conteudo)
        VALUES (${id}, ${payload.protocolo}, ${file.name ?? "arquivo"}, ${file.type ?? null}, ${
        typeof file.size === "number" ? file.size : buffer.length
      }, ${buffer})
      `;

      results.push({
        id,
        name: file.name ?? "arquivo",
        mime_type: file.type ?? null,
        size: typeof file.size === "number" ? file.size : buffer.length,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, attachments: results }),
    };
  } catch (error) {
    console.error("Erro ao salvar anexos", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao salvar anexos." }),
    };
  }
}
