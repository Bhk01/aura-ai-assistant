import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowDownLeft, ArrowRight, Bell, Building2, Check, ChevronRight, Cloud, FileText, LayoutGrid, Monitor, Plus, ScanLine, Send, Settings2, ShieldAlert, Sparkles, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DesignProvider, useDesign, type CopyKey, type Language } from '@/logic/design-context';
import { Hub } from '@/hub/hub';
import type { HubMove } from '@/hub/hub-scene';
import printer from '@/assets/printer.png';

type Dialog = 'hub' | 'settings' | 'notifications' | 'quick' | 'device' | 'later' | null;
function Brand({ welcome = false }: { welcome?: boolean }) {
  return <div className={`brand ${welcome ? 'welcome-brand' : ''}`} aria-label="S-IT Hub"><span>S-IT HUB</span><i className="brand-dot" /></div>;
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  const { t } = useDesign();
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), reduced ? 150 : 1700); return () => window.clearTimeout(timer); }, [reduced]);
  return <motion.div className="welcome-screen" initial={{ opacity: 1 }} exit={{ opacity: 0, y: reduced ? 0 : -18 }} transition={{ duration: 0.4 }}>
    <div className="welcome-content">
      <motion.div initial={{ opacity: 0, scale: reduced ? 1 : 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}><Brand welcome /></motion.div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}><Hub className="welcome-hub" move="wave" /></motion.div>
      <AnimatePresence mode="wait">{ready ? <motion.div key="ready" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><h1>{t('greeting')}<span>.</span></h1><p>{t('welcome')}</p><Button variant="hub" size="touch" onClick={onEnter}>{t('enter')}<ArrowRight className="directional" /></Button></motion.div> : <motion.div key="loading" exit={{ opacity: 0 }}><p>{t('loading')}</p><div className="loading-track" /></motion.div>}</AnimatePresence>
      <p className="welcome-hospital">{t('hospital')}<br />{t('tagline')}</p>
    </div>
  </motion.div>;
}

