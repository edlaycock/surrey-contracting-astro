import type { APIRoute } from 'astro';

// Runs on the server (not prerendered) so the SMTP2GO API key stays secret.
// Sends via the SMTP2GO HTTP API: https://developers.smtp2go.com/
export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const env = (key: string) =>
  process.env[key] ?? (import.meta.env as Record<string, string | undefined>)[key];

export const POST: APIRoute = async ({ request }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form submission.' }, 400);
  }

  const get = (k: string) => (form.get(k) ?? '').toString().trim();

  // Honeypot: hidden "_honeypot" field is invisible to users; bots fill it.
  if (get('_honeypot')) return json({ ok: true });

  const name = get('name');
  const email = get('email');
  const phone = get('phone');
  if (!name || !email) {
    return json({ ok: false, error: 'Please provide your name and email.' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: 'Please provide a valid email address.' }, 400);
  }

  const company = get('company');
  const services = form.getAll('svc').map((s) => s.toString()).join(', ');
  const postcode = get('postcode');
  const message = get('message');
  const source = get('source');

  const apiKey = env('SMTP2GO_API_KEY');
  const to = env('CONTACT_TO') || 'info@surreycontracting.co.uk';
  const from = env('CONTACT_FROM') || 'Surrey Contracting Website <website@surreycontracting.co.uk>';
  if (!apiKey) {
    return json({ ok: false, error: 'Email is not configured yet.' }, 503);
  }

  const lines = [
    'New enquiry from the website',
    '',
    `Name:      ${name}`,
    `Email:     ${email}`,
    `Phone:     ${phone || '—'}`,
    `Company:   ${company || '—'}`,
    `Postcode:  ${postcode || '—'}`,
    `Services:  ${services || '—'}`,
    `Heard via: ${source || '—'}`,
    '',
    'Message:',
    message || '—',
  ];

  try {
    const res = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': apiKey,
      },
      body: JSON.stringify({
        sender: from,
        to: [to],
        bcc: ['elaycock@cumulusdigital.co.uk'],
        subject: `Website enquiry — ${name}`,
        text_body: lines.join('\n'),
        custom_headers: [{ header: 'Reply-To', value: email }],
      }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json().catch(() => ({}));
    const succeeded = data?.data?.succeeded ?? 0;
    if (!res.ok || succeeded < 1) {
      console.error('[contact] smtp2go error', res.status, JSON.stringify(data));
      return json({ ok: false, error: 'Could not send your enquiry. Please call us.' }, 502);
    }
  } catch (err) {
    console.error('[contact] send failed', err);
    return json({ ok: false, error: 'Could not send your enquiry. Please call us.' }, 502);
  }

  return json({ ok: true });
};
