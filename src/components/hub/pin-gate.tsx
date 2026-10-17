import { useEffect, useState } from "react";
import { Fingerprint, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDesign } from "@/logic/design-context";
import {
  AUTO_LOCK_OPTIONS,
  authenticateLocalBiometric,
  clearLocalBiometric,
  enrollLocalBiometric,
  isLocalBiometricAvailable,
  isAutoLockMinutes,
  readLockSettings,
  savePin,
  verifyPin,
  type LockSettings,
} from "@/logic/local-lock";

type LockMode = "setup" | "locked";

export function PinGate({
  mode,
  onComplete,
  autoLockMinutes,
}: {
  mode: LockMode;
  onComplete: (settings: LockSettings) => void;
  autoLockMinutes: LockSettings["autoLockMinutes"];
}) {
  const { t } = useDesign();
  const [stage, setStage] = useState<"enter" | "confirm">(mode === "setup" ? "enter" : "confirm");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);

  useEffect(() => {
    if (mode !== "locked") return;
    let active = true;
    try {
      setBiometricReady(Boolean(readLockSettings()?.biometricCredentialId));
    } catch (cause) {
      setError(`${t("lockError")} ${cause instanceof Error ? cause.message : String(cause)}`);
    }
    void isLocalBiometricAvailable()
      .then((available) => {
        if (active && !available) setBiometricReady(false);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(`${t("lockError")} ${cause instanceof Error ? cause.message : String(cause)}`);
        }
      });
    return () => {
      active = false;
    };
  }, [mode, t]);

  async function submitPin() {
    setError("");
    if (!/^\d{6}$/.test(pin)) {
      setError(t("pinInvalid"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "setup" && stage === "enter") {
        setFirstPin(pin);
        setPin("");
        setStage("confirm");
        return;
      }
      if (mode === "setup") {
        if (pin !== firstPin) {
          setPin("");
          setFirstPin("");
          setStage("enter");
          setError(t("pinMismatch"));
          return;
        }
        onComplete(await savePin(pin, autoLockMinutes));
        return;
      }
      const settings = readLockSettings();
      if (!settings || !(await verifyPin(pin, settings))) {
        setPin("");
        setError(t("pinWrong"));
        return;
      }
      onComplete(settings);
    } catch (cause) {
      setError(`${t("lockError")} ${cause instanceof Error ? cause.message : String(cause)}`);
    } finally {
      setBusy(false);
    }
  }

  async function unlockWithBiometric() {
    setError("");
    setBusy(true);
    try {
      onComplete(await authenticateLocalBiometric());
    } catch (cause) {
      setError(
        `${t("fingerprintError")} ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pin-screen" role="dialog" aria-modal="true" aria-labelledby="pin-title">
      <div className="pin-card">
        <div className="pin-mark">
          <LockKeyhole aria-hidden="true" />
        </div>
        <span className="eyebrow">{t("workspace")}</span>
        <h1 id="pin-title">
          {mode === "setup"
            ? t(stage === "enter" ? "pinSetupTitle" : "pinConfirmTitle")
            : t("pinLockTitle")}
        </h1>
        <p>{mode === "setup" ? t("pinSetupHint") : t("pinLockHint")}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitPin();
          }}
        >
          <label className="pin-label" htmlFor="hub-pin">
            {t("pin")}
          </label>
          <input
            id="hub-pin"
            className="pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-describedby={error ? "pin-error" : "pin-privacy-note"}
            autoFocus
          />
          {error && (
            <p className="pin-error" id="pin-error" role="alert">
              {error}
            </p>
          )}
          <Button variant="hub" size="touch" type="submit" disabled={busy || pin.length !== 6}>
            <ShieldCheck aria-hidden="true" />
            {busy
              ? t("loading")
              : t(mode === "setup" && stage === "enter" ? "pinContinue" : "pinUnlock")}
          </Button>
        </form>
        {mode === "locked" && biometricReady && (
          <Button
            variant="soft"
            size="touch"
            className="pin-biometric-button"
            disabled={busy}
            onClick={() => void unlockWithBiometric()}
          >
            <Fingerprint aria-hidden="true" />
            {t("unlockFingerprint")}
          </Button>
        )}
        <p className="pin-privacy-note" id="pin-privacy-note">
          {t("pinPrivacyNote")}
        </p>
        <div className="fingerprint-note">
          <Fingerprint aria-hidden="true" />
          <span>{biometricReady ? t("fingerprintReady") : t("fingerprintSetupHint")}</span>
        </div>
      </div>
    </div>
  );
}

export function AutoLockControl({
  minutes,
  onChange,
  onBiometricChange,
}: {
  minutes: LockSettings["autoLockMinutes"];
  onChange: (minutes: LockSettings["autoLockMinutes"]) => void;
  onBiometricChange: (settings: LockSettings) => void;
}) {
  const { t } = useDesign();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricConfigured, setBiometricConfigured] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    try {
      setBiometricConfigured(Boolean(readLockSettings()?.biometricCredentialId));
    } catch (cause) {
      setError(`${t("lockError")} ${cause instanceof Error ? cause.message : String(cause)}`);
    }
    void isLocalBiometricAvailable()
      .then((available) => {
        if (active) setBiometricAvailable(available);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(`${t("lockError")} ${cause instanceof Error ? cause.message : String(cause)}`);
        }
      });
    return () => {
      active = false;
    };
  }, [t]);

  async function updateBiometric() {
    setError("");
    try {
      const settings = biometricConfigured ? clearLocalBiometric() : await enrollLocalBiometric();
      setBiometricConfigured(Boolean(settings.biometricCredentialId));
      onBiometricChange(settings);
    } catch (cause) {
      setError(
        `${t("fingerprintError")} ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    }
  }

  return (
    <div className="settings-row">
      <label htmlFor="auto-lock">{t("autoLock")}</label>
      <select
        id="auto-lock"
        className="auto-lock-select"
        value={minutes}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (isAutoLockMinutes(value)) onChange(value);
        }}
      >
        {AUTO_LOCK_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {value} {value === 1 ? t("minute") : t("minutes")}
          </option>
        ))}
      </select>
      <Button
        variant="soft"
        size="touch"
        className="fingerprint-button"
        disabled={!biometricAvailable}
        aria-describedby="fingerprint-help"
        onClick={() => void updateBiometric()}
      >
        <Fingerprint aria-hidden="true" />
        {t(biometricConfigured ? "removeFingerprint" : "setupFingerprint")}
      </Button>
      <p id="fingerprint-help" className="fingerprint-help">
        {biometricAvailable ? t("fingerprintReady") : t("fingerprintUnavailable")}
      </p>
      {error && (
        <p className="pin-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