function PreviewDialog({ dialog, close, replay }: { dialog: Dialog; close: () => void; replay: () => void }) {
  const { t, theme, setTheme, language, setLanguage } = useDesign();
  const [move, setMove] = useState<HubMove>('idle');
  const reduced = useReducedMotion();
  useEffect(() => { if (move === 'idle' || move === 'quiet') return; const timer = window.setTimeout(() => setMove('idle'), 1800); return () => window.clearTimeout(timer); }, [move]);
  useEffect(() => { if (!dialog) return; const listener = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); }; document.addEventListener('keydown', listener); return () => document.removeEventListener('keydown', listener); }, [dialog, close]);
  const titles: Record<Exclude<Dialog, null>, CopyKey> = { hub: 'hubHello', settings: 'settings', notifications: 'notifications', quick: 'quick', device: 'details', later: 'sample' };
  if (!dialog) return null;
  return <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
    <motion.section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="modal" initial={{ y: reduced ? 0 : 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} onClick={event => event.stopPropagation()}>
      <Button variant="tool" size="tool" className="modal-close" aria-label={t('close')} onClick={close} autoFocus><X /></Button>
      {dialog === 'hub' && <Hub move={move} className="modal-hub" />}
      <h2 id="dialog-title">{t(titles[dialog])}</h2>
      {dialog === 'hub' && <><p>{t('hubPose')}</p><div className="pose-controls">{(['idle', 'wave', 'think', 'celebrate', 'quiet'] as HubMove[]).map(pose => <Button key={pose} variant={pose === move ? 'hub' : 'soft'} size="touch" onClick={() => setMove(pose)} aria-pressed={pose === move}>{t(pose)}</Button>)}</div><div className="dialog-notice">{t('hubDemo')}</div></>}
      {dialog === 'settings' && <><div className="settings-row"><label>{t('language')}</label><div className="segmented">{(['fr', 'ar', 'en'] as Language[]).map(lang => <Button key={lang} size="touch" variant={lang === language ? 'hub' : 'soft'} onClick={() => setLanguage(lang)} aria-pressed={lang === language}>{lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English'}</Button>)}</div></div><div className="settings-row"><label>{t('appearance')}</label><div className="segmented">{(['dark', 'light'] as const).map(mode => <Button key={mode} size="touch" variant={theme === mode ? 'hub' : 'soft'} onClick={() => setTheme(mode)} aria-pressed={theme === mode}>{t(mode)}</Button>)}</div></div><Button variant="soft" size="touch" className="mt-6" onClick={replay}><Sparkles />{t('replay')}</Button></>}
      {dialog === 'notifications' && <p>{t('noNotifications')}</p>}
      {dialog === 'quick' && <><p>{t('quickHint')}</p><div className="gallery-tools"><Button variant="soft" size="touch" disabled><Send />{t('send')}</Button><Button variant="soft" size="touch" disabled><ScanLine />{t('scan')}</Button></div><p>{t('notReady')}</p></>}
      {dialog === 'later' && <p>{t('notReady')}</p>}
      {dialog === 'device' && <><div className="detail-image"><img src={printer} width={1024} height={1024} alt={t('printer')} /></div><h3>{t('printer')}</h3><span className="status"><ShieldAlert />{t('critical')}</span>{([['inventory', 'INV-0402'], ['serial', 'DEMO-SN-0402'], ['department', t('critical')], ['company', 'Nimbus Service'], ['expected', t('previewDate')]] as [CopyKey, string][]).map(([key, value]) => <div className="detail-row" key={key}><span>{t(key)}</span><strong>{value}</strong></div>)}<div className="dialog-notice">{t('demo')} · {t('sample')}</div></>}
    </motion.section>
  </motion.div>;
}

function Header({ open }: { open: (dialog: Dialog) => void }) {
  const { t } = useDesign();
  return <header className="app-header"><Brand /><div className="header-center"><Building2 /><div>{t('hospital')}</div></div><div className="header-tools"><Button variant="tool" size="tool" aria-label={t('notifications')} title={t('notifications')} onClick={() => open('notifications')}><Bell /></Button><Button variant="tool" size="tool" aria-label={t('settings')} title={t('settings')} onClick={() => open('settings')}><Settings2 /></Button><div className="avatar" aria-label="ilhem letaief">IL</div></div></header>;
}

function BottomNav({ open }: { open: (dialog: Dialog) => void }) {
  const { t } = useDesign();
  return <nav className="bottom-nav" aria-label={t('workspace')}><Link to="/" className="nav-link active"><LayoutGrid /><span>{t('today')}</span></Link><Button variant="tool" className="nav-link" onClick={() => open('later')}><Monitor /><span>{t('devices')}</span></Button><Button variant="hub" size="tool" className="nav-plus" aria-label={t('quick')} onClick={() => open('quick')}><Plus /></Button><Button variant="tool" className="nav-link" onClick={() => open('later')}><Building2 /><span>{t('companies')}</span></Button><Button variant="tool" className="nav-link" onClick={() => open('later')}><FileText /><span>{t('papers')}</span></Button></nav>;
}

function Today({ open }: { open: (dialog: Dialog) => void }) {
  const { t } = useDesign();
  const reduced = useReducedMotion();
  const reveal = { initial: { opacity: 0, y: reduced ? 0 : 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
  return <main className="page">
    <motion.div {...reveal} className="greeting-row"><div><p className="eyebrow">{t('section')}</p><h1>{t('greeting')}<span>.</span></h1><p className="greeting-sub">{t('greetingEnd')}</p></div><div className="demo-label"><i />{t('demo')}</div></motion.div>
    <motion.div {...reveal} transition={{ delay: 0.1, duration: 0.5 }} className="overview">
      <section className="late-hero" aria-label={t('late')}><div className="hero-orbit" aria-hidden="true" /><Hub className="hero-mini-hub" /><div className="hero-top"><TriangleAlert />{t('lateLabel')}</div><div className="hero-count"><strong>02</strong><span>{t('late')}</span></div><p className="hero-hint">{t('lateHint')}</p><Button variant="hub" size="touch" onClick={() => document.getElementById('attention')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' })}>{t('viewLate')}<ArrowRight className="directional" /></Button></section>
      <section className="stat-group" aria-label={t('section')}><div className="stat"><div className="stat-icon"><Monitor />{t('away')}</div><strong>05</strong></div><div className="stat"><div className="stat-icon"><ArrowDownLeft />{t('week')}</div><strong>03</strong></div><div className="stat"><div className="stat-icon"><FileText />{t('files')}</div><strong>03</strong></div></section>
    </motion.div>
    <motion.div {...reveal} transition={{ delay: 0.2, duration: 0.5 }} className="content-grid"><section id="attention"><div className="section-heading"><h2>{t('attention')}</h2><Button variant="tool" onClick={() => open('later')} className="text-xs">{t('allDevices')}<ArrowRight className="directional" /></Button></div>
      <Button variant="ghost" className="device-card" onClick={() => open('device')}><div className="device-visual"><img src={printer} loading="lazy" width={1024} height={1024} alt="" /></div><div className="device-info"><h3>{t('printer')}</h3><p>INV-0402</p><span className="status"><ShieldAlert />{t('critical')}</span><p className="company-line"><Building2 />Nimbus Service</p></div><div className="device-end"><span>3 {t('daysLate')}</span><ChevronRight className="directional" /></div></Button>
      <Button variant="ghost" className="device-card" onClick={() => open('later')}><div className="device-visual"><Monitor /></div><div className="device-info"><h3>{t('monitor')}</h3><p>INV-0186</p><span className="status standard">{t('cardiology')}</span><p className="company-line"><Building2 />Zenith Repair</p></div><div className="device-end"><span>1 {t('dayLate')}</span><ChevronRight className="directional" /></div></Button>
      <section className="activity"><div className="activity-heading">{t('recent')}</div><div className="activity-line"><Check /><div><strong>{t('activity')}</strong><p>{t('activityDetail')}</p></div><time>{t('time')}</time></div></section>
    </section><aside><section className="hub-invite"><Hub move="wave" /><div><h2>{t('hubTitle')}</h2><p>{t('hubSubtitle')}</p><Button variant="soft" size="touch" onClick={() => open('hub')}>{t('hubButton')}<Sparkles /></Button></div></section><section className="quick-block"><h2>{t('quick')}</h2><p>{t('quickHint')}</p><div className="quick-actions"><Button variant="soft" size="touch" onClick={() => open('quick')}><Send />{t('newSend')}</Button><Button variant="soft" size="touch" onClick={() => open('quick')}><ScanLine />{t('newPaper')}</Button></div></section></aside></motion.div>
    <div className="footer-note"><Cloud />{t('sync')}</div>
  </main>;
}

function Gallery({ open }: { open: (dialog: Dialog) => void }) {
  const { t, theme, setTheme, language, setLanguage } = useDesign();
  return <main className="page gallery"><p className="eyebrow">S-IT HUB / 01</p><h1>{t('design')}</h1><div className="gallery-tools">{(['fr','ar','en'] as Language[]).map(lang => <Button key={lang} variant={language === lang ? 'hub' : 'soft'} size="touch" onClick={() => setLanguage(lang)}>{lang.toUpperCase()}</Button>)}<Button variant="soft" size="touch" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{t(theme === 'dark' ? 'light' : 'dark')}</Button><Button variant="soft" size="touch" asChild><Link to="/">{t('back')}</Link></Button></div>
    <section className="gallery-section"><h2>{t('colors')}</h2><div className="swatches">{['ink','surface','volt','red','green','gold'].map(color => <div className={`swatch ${color}`} key={color}>{color.toUpperCase()}</div>)}</div></section>
    <section className="gallery-section"><h2>{t('type')}</h2><div className="type-specimen">{t('tagline')}</div><p>{t('greetingEnd')}</p></section>
    <section className="gallery-section"><h2>{t('controls')}</h2><div className="gallery-tools"><Button variant="hub" size="touch" onClick={() => open('quick')}><Send />{t('send')}</Button><Button variant="soft" size="touch" onClick={() => open('quick')}><ScanLine />{t('scan')}</Button><Button variant="hub" size="touch" disabled>{t('disabled')}</Button><Button variant="tool" size="tool" aria-label={t('settings')} onClick={() => open('settings')}><Settings2 /></Button></div></section>
    <section className="gallery-section"><h2>{t('states')}</h2><div className="state-list"><span className="status"><TriangleAlert />{t('late')}</span><span className="status success"><Check />{t('success')}</span><span className="status due"><Cloud />{t('offline')}</span><span className="status standard"><Monitor />{t('waiting')}</span></div></section>
    <section className="gallery-section"><h2>Hub</h2><div className="gallery-hubs">{(['idle','wave','think','celebrate'] as HubMove[]).map(move => <div key={move}><Hub move={move} /><p>{t(move)}</p></div>)}</div><Button variant="hub" size="touch" onClick={() => open('hub')}>{t('hubButton')}</Button></section>
  </main>;
}

function PreviewContent({ gallery }: { gallery: boolean }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [welcome, setWelcome] = useState(!gallery);
  function replay() { setDialog(null); setWelcome(true); }
  return <><Header open={setDialog} />{gallery ? <Gallery open={setDialog} /> : <><Today open={setDialog} /><BottomNav open={setDialog} /></>}<AnimatePresence>{dialog && <PreviewDialog dialog={dialog} close={() => setDialog(null)} replay={replay} />}</AnimatePresence><AnimatePresence>{welcome && <Welcome onEnter={() => setWelcome(false)} />}</AnimatePresence></>;
}
export function DesignPreview({ gallery = false }: { gallery?: boolean }) { return <DesignProvider><PreviewContent gallery={gallery} /></DesignProvider>; }