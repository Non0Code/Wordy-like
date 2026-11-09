/**
 * Reconnaissance vocale (italien) et enregistrement de la voix.
 * - Reconnaissance : Web Speech API (SpeechRecognition, langue it-IT), disponible
 *   dans Chrome, Edge et Safari. Non disponible dans Firefox : l'interface le signale.
 * - Enregistrement : MediaRecorder, pour réécouter sa voix et la comparer au modèle.
 */
type SR = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => SR) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechRecognitionSupported = () => typeof window !== "undefined" && !!ctor();
export const recordingSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export interface RecognitionResult {
  alternatives: Array<{ transcript: string; confidence: number }>;
}

const ERRORS: Record<string, string> = {
  "not-allowed": "Accès au micro refusé. Autorisez le micro dans votre navigateur.",
  "no-speech": "Aucune parole détectée. Réessayez en parlant plus près du micro.",
  network: "La reconnaissance vocale du navigateur nécessite une connexion Internet.",
  "audio-capture": "Aucun micro détecté.",
  aborted: "Écoute interrompue.",
};

export function recognizeOnce(onInterim?: (t: string) => void): { promise: Promise<RecognitionResult>; stop: () => void } {
  const C = ctor();
  if (!C) {
    return {
      promise: Promise.reject(new Error("La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome, Edge ou Safari).")),
      stop: () => {},
    };
  }
  const rec = new C();
  rec.lang = "it-IT";
  rec.interimResults = true;
  rec.maxAlternatives = 5;
  rec.continuous = false;
  let final: RecognitionResult | null = null;
  const promise = new Promise<RecognitionResult>((resolve, reject) => {
    rec.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      if (res.isFinal) {
        final = { alternatives: Array.from({ length: res.length }, (_, i) => ({ transcript: res[i].transcript, confidence: res[i].confidence })) };
      } else onInterim?.(res[0].transcript);
    };
    rec.onerror = (e) => reject(new Error(ERRORS[e.error] ?? `Erreur de reconnaissance : ${e.error}`));
    rec.onend = () => (final ? resolve(final) : reject(new Error(ERRORS["no-speech"])));
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}

export class VoiceRecorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.rec) return resolve(new Blob());
      this.rec.onstop = () => {
        this.stream?.getTracks().forEach((t) => t.stop());
        resolve(new Blob(this.chunks, { type: this.rec?.mimeType || "audio/webm" }));
      };
      this.rec.stop();
    });
  }
}

/** Calcule l'enveloppe d'amplitude d'un enregistrement (pour visualiser le rythme). */
export async function envelope(blob: Blob, buckets = 60): Promise<number[]> {
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const data = buf.getChannelData(0);
    const size = Math.floor(data.length / buckets) || 1;
    const out: number[] = [];
    for (let i = 0; i < buckets; i++) {
      let sum = 0;
      for (let j = i * size; j < Math.min(data.length, (i + 1) * size); j++) sum += data[j] * data[j];
      out.push(Math.sqrt(sum / size));
    }
    const max = Math.max(...out, 1e-6);
    return out.map((v) => v / max);
  } finally {
    void ctx.close();
  }
}
