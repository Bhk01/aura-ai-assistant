import type { Company, Device } from "./demo-data";
import { expectedReturn } from "./rules";

export type SoundChime = {
  id: string;
  name: string;
  frequency: number;
  harmonics: number[];
};

export const SOUND_CHIMES: SoundChime[] = [
  { id: "soft-1", name: "Néon doux", frequency: 392, harmonics: [196, 587.33] },
  { id: "soft-2", name: "Murmure", frequency: 440, harmonics: [220, 659.25] },
  { id: "soft-3", name: "Vigilance", frequency: 523.25, harmonics: [261.63, 783.99] },
  { id: "soft-4", name: "Alarme calme", frequency: 349.23, harmonics: [174.61, 523.25] },
  { id: "soft-5", name: "Réveil", frequency: 466.16, harmonics: [233.08, 698.46] },
  { id: "soft-6", name: "Signal doux", frequency: 587.33, harmonics: [293.66, 880] },
  { id: "soft-7", name: "Merci", frequency: 659.25, harmonics: [329.63, 987.77] },
];

export type AlertTrigger = {
  id: string;
  deviceId: string;
  companyName: string;
  departmentLabel: string;
  expectedReturn: Date;
  daysUntil: number;
  message: string;
};

export function createAlertTriggers(
  devices: Device[],
  companies: Company[],
  today = new Date(),
  maxDays = 10,
): AlertTrigger[] {
  return devices
    .filter((device) => device.status === "away" && device.companyId && device.sentDate)
    .map((device) => {
      const company = companies.find((entry) => entry.id === device.companyId);
      if (!company || !device.sentDate) return null;
      const expected = expectedReturn(new Date(device.sentDate), company.deadlineDays);
      const daysUntil = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0 || daysUntil > maxDays) return null;
      return {
        id: `${device.id}-${company.id}`,
        deviceId: device.id,
        companyName: company.name,
        departmentLabel: device.departmentId,
        expectedReturn: expected,
        daysUntil,
        message: `${company.name} • ${daysUntil} jours avant retour`,
      };
    })
    .filter((entry): entry is AlertTrigger => entry !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export async function playHospitalChime(index: number, volume = 0.42): Promise<void> {
  if (typeof window === "undefined") return;

  const AudioCtor =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioCtor) return;

  const context = new AudioCtor();
  const chime = SOUND_CHIMES[index % SOUND_CHIMES.length];
  if (!chime) {
    await context.close();
    return;
  }
  await context.resume();
  const start = context.currentTime;
  const master = context.createGain();
  master.gain.value = Math.min(1, Math.max(0, volume));
  master.connect(context.destination);

  chime.harmonics.forEach((frequency, toneIndex) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = toneIndex === 0 ? 2 : -2;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);

    lfo.type = "sine";
    lfo.frequency.value = 5 + toneIndex;
    lfoGain.gain.value = 4 + toneIndex * 1.5;
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(start + toneIndex * 0.04);
    oscillator.stop(start + 0.8 + toneIndex * 0.04);
    lfo.start(start);
    lfo.stop(start + 0.8);
  });

  const pulse = context.createOscillator();
  const pulseGain = context.createGain();
  pulse.type = "triangle";
  pulse.frequency.value = chime.frequency;
  pulseGain.gain.setValueAtTime(0.0001, start);
  pulseGain.gain.exponentialRampToValueAtTime(0.15, start + 0.12);
  pulseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
  pulse.connect(pulseGain);
  pulseGain.connect(master);
  pulse.start(start);
  pulse.stop(start + 0.8);

  await new Promise((resolve) => {
    window.setTimeout(resolve, 900);
  });

  await context.close();
}
