import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  Cloud,
  FileText,
  LayoutGrid,
  Monitor,
  ScanLine,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesignProvider, useDesign, type CopyKey, type Language } from "@/logic/design-context";
import { Hub } from "@/hub/hub";
import type { HubMove } from "@/hub/hub-scene";
import { TodayScreen } from "@/components/hub/today-screen";
import { AutoLockControl, PinGate } from "@/components/hub/pin-gate";
import {
  DeviceDetailDialog,
  DeviceInventoryDialog,
  DeviceSendDialog,
} from "@/components/hub/device-workflow";
import {
  enrollLocalBiometric,
  readLockSettings,
  saveAutoLockMinutes,
  type LockSettings,
} from "@/logic/local-lock";
import { createAlertTriggers, playHospitalChime, SOUND_CHIMES } from "@/logic/audio";
import { awayList, useStore } from "@/logic/store";
import { CompanyList, PaperList } from "./record-lists";
import { AssistantPanel } from "./assistant-panel";
import { dueTomorrowReminders, withinQuietHours } from "@/logic/reminders";

type Dialog =
  | "hub"
  | "settings"
  | "notifications"
  | "quick"
  | "device"
  | "inventory"
  | "send"
  | "later"
  | "companies"
  | "papers"
  | "reminder"
  | null;
type LockMode = "setup" | "locked" | null;
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null; start: () => void; stop: () => void;
};
declare global { interface Window {
  SpeechRecognition?: { new (): SpeechRecognitionLike };
  webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
} }
function Brand({ welcome = false, onThank }: { welcome?: boolean; onThank?: () => void }) {
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => { if (hold.current) clearTimeout(hold.current); };
  useEffect(() => clear, []);
  return (
    <div className={`brand ${welcome ? "welcome-brand" : ""}`} aria-label="S-IT Hub" onPointerDown={() => { if (onThank) hold.current = setTimeout(onThank, 800); }} onPointerUp={clear} onPointerLeave={clear} onPointerCancel={clear} onDoubleClick={onThank}>
      <span>S-IT HUB</span>
      <i className="brand-dot" />
    </div>
  );
}

function SoundStudio({ enabled, onEnabledChange }: { enabled: boolean; onEnabledChange: (value: boolean) => void }) {
  const { t } = useDesign();
  const devices = useStore((state) => state.devices);
  const companies = useStore((state) => state.companies);
  const [selectedChime, setSelectedChime] = useState(0);
  const [volume, setVolume] = useState(52);

  const [lastPlayed, setLastPlayed] = useState<number | null>(null);

  const alerts = useMemo(
    () => createAlertTriggers(devices, companies).slice(0, 4),
    [companies, devices],
  );

  const handleChime = async () => {
    setLastPlayed(selectedChime);
    await playHospitalChime(selectedChime, volume / 100);
  };

  return (
    <div className="sound-studio-panel">
      <div className="settings-row">
        <label>{t("chime")}</label>
        <select
          className="auto-lock-select"
          value={selectedChime}
          onChange={(event) => setSelectedChime(Number(event.target.value))}
        >
          {SOUND_CHIMES.map((chime, index) => (
            <option key={chime.id} value={index}>
              {chime.name}
            </option>
          ))}
        </select>
      </div>
      <div className="settings-row">
        <label>{t("volume")}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label={t("volume")}
        />
      </div>
      <div className="hub-assistant-controls">
        <Button variant="hub" size="touch" onClick={() => void handleChime()}>
          {t("playChime")}
        </Button>
        <Button variant="soft" size="touch" onClick={() => onEnabledChange(!enabled)} aria-pressed={enabled}>
          {enabled ? t("remindersOff") : t("enableReminders")}
        </Button>
      </div>
      <div className="hub-voice-output">
        <strong>{t("reminderSchedule")}</strong>
        {alerts.length > 0 ? (
          <ul className="schedule-list">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <span>{alert.companyName}</span>
                <strong>{alert.daysUntil} {t("dayUnit")}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("reminderReady")}</p>
        )}
      </div>
      {lastPlayed !== null && (
        <p className="dialog-notice">
          {SOUND_CHIMES[lastPlayed]?.name} · {volume}%
        </p>
      )}
    </div>
  );
}

