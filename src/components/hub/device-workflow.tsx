import { useEffect, useMemo, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import {
  ArrowRight,
  Camera,
  Check,
  FileDown,
  FileText,
  Monitor,
  Printer,
  Search,
  ShieldAlert,
  X,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesign } from "@/logic/design-context";
import type { CopyKey, Language } from "@/logic/design-context";
import type { Company, Device } from "@/logic/demo-data";
import { departmentOf, useStore } from "@/logic/store";
import { previewCsv } from "@/logic/csv-import";
import { formatDate, expectedReturn, isLate } from "@/logic/rules";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

type PdfCopy = {
  hospital: string;
  dispatchTitle: string;
  receptionTitle: string;
  inventory: string;
  serial: string;
  brand: string;
  type: string;
  typePrinter: string;
  typePc: string;
  typeMonitor: string;
  department: string;
  company: string;
  reason: string;
  sentDate: string;
  expectedReturnDate: string;
  returnDate: string;
  technicianNotes: string;
  responsibleSignature: string;
  carrierSignature: string;
  unspecified: string;
  noNotes: string;
};

function getPdfCopy(t: (key: CopyKey) => string): PdfCopy {
  return {
    hospital: t("hospital"),
    dispatchTitle: t("dispatch"),
    receptionTitle: t("reception"),
    inventory: t("inventory"),
    serial: t("serial"),
    brand: t("brand"),
    type: t("deviceType"),
    typePrinter: t("typePrinter"),
    typePc: t("typePc"),
    typeMonitor: t("typeMonitor"),
    department: t("department"),
    company: t("company"),
    reason: t("dispatchReason"),
    sentDate: t("sentDate"),
    expectedReturnDate: t("expectedReturnDate"),
    returnDate: t("returnDate"),
    technicianNotes: t("technicianNotes"),
    responsibleSignature: t("responsibleSignature"),
    carrierSignature: t("carrierSignature"),
    unspecified: t("unspecified"),
    noNotes: t("noNotes"),
  };
}

async function renderPdfDocument(title: string, lines: string[], signatures: string[], language: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create the document preview.");

  const rtl = language === "ar";
  const fontFamily = rtl ? '"Readex Pro Variable", sans-serif' : '"Inter Variable", sans-serif';
  await document.fonts.load(`32px ${fontFamily}`);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.direction = rtl ? "rtl" : "ltr";
  context.textAlign = rtl ? "right" : "left";
  context.textBaseline = "top";
  context.fillStyle = "#171423";

  const textX = rtl ? canvas.width - 100 : 100;
  context.font = `700 52px ${fontFamily}`;
  context.fillText(title, textX, 100);
  context.font = `400 28px ${fontFamily}`;
  context.fillStyle = "#514d5f";
  context.fillText(lines[0] ?? "", textX, 180);
  context.fillStyle = "#8b5cff";
  context.fillRect(100, 245, canvas.width - 200, 4);
  context.fillStyle = "#171423";

  let cursorY = 300;
  for (const line of lines.slice(1)) {
    context.font = `400 30px ${fontFamily}`;
    const words = line.split(/\s+/);
    let currentLine = "";
    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width > canvas.width - 200 && currentLine) {
        context.fillText(currentLine, textX, cursorY);
        cursorY += 44;
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) {
      context.fillText(currentLine, textX, cursorY);
      cursorY += 72;
    }
  }

  const boxY = 1430;
  const boxWidth = 490;
  const boxHeight = 205;
  const leftX = rtl ? canvas.width / 2 + 30 : 100;
  const rightX = rtl ? 100 : canvas.width / 2 + 30;
  [leftX, rightX].forEach((x) => {
    context.strokeStyle = "#c8c4d1";
    context.lineWidth = 2;
    context.strokeRect(x, boxY, boxWidth, boxHeight);
  });
  context.fillStyle = "#171423";
  context.font = `600 25px ${fontFamily}`;
  [signatures[0] ?? "", signatures[1] ?? ""].forEach((signature, index) => {
    const x = index === 0 ? leftX : rightX;
    const lines = signature.split(" / ");
    const labelX = rtl ? x + boxWidth - 20 : x + 20;
    context.fillText(lines[0] ?? "", labelX, boxY + 20, boxWidth - 40);
    if (lines[1]) context.fillText(lines[1], labelX, boxY + 54, boxWidth - 40);
  });
  context.strokeStyle = "#817c8c";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(leftX + 20, boxY + 155);
  context.lineTo(leftX + boxWidth - 20, boxY + 155);
  context.moveTo(rightX + 20, boxY + 155);
  context.lineTo(rightX + boxWidth - 20, boxY + 155);
  context.stroke();

  const encoded = canvas.toDataURL("image/png").split(",")[1];
  if (!encoded) throw new Error("Unable to encode the document preview.");
  const imageBytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  const image = await pdfDoc.embedPng(imageBytes);
  page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
  const bytes = await pdfDoc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(title) || "s-it-hub-document"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

type DeviceRecord = NonNullable<ReturnType<typeof useStore.getState>["devices"][number]>;

export async function generateDevicePdfs(
  device: DeviceRecord,
  company: Company,
  problem: string,
  copy: PdfCopy,
  language: Language,
  kind: "dispatch" | "reception" = "dispatch",
  dispatchDate?: Date,
) {
  const sentDate = device.sentDate ? new Date(device.sentDate) : dispatchDate ?? new Date();
  const lines = kind === "dispatch"
    ? [
        copy.hospital,
        `${copy.inventory}: ${device.inventory}`,
        `${copy.serial}: ${device.serial}`,
        `${copy.brand}: ${device.brand}`,
        `${copy.type}: ${device.type === "printer" ? copy.typePrinter : device.type === "pc" ? copy.typePc : copy.typeMonitor}`,
        `${copy.department}: ${departmentOf(device)[language]}`,
        `${copy.company}: ${company.name}`,
        `${copy.reason}: ${problem || copy.unspecified}`,
        `${copy.sentDate}: ${formatDate(sentDate)}`,
        `${copy.expectedReturnDate}: ${formatDate(expectedReturn(sentDate, company.deadlineDays))}`,
      ]
    : [
        copy.hospital,
        `${copy.inventory}: ${device.inventory}`,
        `${copy.serial}: ${device.serial}`,
        `${copy.brand}: ${device.brand}`,
        `${copy.type}: ${device.type === "printer" ? copy.typePrinter : device.type === "pc" ? copy.typePc : copy.typeMonitor}`,
        `${copy.department}: ${departmentOf(device)[language]}`,
        `${copy.company}: ${company.name}`,
        `${copy.returnDate}: ${device.returnedDate ? formatDate(new Date(device.returnedDate)) : formatDate(new Date())}`,
        `${copy.technicianNotes}: ${device.returnedNotes?.trim() || copy.noNotes}`,
      ];
  const title = kind === "dispatch" ? copy.dispatchTitle : copy.receptionTitle;
  await renderPdfDocument(
    title,
    lines,
    kind === "dispatch"
      ? [copy.responsibleSignature, copy.carrierSignature]
      : [copy.responsibleSignature, copy.technicianNotes],
    language,
  );
}

function localDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReturnReceiptForm({
  device,
  onCancel,
  onConfirm,
}: {
  device: Device;
  onCancel: () => void;
  onConfirm: (returnedAt: string, technicianNotes: string) => void;
}) {
  const { t } = useDesign();
  const [returnedAt, setReturnedAt] = useState(localDateInputValue);
  const [technicianNotes, setTechnicianNotes] = useState("");

  return (
    <section className="return-receipt-form" aria-labelledby="return-receipt-title">
      <div className="receipt-heading">
        <div>
          <h3 id="return-receipt-title">{t("receiptTitle")}</h3>
          <p>{device.inventory} · {device.brand}</p>
        </div>
        <Button variant="tool" size="tool" aria-label={t("cancel")} onClick={onCancel}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <label>
        {t("returnDate")}
        <input
          type="date"
          required
          value={returnedAt}
          onChange={(event) => setReturnedAt(event.target.value)}
        />
      </label>
      <label>
        {t("technicianNotes")}
        <textarea
          rows={3}
          value={technicianNotes}
          onChange={(event) => setTechnicianNotes(event.target.value)}
          placeholder={t("technicianNotes")}
        />
      </label>
      <small>{t("patientWarning")}</small>
      <div className="receipt-actions">
        <Button variant="soft" size="touch" onClick={onCancel}>{t("cancel")}</Button>
        <Button
          variant="hub"
          size="touch"
          disabled={!returnedAt}
          onClick={() => onConfirm(new Date(`${returnedAt}T12:00:00`).toISOString(), technicianNotes.trim())}
        >
          <Check aria-hidden="true" />
          {t("saveReceipt")}
        </Button>
      </div>
    </section>
  );
}

export function DeviceInventoryDialog({
  onOpenDevice,
  onOpenSend,
  onClose,
}: {
  onOpenDevice: (id: string) => void;
  onOpenSend: (id: string) => void;
  onClose: () => void;
}) {
  const { t, language } = useDesign();
  const devices = useStore((state) => state.devices);
  const companies = useStore((state) => state.companies);
  const markReturned = useStore((state) => state.markReturned);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "service" | "away">("all");
  const [importMessage, setImportMessage] = useState("");
  const [importPreview, setImportPreview] = useState<ReturnType<typeof previewCsv> | null>(null);
  const [returnDeviceId, setReturnDeviceId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [scannerMessage, setScannerMessage] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return devices.filter((device) => {
      const matchesStatus = statusFilter === "all" || device.status === statusFilter;
      const matchesText =
        !term ||
        device.inventory.toLowerCase().includes(term) ||
        device.serial.toLowerCase().includes(term) ||
        device.brand.toLowerCase().includes(term) ||
        device.type.toLowerCase().includes(term) ||
        t(device.type === "printer" ? "typePrinter" : device.type === "pc" ? "typePc" : "typeMonitor").toLowerCase().includes(term) ||
        departmentOf(device).fr.toLowerCase().includes(term) ||
        departmentOf(device).en.toLowerCase().includes(term) ||
        departmentOf(device).ar.toLowerCase().includes(term) ||
        (device.companyId &&
          companies.find((company) => company.id === device.companyId)?.name.toLowerCase().includes(term));
      return matchesStatus && matchesText;
    });
  }, [companies, devices, query, statusFilter, t]);

  useEffect(() => {
    if (!cameraStream) return;
    const video = videoRef.current;
    if (!video) return;
    const Detector = (window as Window & {
      BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
      };
    }).BarcodeDetector;
    if (!Detector) {
      setCameraStream(null);
      setScannerMessage(t("scannerUnavailable"));
      searchInputRef.current?.focus();
      return;
    }

    let detector: InstanceType<typeof Detector>;
    try {
      detector = new Detector({ formats: ["qr_code", "code_128", "code_39"] });
    } catch {
      setCameraStream(null);
      setScannerMessage(t("scannerUnavailable"));
      searchInputRef.current?.focus();
      return;
    }
    let stopped = false;
    let timer: number | undefined;
    video.srcObject = cameraStream;
    void video.play().then(async () => {
      while (!stopped) {
        try {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(video);
            const inventoryCode = codes
              .map((code) => code.rawValue.trim())
              .find((value) => /^INV-[A-Z0-9-]+$/i.test(value));
            if (inventoryCode) {
              setQuery(inventoryCode.toUpperCase());
              setScannerMessage(t("scannerFound"));
              setCameraStream(null);
              return;
            }
          }
        } catch {
          setCameraStream(null);
          setScannerMessage(t("scannerUnavailable"));
          searchInputRef.current?.focus();
          return;
        }
        await new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, 300);
        });
      }
    }).catch(() => {
      setCameraStream(null);
      setScannerMessage(t("scannerUnavailable"));
      searchInputRef.current?.focus();
    });

    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      cameraStream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [cameraStream, t]);

  async function startCameraScan() {
    setScannerMessage("");
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
    const Detector = (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector;
    if (
      !isMobile ||
      !navigator.mediaDevices?.getUserMedia ||
      !Detector
    ) {
      setScannerMessage(t("scannerSearchFallback"));
      searchInputRef.current?.focus();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      setCameraStream(stream);
    } catch {
      setScannerMessage(t("scannerPermissionDenied"));
      searchInputRef.current?.focus();
    }
  }

  function importCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      try { setImportPreview(previewCsv(text, devices)); setImportMessage(''); }
      catch { setImportMessage(t('csvInvalid')); setImportPreview(null); }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  const returnDevice = devices.find((device) => device.id === returnDeviceId);

  return (
    <div className="inventory-panel">
      <div className="inventory-toolbar">
        <div className="inventory-search">
          <Search aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("inventory")}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <Button variant="soft" size="tool" aria-label={t("scanBarcode")} onClick={() => void startCameraScan()}>
          <Camera aria-hidden="true" />
        </Button>
        <label className="inventory-import">
          <input type="file" accept=".csv,text/csv" onChange={importCsv} />
          <span>{t("csvImport")}</span>
        </label>
      </div>
      {scannerMessage && <div className="dialog-notice" role="status">{scannerMessage}</div>}
      {cameraStream && (
        <div className="barcode-camera">
          <video ref={videoRef} autoPlay muted playsInline aria-label={t("scannerSearching")} />
          <p>{t("scannerSearching")}</p>
          <Button variant="soft" size="touch" onClick={() => setCameraStream(null)}>
            <X aria-hidden="true" />
            {t("cancel")}
          </Button>
        </div>
      )}
      <div className="inventory-filters">
        {(["all", "service", "away"] as const).map((filter) => (
          <Button variant="soft" size="touch"
            key={filter}
            type="button"
            className={statusFilter === filter ? "filter-chip active" : "filter-chip"}
            onClick={() => setStatusFilter(filter)}
          >
            {filter === "all" ? t("allDevices") : filter === "away" ? t("away") : t("inService")}
          </Button>
        ))}
      </div>
      {importMessage && <div className="dialog-notice">{importMessage}</div>}
      {importPreview && <div className="csv-review"><p>{t('csvPreview')}: {importPreview.added} / {importPreview.changed}</p>
        <Button variant="hub" size="touch" onClick={() => { useStore.getState().importDevices(importPreview.records); setImportPreview(null); }}>{t('confirm')}</Button>
        <Button variant="soft" size="touch" onClick={() => setImportPreview(null)}>{t('cancel')}</Button></div>}
      {returnDevice ? (
        <ReturnReceiptForm
          device={returnDevice}
          onCancel={() => setReturnDeviceId(null)}
          onConfirm={(returnedAt, notes) => {
            markReturned(returnDevice.id, returnedAt, notes);
            setReturnDeviceId(null);
            onClose();
          }}
        />
      ) : <div className="inventory-list">
        {!filtered.length && <p>{t('noResults')}</p>}
        {filtered.map((device) => {
          const dept = departmentOf(device);
          return (
            <div key={device.id} className="inventory-row">
              <Button variant="soft" type="button" className="inventory-card" onClick={() => onOpenDevice(device.id)}>
                <div className="inventory-visual">
                  {device.type === "printer" ? <Printer aria-hidden="true" /> : <Monitor aria-hidden="true" />}
                </div>
                <div className="inventory-copy">
                  <strong>{device.brand}</strong>
                  <span>{device.inventory}</span>
                  <small>{device.serial}</small>
                </div>
                <div className="inventory-meta">
                  <span className={device.status === "away" ? "status critical-status" : "status due"}>
                    {dept[language]}
                  </span>
                  <em>{device.status === "away" ? t("away") : t("inService")}</em>
                </div>
              </Button>
              <div className="inventory-actions">
                {device.status === "service" && <Button variant="soft" size="touch" onClick={() => onOpenSend(device.id)} data-hub-id="device-send">
                  <Wrench aria-hidden="true" />
                  {t("send")}
                </Button>}
                {device.status === "away" && <Button
                  variant="hub"
                  size="touch"
                  onClick={() => setReturnDeviceId(device.id)}
                >
                  <Check aria-hidden="true" />
                  {t("markReturned")}
                </Button>}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

export function DeviceDetailDialog({
  deviceId,
  onOpenSend,
  onClose,
}: {
  deviceId: string | null;
  onOpenSend: (id: string) => void;
  onClose: () => void;
}) {
  const { t, language } = useDesign();
  const device = useStore((state) => state.devices.find((item) => item.id === deviceId) ?? null);
  const companies = useStore((state) => state.companies);
  const papers = useStore((state) => state.papers);
  const markReturned = useStore((state) => state.markReturned);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [documentError, setDocumentError] = useState("");

  if (!device) return <p className="today-empty">{t("notReady")}</p>;

  const currentDevice: Device = device;
  const company = currentDevice.companyId ? companies.find((item) => item.id === currentDevice.companyId) : undefined;
  const expected = company && currentDevice.sentDate ? expectedReturn(new Date(currentDevice.sentDate), company.deadlineDays) : null;
  const associatedPapers = papers.filter((paper) => paper.deviceId === currentDevice.id);

  async function handlePdf(type: "dispatch" | "reception") {
    if (!company) return;
    setDocumentError("");
    try {
      await generateDevicePdfs(
        currentDevice,
        company,
        currentDevice.problem ?? "",
        getPdfCopy(t),
        language,
        type,
      );
    } catch {
      setDocumentError(t("pdfFailed"));
    }
  }

  return (
    <div className="device-detail-panel">
      <div className="detail-image">
        {currentDevice.type === "printer" ? <Printer aria-hidden="true" /> : <Monitor aria-hidden="true" />}
      </div>
      <h3>{currentDevice.brand}</h3>
      <span className="status">
        <ShieldAlert aria-hidden="true" />
        {currentDevice.status === "away" ? t(expected && isLate(expected) ? "late" : "away") : t("inService")}
      </span>
      {([
        ["inventory", currentDevice.inventory],
        ["serial", currentDevice.serial],
        ["department", departmentOf(currentDevice)[language]],
        ["company", company?.name ?? "—"],
        ["expected", expected ? formatDate(expected) : "—"],
      ] as const).map(([key, value]) => (
        <div className="detail-row" key={String(key)}>
          <span>{t(key)}</span>
          <strong>{String(value)}</strong>
        </div>
      ))}
      <div className="device-detail-actions">
        {currentDevice.status === "service" && <Button variant="hub" size="touch" onClick={() => onOpenSend(currentDevice.id)} data-hub-id="device-send">
          <Wrench aria-hidden="true" />
          {t("send")}
        </Button>}
        {currentDevice.status === "away" && <Button variant="soft" size="touch" onClick={() => setShowReceiptForm(true)}>
          <Check aria-hidden="true" />
          {t("markReturned")}
        </Button>}
      </div>
      {showReceiptForm && (
        <ReturnReceiptForm
          device={currentDevice}
          onCancel={() => setShowReceiptForm(false)}
          onConfirm={(returnedAt, notes) => {
            markReturned(currentDevice.id, returnedAt, notes);
            setShowReceiptForm(false);
          }}
        />
      )}
      {documentError && <p className="pin-error" role="alert">{documentError}</p>}
      <p className="dialog-notice">{t("pdfDraft")}</p>
      <div className="pdf-stack">
        <Button variant="soft" size="touch" disabled={!company} onClick={() => void handlePdf("dispatch")} data-hub-id="paper-docs">
          <FileDown aria-hidden="true" />
          {t("dispatch")}
        </Button>
        <Button variant="soft" size="touch" disabled={!company || !currentDevice.returnedDate} onClick={() => void handlePdf("reception")} data-hub-id="paper-docs">
          <FileText aria-hidden="true" />
          {t("reception")}
        </Button>
      </div>
      <div className="detail-row-block">
        <span>{t("papers")}</span>
        {associatedPapers.length > 0 ? (
          <ul className="docs-list">
            {associatedPapers.map((paper) => (
              <li key={paper.id}>{t(paper.kind)}</li>
            ))}
          </ul>
        ) : (
          <strong>{t("noPapers")}</strong>
        )}
      </div>
      <Button variant="tool" size="tool" className="back-button" onClick={onClose}>
        <ArrowRight aria-hidden="true" />
        {t("back")}
      </Button>
    </div>
  );
}

export function DeviceSendDialog({
  deviceId,
  onClose,
}: {
  deviceId: string | null;
  onClose: () => void;
}) {
  const { t, language } = useDesign();
  const device = useStore((state) => state.devices.find((item) => item.id === deviceId) ?? null);
  const companies = useStore((state) => state.companies);
  const send = useStore((state) => state.send);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id ?? "");
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  if (!device) {
    return <p className="today-empty">{t("notReady")}</p>;
  }

  const currentDevice: Device = device;

  async function confirmSend(print = false) {
    if (!selectedCompanyId || saving) return;
    setSaving(true);
    const company = companies.find((item) => item.id === selectedCompanyId);
    const sentAt = new Date();
    const finalProblem = problem.trim() || t("diagnosticToConfirm");
    try {
      if (company && print) {
        await generateDevicePdfs(
          currentDevice,
          company,
          finalProblem,
          getPdfCopy(t),
          language,
          "dispatch",
          sentAt,
        );
      }
      send(currentDevice.id, selectedCompanyId, finalProblem, sentAt.toISOString());
      onClose();
    } catch {
      setActionError(t("pdfFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="send-sheet">
      <div className="send-stepper">
        <span className={step === 0 ? "step-pill active" : "step-pill"}>1. {t("selection")}</span>
        <span className={step === 1 ? "step-pill active" : "step-pill"}>2. {t("vendor")}</span>
        <span className={step === 2 ? "step-pill active" : "step-pill"}>3. {t("review")}</span>
      </div>
      {step === 0 && (
        <>
          <h3>{currentDevice.brand}</h3>
          <div className="detail-row">
            <span>{t("inventory")}</span>
            <strong>{currentDevice.inventory}</strong>
          </div>
          <div className="detail-row">
            <span>{t("serial")}</span>
            <strong>{currentDevice.serial}</strong>
          </div>
          <Button variant="hub" size="touch" onClick={() => setStep(1)}>
            {t("next")}
            <ArrowRight aria-hidden="true" />
          </Button>
        </>
      )}
      {step === 1 && (
        <div className="vendor-list">
          {companies.map((company) => (
            <Button variant="soft"
              key={company.id}
              type="button"
              className={selectedCompanyId === company.id ? "vendor-card active" : "vendor-card"}
              onClick={() => {
                setSelectedCompanyId(company.id);
                setStep(2);
              }}
            >
              <strong>{company.name}</strong>
              <span>{company.deadlineDays} {t("dayUnit")}</span>
              <small>{company.contract === "warranty" ? t("warranty") : company.contract === "contract" ? t("contract") : t("noContract")}</small>
            </Button>
          ))}
        </div>
      )}
      {step === 2 && (
        <>
          <div className="detail-row">
            <span>{t("company")}</span>
            <strong>{companies.find((company) => company.id === selectedCompanyId)?.name}</strong>
          </div>
          <label className="problem-wrap">
            <span>{t("problem")}</span>
            <textarea
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder={t("problem")}
              rows={6}
            />
          </label>
          <small className="text-muted-foreground">{t('patientWarning')}</small>
          <div className="detail-row"><span>{t('expected')}</span><strong>{formatDate(expectedReturn(new Date(), companies.find(c => c.id === selectedCompanyId)?.deadlineDays ?? 0))}</strong></div>
          <p className="dialog-notice">{t('pdfDraft')}</p>
          {actionError && <p className="pin-error" role="alert">{actionError}</p>}
          <div className="device-detail-actions">
            <Button variant="soft" size="touch" onClick={() => setStep(1)}>
              {t("back")}
            </Button>
            <Button variant="hub" size="touch" disabled={saving} onClick={() => void confirmSend()}>
              <FileText aria-hidden="true" />
              {t("saveOnly")}
            </Button>
            <Button variant="soft" size="touch" disabled={saving} onClick={() => void confirmSend(true)}>{t("savePrint")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
