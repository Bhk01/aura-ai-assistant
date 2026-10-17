import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

const GATEWAY = 'https://ai.gateway.lovable.dev';
const CHAT_MODEL = 'openai/gpt-6-astra';
const SPEECH_MODEL = 'google/gemini-3.1-flash-tts-preview';
const RUN_ID = 'X-Lovable-AIG-Run-ID';

const HUB_TOOL_NAMES = [
  'search_devices',
  'list_late_devices',
  'list_devices_at_company',
  'get_device_history',
  'find_paper',
  'get_company_info',
  'draft_reminder_message',
  'open_screen',
  'start_send_to_company',
  'start_mark_returned',
] as const;

const ChatBody = z.object({
  language: z.enum(['fr', 'en', 'ar']),
  context: z.string().max(12000),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) })).min(1).max(20),
});

const HubToolCallSchema = z.object({
  tool: z.enum(HUB_TOOL_NAMES),
  args: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

function instructions(language: string, context: string) {
  return `You are Hub, a warm, playful assistant inside S-IT Hub, an app made as a thank-you gift for ilhem letaief, IT manager at Hôpital Universitaire Sahloul de Sousse, by her students Ibrahim Ghaouar and Med yassine ben rjab.
Reply in ${language === 'ar' ? 'Arabic' : language === 'en' ? 'English' : 'French'} unless she writes in another language, then match her. Keep answers short (1-4 sentences), kind and clear; your reply may be read aloud, so avoid markdown, lists and emojis.
You can answer any general question. For questions about her devices, companies or papers, use ONLY the verified app data below; if the answer is not in it, say you are not sure. Never invent device data. Never ask for or mention patient information.
You cannot change data yet: if she asks you to send or return a device, tell her which button to use (the + button, or "Retourné" on the device).
STRICT TOOL-CALLING RULES: use only names from ${HUB_TOOL_NAMES.join(', ')}. A valid tool call must match this schema: ${JSON.stringify(HubToolCallSchema.shape)}. Do not hallucinate device IDs, company IDs, or repair costs. If a required value is missing, say you need it rather than inventing it.
Dates are day/month/year. Money in TND with 3 decimals.
VERIFIED APP DATA (JSON):
${context}`;
}

function runIdFetch(initial?: string | null) {
  let runId = initial?.trim() || undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(RUN_ID)) headers.set(RUN_ID, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(RUN_ID)?.trim() || undefined;
    return response;
  };
}

export async function handleHubChat(request: Request) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return Response.json({ error: 'AI is not configured.' }, { status: 401 });
  const parsed = ChatBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid request.' }, { status: 400 });
  const { language, context, messages } = parsed.data;
  const provider = createOpenAI({
    baseURL: `${GATEWAY}/v1`, apiKey,
    headers: { 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'vercel-ai-sdk' },
    fetch: runIdFetch(request.headers.get(RUN_ID)),
  });
  let failure: { status: number; message: string } | null = null;
  const result = streamText({
    model: provider.responses(CHAT_MODEL),
    instructions: instructions(language, context),
    messages,
    abortSignal: request.signal,
    providerOptions: { openai: { forceReasoning: true, reasoningEffort: 'low', reasoningSummary: 'auto', store: false, include: ['reasoning.encrypted_content'] } },
    onError: ({ error }) => {
      const status = (error as { statusCode?: number }).statusCode ?? 500;
      failure = { status, message: status === 402 ? 'Hub has used all its AI credits for now.' : status === 429 ? 'Hub is a bit busy, try again in a moment.' : 'Hub could not answer right now.' };
    },
  });
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) controller.enqueue(encoder.encode(chunk));
      } catch { /* reported via onError */ }
      if (failure) controller.enqueue(encoder.encode(`\n\u0000ERROR:${(failure as { message: string }).message}`));
      controller.close();
    },
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function handleHubSpeech(request: Request) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return Response.json({ error: 'AI is not configured.' }, { status: 401 });
  const parsed = z.object({ text: z.string().min(1).max(1500) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid request.' }, { status: 400 });
  const upstream = await fetch(`${GATEWAY}/v1/audio/speech`, {
    method: 'POST', signal: request.signal,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
    body: JSON.stringify({
      model: SPEECH_MODEL,
      contents: [{ role: 'user', parts: [{ text: `Say warmly and cheerfully, at a natural pace: ${parsed.data.text}` }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } },
      stream_format: 'sse',
    }),
  });
  const headers = new Headers({ 'Content-Type': upstream.headers.get('Content-Type') ?? 'text/event-stream', 'Cache-Control': 'no-store' });
  upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith('x-lovable-aig-')) headers.set(k, v); });
  return new Response(upstream.body, { status: upstream.status, headers });
}