function Welcome({ onEnter }: { onEnter: () => void }) {
  const { t } = useDesign();
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), reduced ? 150 : 1700);
    return () => window.clearTimeout(timer);
  }, [reduced]);
  return (
    <motion.div
      className="welcome-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : -18 }}
      transition={{ duration: 0.4 }}
    >
      <div className="welcome-content">
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <Brand welcome />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          <Hub className="welcome-hub" move="wave" />
        </motion.div>
        <AnimatePresence mode="wait">
          {ready ? (
            <motion.div key="ready" initial={false} animate={{ opacity: 1, y: 0 }}>
              <h1>
                {t("greeting")}
                <span>.</span>
              </h1>
              <p>{t("welcome")}</p>
              <Button variant="hub" size="touch" onClick={onEnter}>
                {t("enter")}
                <ArrowRight className="directional" />
              </Button>
            </motion.div>
          ) : (
            <motion.div key="loading" exit={{ opacity: 0 }}>
              <p>{t("loading")}</p>
              <div className="loading-track" />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="welcome-hospital">
          {t("hospital")}
          <br />
          {t("tagline")}
        </p>
      </div>
    </motion.div>
  );
}

function PreviewDialog({
  dialog,
  close,
  replay,
  autoLockMinutes,
  onAutoLockChange,
  onLockSettingsChange,
  changePin,
  selectedDeviceId,
  notificationMessages,
  onOpenDevice,
  onOpenSend,
  remindersEnabled,
  onRemindersChange,
}: {
  remindersEnabled: boolean;
  onRemindersChange: (enabled: boolean) => void;
  dialog: Dialog;
  close: () => void;
  replay: () => void;
  autoLockMinutes: LockSettings["autoLockMinutes"] | undefined;
  onAutoLockChange: (minutes: LockSettings["autoLockMinutes"]) => void;
  onLockSettingsChange: (settings: LockSettings) => void;
  changePin: () => void;
  selectedDeviceId: string | null;
  notificationMessages: string[];
  onOpenDevice: (id: string) => void;
  onOpenSend: (id: string) => void;
}) {
  const { t, theme, setTheme, language, setLanguage } = useDesign();
  const [move, setMove] = useState<HubMove>("idle");
  const reduced = useReducedMotion();
  useEffect(() => {
    if (move === "idle" || move === "quiet") return;
    const timer = window.setTimeout(() => setMove("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [move]);
  useEffect(() => {
    if (!dialog) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [dialog, close]);
  const titles: Record<Exclude<Dialog, null>, CopyKey> = {
    hub: "hubHello",
    settings: "settings",
    notifications: "notifications",
    quick: "quick",
    device: "details",
    inventory: "inventory",
    send: "send",
    later: "sample",
    reminder: "reminderTitle",
    companies: "companies",
    papers: "papers",
  };
  if (!dialog) return null;
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="modal"
        initial={{ y: reduced ? 0 : 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          variant="tool"
          size="tool"
          className="modal-close"
          aria-label={t("close")}
          onClick={close}
          autoFocus
        >
          <X />
        </Button>
        <h2 id="dialog-title">{t(titles[dialog])}</h2>
        {dialog === "hub" && <AssistantPanel onOpenDevice={onOpenDevice} />}
        {dialog === "companies" && <CompanyList onOpenDevice={onOpenDevice} />}
        {dialog === "papers" && <PaperList onOpenDevice={onOpenDevice} />}
        {dialog === "settings" && (
          <>
            <div className="settings-row">
              <label>{t("language")}</label>
              <div className="segmented">
                {(["fr", "ar", "en"] as Language[]).map((lang) => (
                  <Button
                    key={lang}
                    size="touch"
                    variant={lang === language ? "hub" : "soft"}
                    onClick={() => setLanguage(lang)}
                    aria-pressed={lang === language}
                  >
                    {lang === "ar" ? "العربية" : lang === "fr" ? "Français" : "English"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <label>{t("appearance")}</label>
              <div className="segmented">
                {(["dark", "light"] as const).map((mode) => (
                  <Button
                    key={mode}
                    size="touch"
                    variant={theme === mode ? "hub" : "soft"}
                    onClick={() => setTheme(mode)}
                    aria-pressed={theme === mode}
                  >
                    {t(mode)}
                  </Button>
                ))}
              </div>
            </div>
            {autoLockMinutes !== undefined && (
              <div className="settings-row security-settings">
                <h3>{t("security")}</h3>
                <AutoLockControl
                  minutes={autoLockMinutes}
                  onChange={onAutoLockChange}
                  onBiometricChange={onLockSettingsChange}
                />
                <Button variant="soft" size="touch" onClick={changePin}>
                  {t("changePin")}
                </Button>
                <p>{t("pinPrivacyNote")}</p>
              </div>
            )}
            <Button variant="soft" size="touch" className="mt-6" onClick={replay}>
              <Sparkles />
              {t("replay")}
            </Button>
          </>
        )}
        {dialog === "notifications" && (
          <>
            <p className="dialog-notice">{t("soundStudioHint")}</p>
            {notificationMessages.length > 0 && (
              <div className="hub-voice-output">
                <strong>{t("reminderSchedule")}</strong>
                <ul className="schedule-list">
                  {notificationMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            )}
            <SoundStudio enabled={remindersEnabled} onEnabledChange={onRemindersChange} />
          </>
        )}
        {dialog === "inventory" && (
          <DeviceInventoryDialog
            onOpenDevice={onOpenDevice}
            onOpenSend={onOpenSend}
            onClose={close}
          />
        )}
        {dialog === "send" && <DeviceSendDialog deviceId={selectedDeviceId} onClose={close} />}
        {dialog === "device" && (
          <DeviceDetailDialog
            deviceId={selectedDeviceId}
            onOpenSend={onOpenSend}
            onClose={close}
          />
        )}
        {dialog === "quick" && (
          <>
            <p>{t("quickHint")}</p>
            <div className="gallery-tools">
              <Button variant="soft" size="touch" onClick={() => onOpenDevice(useStore.getState().devices.find(d => d.status === "service")?.id ?? "")} >
                <Send />
                {t("send")}
              </Button>
              <Button variant="soft" size="touch" disabled>
                <ScanLine />
                {t("scan")}
              </Button>
            </div>
            <p>{t("notReady")}</p>
          </>
        )}
        {dialog === "later" && <p>{t("notReady")}</p>}
        {dialog === "reminder" && (
          <>
            <p className="reminder-draft">{t("reminderDraft")}</p>
            <div className="dialog-notice">{t("reminderNotice")}</div>
          </>
        )}
      </motion.section>
    </motion.div>
  );
}

function Header({ open, onThank }: { open: (dialog: Dialog) => void; onThank: () => void }) {
  const { t } = useDesign();
  return (
    <header className="app-header">
      <Brand onThank={onThank} />
      <div className="header-center">
        <Building2 />
        <div>{t("hospital")}</div>
      </div>
      <div className="header-tools">
        <Button
          variant="tool"
          size="tool"
          aria-label={t("notifications")}
          title={t("notifications")}
          onClick={() => open("notifications")}
        >
          <Bell />
        </Button>
        <Button
          variant="tool"
          size="tool"
          aria-label={t("settings")}
          title={t("settings")}
          onClick={() => open("settings")}
        >
          <Settings2 />
        </Button>
        <div className="avatar" aria-label="ilhem letaief">
          IL
        </div>
      </div>
    </header>
  );
}

function BottomNav({ open }: { open: (dialog: Dialog) => void }) {
  const { t } = useDesign();
  return (
    <nav className="bottom-nav" aria-label={t("workspace")}>
      <Link to="/" className="nav-link active" data-hub-id="today-nav">
        <LayoutGrid aria-hidden="true" />
        <span>{t("today")}</span>
      </Link>
      <Button
        variant="tool"
        className="nav-link"
        onClick={() => open("inventory")}
        data-hub-id="devices-nav"
      >
        <Monitor aria-hidden="true" />
        <span>{t("devices")}</span>
      </Button>
      <Button
        variant="hub"
        size="tool"
        className="nav-hub"
        aria-label={t("hubButton")}
        onClick={() => open("hub")}
        data-hub-id="hub-action"
      >
        <Hub className="nav-hub-character" />
      </Button>
      <Button variant="tool" className="nav-link" onClick={() => open("companies")} data-hub-id="companies-nav">
        <Building2 aria-hidden="true" />
        <span>{t("companies")}</span>
      </Button>
      <Button variant="tool" className="nav-link" onClick={() => open("papers")} data-hub-id="paper-docs">
        <FileText aria-hidden="true" />
        <span>{t("papers")}</span>
      </Button>
    </nav>
  );
}

function Gallery({ open }: { open: (dialog: Dialog) => void }) {
  const { t, theme, setTheme, language, setLanguage } = useDesign();
  return (
    <main className="page gallery">
      <p className="eyebrow">S-IT HUB / 01</p>
      <h1>{t("design")}</h1>
      <div className="gallery-tools">
        {(["fr", "ar", "en"] as Language[]).map((lang) => (
          <Button
            key={lang}
            variant={language === lang ? "hub" : "soft"}
            size="touch"
            onClick={() => setLanguage(lang)}
          >
            {lang.toUpperCase()}
          </Button>
        ))}
        <Button
          variant="soft"
          size="touch"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {t(theme === "dark" ? "light" : "dark")}
        </Button>
        <Button variant="soft" size="touch" asChild>
          <Link to="/">{t("back")}</Link>
        </Button>
      </div>
      <section className="gallery-section">
        <h2>{t("colors")}</h2>
        <div className="swatches">
          {["ink", "surface", "volt", "red", "green", "gold"].map((color) => (
            <div className={`swatch ${color}`} key={color}>
              {color.toUpperCase()}
            </div>
          ))}
        </div>
      </section>
      <section className="gallery-section">
        <h2>{t("type")}</h2>
        <div className="type-specimen">{t("tagline")}</div>
        <p>{t("greetingEnd")}</p>
      </section>
      <section className="gallery-section">
        <h2>{t("controls")}</h2>
        <div className="gallery-tools">
          <Button variant="hub" size="touch" onClick={() => open("quick")}>
            <Send />
            {t("send")}
          </Button>
          <Button variant="soft" size="touch" onClick={() => open("quick")}>
            <ScanLine />
            {t("scan")}
          </Button>
          <Button variant="hub" size="touch" disabled>
            {t("disabled")}
          </Button>
          <Button
            variant="tool"
            size="tool"
            aria-label={t("settings")}
            onClick={() => open("settings")}
          >
            <Settings2 />
          </Button>
        </div>
      </section>
      <section className="gallery-section">
        <h2>{t("states")}</h2>
        <div className="state-list">
          <span className="status">
            <TriangleAlert />
            {t("late")}
          </span>
          <span className="status success">
            <Check />
            {t("success")}
          </span>
          <span className="status due">
            <Cloud />
            {t("offline")}
          </span>
          <span className="status standard">
            <Monitor />
            {t("waiting")}
          </span>
        </div>
      </section>
      <section className="gallery-section">
        <h2>Hub</h2>
        <div className="gallery-hubs">
          {(["idle", "wave", "think", "celebrate"] as HubMove[]).map((move) => (
            <div key={move}>
              <Hub move={move} />
              <p>{t(move)}</p>
            </div>
          ))}
        </div>
        <Button variant="hub" size="touch" onClick={() => open("hub")}>
          {t("hubButton")}
        </Button>
      </section>
    </main>
  );
}

function PreviewContent({ gallery }: { gallery: boolean }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(!gallery);
  const [lockMode, setLockMode] = useState<LockMode>(null);
  const [lockSettings, setLockSettings] = useState<LockSettings | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const { t } = useDesign();
  const [thank, setThank] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  useEffect(() => { setRemindersEnabled(localStorage.getItem("hub-reminders") === "true"); }, []);
  const [notificationMessages, setNotificationMessages] = useState<string[]>([]);
  const devices = useStore((state) => state.devices);
  const companies = useStore((state) => state.companies);
  const alerts = useMemo(() => createAlertTriggers(devices, companies).slice(0, 4), [companies, devices]);
  const lastActivity = useRef(0);
  function replay() {
    setDialog(null);
    setSelectedDeviceId(null);
    setWelcome(true);
  }
  function enterApp() {
    const savedSettings = readLockSettings();
    setLockSettings(savedSettings);
    setWelcome(false);
    setLockMode(savedSettings ? "locked" : "setup");
  }
  function unlock(settings: LockSettings) {
    setLockSettings(settings);
    setLockMode(null);
    setSessionActive(true);
    lastActivity.current = Date.now();
  }

  useEffect(() => {
    if (!sessionActive || lockMode !== null || !lockSettings) return;
    const duration = lockSettings.autoLockMinutes * 60_000;
    let timer: number;
    const lockIfExpired = () => {
      const remaining = duration - (Date.now() - lastActivity.current);
      if (remaining <= 0) {
        setLockMode("locked");
        setSessionActive(false);
        return;
      }
      timer = window.setTimeout(lockIfExpired, remaining);
    };
    const noteActivity = () => {
      lastActivity.current = Date.now();
      window.clearTimeout(timer);
      timer = window.setTimeout(lockIfExpired, duration);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") lockIfExpired();
    };
    noteActivity();
    window.addEventListener("pointerdown", noteActivity);
    window.addEventListener("keydown", noteActivity);
    window.addEventListener("touchstart", noteActivity);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", noteActivity);
      window.removeEventListener("keydown", noteActivity);
      window.removeEventListener("touchstart", noteActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lockMode, lockSettings, sessionActive]);

  useEffect(() => {
    if (!sessionActive || lockMode !== null || !remindersEnabled) return;
    const delivered = new Set<string>(JSON.parse(localStorage.getItem('hub-delivered') || '[]'));
    const check = () => {
      const now = new Date();
      if (withinQuietHours(now)) return;
      for (const alert of dueTomorrowReminders(devices, companies, now)) {
        if (delivered.has(alert.id)) continue;
        delivered.add(alert.id);
        localStorage.setItem('hub-delivered', JSON.stringify([...delivered]));
        const message = `${alert.device.inventory} · ${alert.company.name} · ${t('expected')}`;
        setNotificationMessages(messages => [message, ...messages].slice(0, 5));
        void playHospitalChime(0, 0.32);
      }
    };
    check();
    const timer = window.setInterval(check, 60_000);
    window.addEventListener('focus', check);
    return () => { clearInterval(timer); window.removeEventListener('focus', check); };
  }, [devices, companies, lockMode, sessionActive, remindersEnabled, t]);

  function changeAutoLock(minutes: LockSettings["autoLockMinutes"]) {
    const updated = saveAutoLockMinutes(minutes);
    setLockSettings(updated);
  }

  return (
    <>
      <Header open={setDialog} onThank={() => setThank(true)} />
      {gallery ? (
        <Gallery open={setDialog} />
      ) : (
        <>
          <TodayScreen
            open={setDialog}
            onOpenDevice={(deviceId) => {
              setSelectedDeviceId(deviceId);
              setDialog("device");
            }}
          />
          <BottomNav open={setDialog} />
        </>
      )}
      <AnimatePresence>
        {dialog && (
          <PreviewDialog
            remindersEnabled={remindersEnabled}
            onRemindersChange={enabled => { setRemindersEnabled(enabled); localStorage.setItem("hub-reminders", String(enabled)); }}
            dialog={dialog}
            close={() => {
              setDialog(null);
              setSelectedDeviceId(null);
            }}
            replay={replay}
            autoLockMinutes={lockSettings?.autoLockMinutes}
            onAutoLockChange={changeAutoLock}
            onLockSettingsChange={setLockSettings}
            changePin={() => {
              setDialog(null);
              setSelectedDeviceId(null);
              setSessionActive(false);
              setLockMode("setup");
            }}
            selectedDeviceId={selectedDeviceId}
            notificationMessages={notificationMessages}
            onOpenDevice={(deviceId) => {
              setSelectedDeviceId(deviceId);
              setDialog("device");
            }}
            onOpenSend={(deviceId) => {
              setSelectedDeviceId(deviceId);
              setDialog("send");
            }}
          />
        )}
      </AnimatePresence>
      {thank && <div className="thank-scene" role="dialog" aria-modal="true" aria-label={t('thank')}>
        <Button variant="tool" size="tool" className="modal-close" onClick={() => setThank(false)} aria-label={t('close')}><X /></Button>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>{t('thank')}<br />ilhem letaief.</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>{t('thankLine')}</motion.p>
        <Hub move="celebrate" className="welcome-hub" /><p>{t('authors')}</p>
      </div>}
      <AnimatePresence>{welcome && <Welcome onEnter={enterApp} />}</AnimatePresence>
      {lockMode && (
        <PinGate
          mode={lockMode}
          autoLockMinutes={lockSettings?.autoLockMinutes ?? 5}
          onComplete={unlock}
        />
      )}
    </>
  );
}
export function DesignPreview({ gallery = false }: { gallery?: boolean }) {
  return (
    <DesignProvider>
      <PreviewContent gallery={gallery} />
    </DesignProvider>
  );
}
