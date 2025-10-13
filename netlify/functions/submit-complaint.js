/* eslint-env node */

const APPS_SCRIPT_URL =
  process.env.APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwbMRcY2YDufjLe1itVR6--aA1REGJTfFFI3z7WLqx8jdnA58ndc2mHkc2WRDdUf7CrQg/exec";

const ALLOWED_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";

const buildCorsHeaders = (event) => {
  const originHeader = event.headers?.origin || event.headers?.Origin || "";
  const requestHeaders =
    event.headers?.["access-control-request-headers"] ||
    event.headers?.AccessControlRequestHeaders ||
    "Content-Type";

  const allowOrigin = ALLOWED_ORIGIN === "auto" && originHeader ? originHeader : ALLOWED_ORIGIN;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": requestHeaders || "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

export async function handler(event) {
  const corsHeaders = buildCorsHeaders(event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: "POST", "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Method Not Allowed" }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, message: "Corpo da requisição ausente." }),
    };
  }

  try {
    // Relay the payload to the Apps Script endpoint
    const upstreamResponse = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await upstreamResponse.json() : await upstreamResponse.text();

    if (!upstreamResponse.ok) {
      const message =
        (isJson && payload && typeof payload === "object" && payload.message)
          ? payload.message
          : typeof payload === "string" && payload.trim().length > 0
            ? payload
            : "Não foi possível enviar a reclamação. Tente novamente.";

      return {
        statusCode: upstreamResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, message }),
      };
    }

    const successBody =
      isJson && payload && typeof payload === "object"
        ? payload
        : { success: true, message: typeof payload === "string" ? payload : "Reclamação enviada com sucesso." };

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(successBody),
    };
  } catch (error) {
    console.error("Erro ao encaminhar a reclamação", error);
    return {
      statusCode: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        message: "Não foi possível contactar o serviço de processamento das reclamações.",
      }),
    };
  }
}
