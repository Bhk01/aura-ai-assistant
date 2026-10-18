import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import {
  ArrowDownLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  Monitor,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesign } from "@/logic/design-context";
import { departmentOf, awayList, useStore, type AwayItem } from "@/logic/store";
import { formatDate } from "@/logic/rules";
import { Hub } from "@/hub/hub";
import { ReturnReceiptForm } from "@/components/hub/device-workflow";
import printer from "@/assets/printer.png";

type Dialog =
  "hub" | "settings" | "notifications" | "quick" | "device" | "later" | "reminder" | null;

function isReturningThisWeek(item: AwayItem, today: Date) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return !item.late && item.expected >= start && item.expected < end;
}

function SwipeCard({
  item,
  onReturned,
  onRemind,
  onOpen,
}: {
  item: AwayItem;
  onReturned: (id: string) => void;
  onRemind: () => void;
  onOpen: () => void;
}) {
  const { t, language } = useDesign();
  const x = useMotionValue(0);
  const reduced = useReducedMotion();
  const department = departmentOf(item.device);
  const departmentName = department[language];
  const inventoryLabel = `${t("inventory")} ${item.device.inventory}`;

  function finishSwipe(offset: number) {
    if (offset > 80) {
      onReturned(item.device.id);
    } else if (offset < -80) {
      onRemind();
      animate(x, 0, { type: "spring", stiffness: 300, damping: 22 });
    } else {
      animate(x, 0, { duration: reduced ? 0.15 : 0.28 });
    }
  }

  return (
    <div className={`swipe-track ${department.critical ? "swipe-track-critical" : ""}`}>
      <div className="swipe-hint swipe-hint-return">
        <Check aria-hidden="true" />
        <span>{t("swipeReturned")}</span>
      </div>
      <div className="swipe-hint swipe-hint-remind">
        <span>{t("swipeRemind")}</span>
        <ArrowDownLeft aria-hidden="true" />
      </div>
      <motion.article
        className="device-card"
        drag="x"
        dragConstraints={{ left: -94, right: 94 }}
        dragElastic={0.12}
        dragMomentum={false}
        onDragEnd={(_, info) => finishSwipe(info.offset.x)}
        style={{ x }}
      >
        <button
          className="device-card-main"
          type="button"
          onClick={onOpen}
          aria-label={inventoryLabel}
        >
          <div className="device-visual">
            {item.device.type === "printer" ? (
              <img src={printer} loading="lazy" width={1024} height={1024} alt="" />
            ) : (
              <Monitor aria-hidden="true" />
            )}
          </div>
          <div className="device-info">
            <h3>{item.device.brand}</h3>
            <p>{item.device.inventory}</p>
            <span
              className={`status ${item.late ? "" : "due"} ${department.critical ? "critical-status" : ""}`}
            >
              {department.critical ? (
                <ShieldAlert aria-hidden="true" />
              ) : (
                <TriangleAlert aria-hidden="true" />
              )}
              {departmentName}
            </span>
            <p className="company-line">
              <Building2 aria-hidden="true" />
              {item.company.name}
            </p>
          </div>
          <div className="device-end">
            <span>
              {item.late
                ? `${item.daysLate} ${item.daysLate === 1 ? t("dayLate") : t("daysLate")}`
                : `${t("expected")} ${formatDate(item.expected)}`}
            </span>
            <ChevronRight className="directional" aria-hidden="true" />
          </div>
        </button>
        <div className="device-card-actions">
          <Button
            variant="tool"
            size="tool"
            aria-label={`${t("markReturned")}: ${item.device.inventory}`}
            onClick={() => onReturned(item.device.id)}
          >
            <Check aria-hidden="true" />
          </Button>
          <Button
            variant="tool"
            size="tool"
            aria-label={`${t("swipeRemind")}: ${item.company.name}`}
            onClick={onRemind}
          >
            <ArrowDownLeft aria-hidden="true" />
          </Button>
        </div>
      </motion.article>
    </div>
  );
}

