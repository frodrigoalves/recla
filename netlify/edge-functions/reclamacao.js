/* global Netlify */
const GAS_URL = Netlify.env.get('GAS_URL');
const MB15 = 15 * 1024 * 1024;

export default async (request) => {
  if (!GAS_URL) {
    return Response.json({ ok: false, code: 'MISSING_GAS_URL' }, { status: 500 });
  }

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
    request.headers.get('client-ip') ||
    'IP_NAO_DETECTADO';

  const ct = request.headers.get('content-type') || '';

  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    const files = fd.getAll('anexos');
    const grandes = [];

    for (const f of files) {
      if (f?.size && f.size > MB15) grandes.push(f.name || 'arquivo');
    }

    if (grandes.length) {
      return Response.json(
        { ok: false, code: 'FILE_TOO_LARGE', maxMB: 15, files: grandes },
        { status: 413 }
      );
    }

    fd.append('ip_registro', ip);

    const response = await fetch(GAS_URL, { method: 'POST', body: fd });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  }

  const body = await request.json().catch(() => ({}));
  body.ip_registro = ip;

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });
};
