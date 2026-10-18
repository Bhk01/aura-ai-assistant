import { useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  ArrowRight,
  Check,
  FileDown,
  FileText,
  Monitor,
  Printer,
  Search,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesign } from "@/logic/design-context";
import type { Company, Device } from "@/logic/demo-data";
import { departmentOf, useStore } from "@/logic/store";
import { previewCsv } from "@/logic/csv-import";
import { formatDate, expectedReturn, isLate } from "@/logic/rules";

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").toLowerCase();
}

async function renderPdfDocument(title: string, lines: string[]) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  page.drawText(title, {
    x: 52,
    y: height - 72,
    size: 22,
    font: bold,
    color: rgb(0.29, 0.18, 0.48),
  });

  page.drawText("Hôpital Universitaire Sahloul de Sousse", {
    x: 52,
    y: height - 92,
    size: 10,
    font: font,
    color: rgb(0.18, 0.2, 0.24),
  });

  let cursorY = height - 124;
  for (const line of lines) {
    page.drawText(line, {
      x: 52,
      y: cursorY,
      size: 11,
      font: font,
      color: rgb(0.1, 0.12, 0.18),
    });
    cursorY -= 18;
  }

  page.drawText("Signature et cachet : ____________________", {
    x: 52,
    y: 56,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const bytes = await pdfDoc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFileName(title)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

type DeviceRecord = NonNullable<ReturnType<typeof useStore.getState>["devices"][number]>;

export async function generateDevicePdfs(device: DeviceRecord, company: Company, problem: string) {
  const baseLines = [
    `Type: ${device.type}`,
    `Marque: ${device.brand}`,
    `Inventaire: ${device.inventory}`,
    `N° série: ${device.serial}`,
    `Service: ${departmentOf(device).fr}`,
    `Prestataire: ${company.name}`,
    `Téléphone: ${company.phone}`,
    `Problème: ${problem || "Non précisé"}`,
    `Date: ${formatDate(new Date())}`,
  ];

  await renderPdfDocument("Bon de sortie", baseLines);

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
  }, [companies, devices, query, statusFilter]);

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

  return (
    <div className="inventory-panel">
      <div className="inventory-toolbar">
        <div className="inventory-search">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("inventory")}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <label className="inventory-import">
          <input type="file" accept=".csv,text/csv" onChange={importCsv} />
          <span>{t("csvImport")}</span>
        </label>
      </div>
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
      <div className="inventory-list">
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
                  onClick={() => {
                    markReturned(device.id);
                    onClose();
                  }}
                >
                  <Check aria-hidden="true" />
                  {t("markReturned")}
                </Button>}
              </div>
            </div>
          );
        })}
      </div>
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

  if (!device) return <p className="today-empty">{t("notReady")}</p>;

  const currentDevice: Device = device;
  const company = currentDevice.companyId ? companies.find((item) => item.id === currentDevice.companyId) : undefined;
  const expected = company && currentDevice.sentDate ? expectedReturn(new Date(currentDevice.sentDate), company.deadlineDays) : null;
  const associatedPapers = papers.filter((paper) => paper.deviceId === currentDevice.id);

  async function handlePdf(type: "dispatch" | "reception") {
    if (!company) return;
    const title = type === "dispatch" ? "Bon de sortie" : "PV de réception";
    const lines = [
      "Hôpital Universitaire Sahloul de Sousse",
      `Document: ${title}`,
      `Inventaire: ${currentDevice.inventory}`,
      `N° série: ${currentDevice.serial}`,
      `Marque: ${currentDevice.brand}`,
      `Département: ${departmentOf(currentDevice).fr}`,
      `Prestataire: ${company.name}`,
      `Téléphone: ${company.phone}`,
      `Problème: ${currentDevice.problem || "Aucun détail"}`,
      `Date: ${formatDate(new Date())}`,
    ];
    await renderPdfDocument(title, lines);
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
        {currentDevice.status === "away" && <Button variant="soft" size="touch" onClick={() => markReturned(currentDevice.id)}>
          <Check aria-hidden="true" />
          {t("markReturned")}
        </Button>}
      </div>
      <p className="dialog-notice">{t("pdfDraft")}</p>
      <div className="pdf-stack">
        <Button variant="soft" size="touch" onClick={() => void handlePdf("dispatch")} data-hub-id="paper-docs">
          <FileDown aria-hidden="true" />
          {t("dispatch")}
        </Button>
        <Button variant="soft" size="touch" onClick={() => void handlePdf("reception")} data-hub-id="paper-docs">
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

  if (!device) {
    return <p className="today-empty">{t("notReady")}</p>;
  }

  const currentDevice: Device = device;

  async function confirmSend(print = false) {
    if (!selectedCompanyId || saving) return;
    setSaving(true);
    const company = companies.find((item) => item.id === selectedCompanyId);
    send(currentDevice.id, selectedCompanyId, problem || "Diagnostic à confirmer");
    if (company && print) {
      await generateDevicePdfs(currentDevice, company, problem || "Diagnostic à confirmer");
    }
    onClose();
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
              <small>{company.contract === "warranty" ? "Garantie" : company.contract === "contract" ? "Contrat" : "Sans contrat"}</small>
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