export function TodayScreen({
  open,
  onOpenDevice,
}: {
  open: (dialog: Dialog) => void;
  onOpenDevice?: (deviceId: string) => void;
}) {
  const { t } = useDesign();
  const devices = useStore((state) => state.devices);
  const companies = useStore((state) => state.companies);
  const papers = useStore((state) => state.papers);
  const markReturned = useStore((state) => state.markReturned);
  const undoReturned = useStore((state) => state.undoReturned);
  const today = new Date();
  const away = awayList(devices, companies, today);
  const overdue = away.filter((item) => item.late);
  const criticalLate = overdue.filter((item) => item.critical);
  const otherLate = overdue.filter((item) => !item.critical);
  const dueSoon = away.filter((item) => isReturningThisWeek(item, today));
  const heroRef = useRef<HTMLElement>(null);
  const heroVisible = useInView(heroRef, { amount: 0.1, initial: true });
  const reduced = useReducedMotion();
  const count = useMotionValue(0);
  const [countText, setCountText] = useState("00");
  const [undoId, setUndoId] = useState<string | null>(null);
  const [returnDeviceId, setReturnDeviceId] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const returnDevice = devices.find((device) => device.id === returnDeviceId) ?? null;

  useEffect(() => {
    const controls = animate(count, overdue.length, {
      duration: reduced ? 0.15 : 0.8,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [count, overdue.length, reduced]);
  useMotionValueEvent(count, "change", (value) =>
    setCountText(String(Math.round(value)).padStart(2, "0")),
  );

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  function handleReturned(id: string, returnedAt: string, notes: string) {
    window.clearTimeout(undoTimer.current);
    markReturned(id, returnedAt, notes);
    setUndoId(id);
    undoTimer.current = window.setTimeout(() => setUndoId(null), 6000);
  }

  function handleUndo() {
    if (!undoId) return;
    undoReturned(undoId);
    window.clearTimeout(undoTimer.current);
    setUndoId(null);
  }

  function requestReturn(id: string) {
    setReturnDeviceId(id);
  }

  function renderGroup(title: string, items: AwayItem[], emptyText?: string) {
    if (items.length === 0 && !emptyText) return null;
    return (
      <section className="today-section" aria-label={title}>
        <div className="section-heading">
          <h2>{title}</h2>
          {items.length > 0 && (
            <span className="today-group-count">{String(items.length).padStart(2, "0")}</span>
          )}
        </div>
        {items.length > 0 ? (
          items.map((item) => (
            <SwipeCard
              key={item.device.id}
              item={item}
              onReturned={requestReturn}
              onRemind={() => open("reminder")}
              onOpen={() => {
                if (onOpenDevice) onOpenDevice(item.device.id);
                else open("device");
              }}
            />
          ))
        ) : (
          <p className="today-empty">{emptyText}</p>
        )}
      </section>
    );
  }

  return (
    <>
      <AnimatePresence>
        {!heroVisible && (
          <motion.div
            className="sticky-late-count"
            initial={{ y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -48, opacity: 0 }}
          >
            <span>{t("stickyLate")}</span>
            <strong>{countText}</strong>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="page">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="greeting-row"
          data-hub-id="today-hero"
        >
          <div>
            <p className="eyebrow">{t("section")}</p>
            <h1>
              {t("greeting")}
              <span>.</span>
            </h1>
            <p className="greeting-sub">{t("greetingEnd")}</p>
          </div>
          <div className="demo-label">
            <i />
            {t("demo")}
          </div>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="overview"
        >
          <section
            ref={heroRef}
            className={`late-hero ${overdue.length === 0 ? "late-hero-clear" : ""}`}
            aria-label={t("late")}
          >
            <div className="hero-orbit" aria-hidden="true" />
            <Hub className="hero-mini-hub" move={overdue.length === 0 ? "celebrate" : "idle"} />
            {overdue.length === 0 ? (
              <div className="all-clear" role="status">
                <span className="hero-top">
                  <CircleCheck aria-hidden="true" />
                  {t("allClear")}
                </span>
                <strong aria-label={t("noOverdue")}>00</strong>
                <p>{t("noOverdue")}</p>
                <div className="all-clear-particles" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            ) : (
              <>
                <div className="hero-top">
                  <TriangleAlert aria-hidden="true" />
                  {t("lateLabel")}
                </div>
                <div className="hero-count">
                  <motion.strong>{countText}</motion.strong>
                  <span>{t("late")}</span>
                </div>
                <p className="hero-hint">{t("lateHint")}</p>
                <Button
                  variant="hub"
                  size="touch"
                  onClick={() =>
                    document.getElementById("critical-late")?.scrollIntoView({
                      behavior: reduced ? "instant" : "smooth",
                      block: "center",
                    })
                  }
                >
                  {t("viewLate")}
                  <ArrowRight className="directional" />
                </Button>
              </>
            )}
          </section>
          <section className="stat-group" aria-label={t("section")}>
            <div className="stat">
              <div className="stat-icon">
                <Monitor aria-hidden="true" />
                {t("away")}
              </div>
              <strong>{String(away.length).padStart(2, "0")}</strong>
            </div>
            <div className="stat">
              <div className="stat-icon">
                <ArrowDownLeft aria-hidden="true" />
                {t("week")}
              </div>
              <strong>{String(dueSoon.length).padStart(2, "0")}</strong>
            </div>
            <div className="stat">
              <div className="stat-icon">
                <FileText aria-hidden="true" />
                {t("files")}
              </div>
              <strong>{String(papers.length).padStart(2, "0")}</strong>
            </div>
          </section>
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="content-grid"
        >
          <div id="critical-late">
            {renderGroup(t("criticalLate"), criticalLate, t("noCriticalLate"))}
            {renderGroup(t("otherLate"), otherLate)}
            {renderGroup(t("returnsThisWeek"), dueSoon, t("noReturnsThisWeek"))}
            {overdue.length === 0 && (
              <div className="today-empty-state">
                <Sparkles aria-hidden="true" />
                <span>{t("noOverdue")}</span>
              </div>
            )}
          </div>
          <aside>
            <section className="hub-invite">
              <Hub move="wave" />
              <div>
                <h2>{t("hubTitle")}</h2>
                <p>{t("hubSubtitle")}</p>
                <Button variant="soft" size="touch" onClick={() => open("hub")}>
                  {t("hubButton")}
                  <Sparkles aria-hidden="true" />
                </Button>
              </div>
            </section>
            <section className="quick-block">
              <h2>{t("quick")}</h2>
              <p>{t("quickHint")}</p>
              <div className="quick-actions">
                <Button variant="soft" size="touch" onClick={() => open("quick")}>
                  {t("newSend")}
                </Button>
                <Button variant="soft" size="touch" onClick={() => open("quick")}>
                  {t("newPaper")}
                </Button>
              </div>
            </section>
          </aside>
        </motion.div>
        <div className="footer-note">
          <span aria-hidden="true">●</span>
          {t("sync")}
        </div>
        <AnimatePresence>
          {undoId && (
            <motion.div
              className="undo-toast"
              role="status"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
            >
              <Check aria-hidden="true" />
              <span>{t("returnedSaved")}</span>
              <Button variant="soft" size="touch" onClick={handleUndo}>
                <Undo2 aria-hidden="true" />
                {t("undo")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {returnDevice && (
        <div className="modal-backdrop receipt-backdrop">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="return-receipt-title">
            <ReturnReceiptForm
              device={returnDevice}
              onCancel={() => setReturnDeviceId(null)}
              onConfirm={(returnedAt, notes) => {
                handleReturned(returnDevice.id, returnedAt, notes);
                setReturnDeviceId(null);
              }}
            />
          </section>
        </div>
      )}
    </>
  );
}
