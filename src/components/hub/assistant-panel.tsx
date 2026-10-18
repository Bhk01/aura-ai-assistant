import { useEffect, useRef, useState } from 'react';
import { Mic, Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDesign } from '@/logic/design-context';
import { awayList, useStore } from '@/logic/store';
import { formatDate } from '@/logic/rules';
import { Hub } from '@/hub/hub';

export function AssistantPanel({ onOpenDevice }: { onOpenDevice: (id: string) => void }) {
  const { t, language } = useDesign();
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const devices = useStore(s => s.devices);
  const companies = useStore(s => s.companies);
  const late = awayList(devices, companies).filter(d => d.late);
  useEffect(() => () => { request.current?.abort(); recognition.current?.stop(); }, []);
  function transcribe() {
    const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Constructor) { setAnswer(t('fingerprintUnavailable')); return; }
    const recorder = new Constructor();
    recorder.lang = language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US';
    recorder.continuous = false;
    recorder.interimResults = false;
    recorder.onresult = event => setInput(event.results[0]?.[0]?.transcript ?? '');
    recorder.onerror = () => setAnswer(t('error'));
    recognition.current = recorder;
    recorder.start();
  }
  async function ask() {
    if (!input.trim() || busy) return;
    if (!navigator.onLine) { setAnswer(t('assistantOffline')); return; }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setAnswer('');
    try {
      const response = await fetch('/api/hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ language, context: '{}', messages: [{ role: 'user', content: input.trim() }] }) });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setAnswer(payload?.code === 'PRIVATE_ACCESS_REQUIRED' ? t('assistantBlocked') : payload?.error ?? t('error'));
        return;
      }
      if (!response.body || !response.headers.get('content-type')?.includes('text/plain')) throw new Error(t('error'));
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let text = '';
      try {
        for (;;) { const chunk = await reader.read(); if (chunk.done) break; text += chunk.value; setAnswer(text.replace(/\u0000ERROR:/g, '')); }
      } finally { reader.releaseLock(); }
      if (!text.trim()) setAnswer(t('assistantEmpty'));
    } catch (error) {
      if (!controller.signal.aborted) setAnswer(error instanceof Error ? error.message : t('error'));
    } finally { setBusy(false); request.current = null; }
  }
  return <div className="assistant-panel">
    <Hub move={busy ? 'think' : 'idle'} className="modal-hub" />
    <form onSubmit={e => { e.preventDefault(); void ask(); }}>
      <label className="pin-label" htmlFor="hub-question">{t('assistantInput')}</label>
      <textarea id="hub-question" className="assistant-input" value={input} onChange={e => setInput(e.target.value)} maxLength={4000} rows={3} />
      <small className="text-muted-foreground">{t('patientWarning')}</small>
      <div className="hub-assistant-controls">
        <Button variant="soft" size="tool" type="button" onClick={transcribe} aria-label={t('assistantVoice')} title={t('assistantVoice')}><Mic /></Button>
        {busy ? <Button variant="soft" size="touch" type="button" onClick={() => { request.current?.abort(); recognition.current?.stop(); }}><Square />{t('assistantStop')}</Button> : <Button variant="hub" size="touch" type="submit" disabled={!input.trim()}><Send />{t('assistantSend')}</Button>}
        <Button variant="soft" size="touch" type="button" onClick={() => setAnswer(late.map(d => `${d.device.inventory} · ${d.company.name} · ${formatDate(d.expected)}`).join('\n') || t('noOverdue'))}>{t('assistantLocal')}</Button>
      </div>
    </form>
    {answer && <p className="assistant-answer" role="status">{answer}</p>}
    <div className="assistant-results">{late.map(item => <Button key={item.device.id} variant="soft" size="touch" onClick={() => onOpenDevice(item.device.id)}>{item.device.inventory}<span>{item.company.name}</span></Button>)}</div>
  </div>;
}