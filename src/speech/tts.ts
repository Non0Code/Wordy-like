/**
 * Synthèse vocale italienne.
 * 1) Voix italienne du navigateur/OS (Web Speech API) si disponible — la meilleure qualité.
 * 2) Sinon, fichier audio pré-généré (public/media/words/<id>.mp3, script `npm run media`).
 */
let voices: SpeechSynthesisVoice[] = [];
const hasSynth = typeof window !== "undefined" && "speechSynthesis" in window;

function loadVoices() {
  if (!hasSynth) return;
  voices = window.speechSynthesis.getVoices();
}
if (hasSynth) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export function italianVoices(): SpeechSynthesisVoice[] {
  return voices.filter((v) => v.lang.toLowerCase().startsWith("it"));
}

export function hasItalianVoice(): boolean {
  return italianVoices().length > 0;
}

function pickVoice(prefer?: "f" | "m"): SpeechSynthesisVoice | undefined {
  const it = italianVoices();
  if (!it.length) return undefined;
  const quality = (v: SpeechSynthesisVoice) => (/(natural|neural|premium|enhanced|google)/i.test(v.name) ? 1 : 0);
  const sorted = [...it].sort((a, b) => quality(b) - quality(a));
  if (prefer) {
    const female = /(alice|elsa|federica|paola|isabella|giulia|female|donna)/i;
    const g = sorted.find((v) => (prefer === "f" ? female.test(v.name) : !female.test(v.name)));
    if (g) return g;
  }
  return sorted[0];
}

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (hasSynth) window.speechSynthesis.cancel();
  currentAudio?.pause();
}

/**
 * Prononce un texte en italien. Renvoie une promesse résolue à la fin.
 * `fallbackUrl` : fichier audio à utiliser si aucune voix italienne n'est installée.
 */
export function speak(text: string, opts: { rate?: number; fallbackUrl?: string; voice?: "f" | "m" } = {}): Promise<void> {
  stopSpeaking();
  const voice = pickVoice(opts.voice);
  if (hasSynth && voice) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "it-IT";
      u.voice = voice;
      u.rate = opts.rate ?? 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }
  if (opts.fallbackUrl) {
    return new Promise((resolve, reject) => {
      const a = new Audio(opts.fallbackUrl);
      currentAudio = a;
      a.playbackRate = opts.rate ?? 1;
      a.onended = () => resolve();
      a.onerror = () => reject(new Error("Audio indisponible"));
      a.play().catch(reject);
    });
  }
  return Promise.reject(new Error("Aucune voix italienne n'est installée sur cet appareil."));
}

export const wordAudioUrl = (id: string) => `/media/words/${encodeURIComponent(id)}.mp3`;
