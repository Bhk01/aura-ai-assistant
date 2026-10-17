const STORAGE_KEY = "s-it-hub-local-lock-v1";
export const AUTO_LOCK_OPTIONS = [1, 5, 15, 30] as const;

export type LockSettings = {
  salt: string;
  digest: string;
  autoLockMinutes: (typeof AUTO_LOCK_OPTIONS)[number];
  biometricCredentialId?: string;
};

export function isAutoLockMinutes(value: unknown): value is LockSettings["autoLockMinutes"] {
  return value === 1 || value === 5 || value === 15 || value === 30;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string, salt: string) {
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}:${pin}`),
  );
  return bytesToHex(new Uint8Array(digest));
}

function createChallenge() {
  return window.crypto.getRandomValues(new Uint8Array(32));
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const binary = window.atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function isLocalBiometricAvailable() {
  const credential = window.PublicKeyCredential;
  return Boolean(
    window.isSecureContext &&
    credential?.isUserVerifyingPlatformAuthenticatorAvailable &&
    (await credential.isUserVerifyingPlatformAuthenticatorAvailable()),
  );
}

export function readLockSettings(): LockSettings | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) {
    throw new Error("Saved local lock settings are invalid.");
  }
  const record = value as Record<string, unknown>;
  if (
    typeof record["salt"] !== "string" ||
    typeof record["digest"] !== "string" ||
    !isAutoLockMinutes(record["autoLockMinutes"]) ||
    (typeof record["biometricCredentialId"] !== "undefined" &&
      typeof record["biometricCredentialId"] !== "string")
  ) {
    throw new Error("Saved local lock settings are invalid.");
  }
  return {
    salt: record["salt"],
    digest: record["digest"],
    autoLockMinutes: record["autoLockMinutes"] as LockSettings["autoLockMinutes"],
    ...(typeof record["biometricCredentialId"] === "string"
      ? { biometricCredentialId: record["biometricCredentialId"] }
      : {}),
  };
}

export async function savePin(pin: string, autoLockMinutes: LockSettings["autoLockMinutes"]) {
  const salt = bytesToHex(window.crypto.getRandomValues(new Uint8Array(16)));
  const settings: LockSettings = { salt, digest: await hashPin(pin, salt), autoLockMinutes };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export async function verifyPin(pin: string, settings: LockSettings) {
  return (await hashPin(pin, settings.salt)) === settings.digest;
}

export async function enrollLocalBiometric(): Promise<LockSettings> {
  const settings = readLockSettings();
  if (!settings) throw new Error("A PIN must be configured before enabling biometric unlock.");
  if (!(await isLocalBiometricAvailable())) {
    throw new Error("A compatible on-device biometric authenticator is unavailable.");
  }
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: createChallenge(),
      rp: { id: window.location.hostname, name: "S-IT Hub" },
      user: {
        id: new TextEncoder().encode("s-it-hub-local-user"),
        name: "s-it-hub-local-user",
        displayName: "S-IT Hub",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "discouraged",
        userVerification: "required",
      },
      attestation: "none",
      timeout: 60_000,
      ...(settings.biometricCredentialId
        ? {
            excludeCredentials: [
              {
                type: "public-key" as const,
                id: fromBase64Url(settings.biometricCredentialId),
              },
            ],
          }
        : {}),
    },
  })) as PublicKeyCredential | null;
  if (!credential) throw new Error("The device did not create a biometric credential.");
  const updated: LockSettings = {
    ...settings,
    biometricCredentialId: toBase64Url(new Uint8Array(credential.rawId)),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function authenticateLocalBiometric(): Promise<LockSettings> {
  const settings = readLockSettings();
  if (!settings?.biometricCredentialId) {
    throw new Error("Biometric unlock has not been configured on this device.");
  }
  const credential = (await navigator.credentials.get({
    publicKey: {
      challenge: createChallenge(),
      rpId: window.location.hostname,
      allowCredentials: [
        {
          type: "public-key",
          id: fromBase64Url(settings.biometricCredentialId),
        },
      ],
      userVerification: "required",
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (
    !credential ||
    toBase64Url(new Uint8Array(credential.rawId)) !== settings.biometricCredentialId
  ) {
    throw new Error("The device could not verify the saved biometric credential.");
  }
  return settings;
}

export function clearLocalBiometric(): LockSettings {
  const settings = readLockSettings();
  if (!settings) throw new Error("No local PIN lock has been configured.");
  const { biometricCredentialId: _credentialId, ...updated } = settings;
  const normalized: LockSettings = { ...updated };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function saveAutoLockMinutes(minutes: LockSettings["autoLockMinutes"]): LockSettings {
  const settings = readLockSettings();
  if (!settings) throw new Error("A PIN must be configured before changing the auto-lock timer.");
  const updated: LockSettings = { ...settings, autoLockMinutes: minutes };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
