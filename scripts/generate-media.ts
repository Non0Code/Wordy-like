/**
 * Génère les médias de démonstration LIBRES DE DROITS :
 *  - une vidéo MP4 par scène (voix de synthèse espeak-ng + fond animé ffmpeg),
 *  - les sous-titres WebVTT italien et français horodatés,
 *  - un fichier audio par mot du dictionnaire (prononciation de secours).
 *
 * Prérequis : espeak-ng et ffmpeg installés.  Usage : npm run media
 * Aucun contenu protégé n'est utilisé : dialogues originaux + voix synthétiques.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { SCENES } from "../src/content/it/scenes";
import { lang } from "../src/content";

const OUT = resolve("public/media");
const tmp = mkdtempSync(join(tmpdir(), "parla-media-"));
const GAP = 0.7;
const FONT = ["/usr/share/fonts/opentype/inter/Inter-SemiBold.otf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"].find(existsSync);

function run(cmd: string, args: string[]) {
  execFileSync(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
}
function duration(file: string): number {
  return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());
}
const vttTime = (t: number) => {
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = (t % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s}`;
};
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\u2019").replace(/%/g, "\\%").replace(/,/g, "\\,");

mkdirSync(join(OUT, "scenes"), { recursive: true });
mkdirSync(join(OUT, "words"), { recursive: true });

const timings: Record<string, Array<[number, number]>> = {};
const onlyWords = process.argv.includes("--words");
const onlyScenes = process.argv.includes("--scenes");

if (!onlyWords) {
  for (const scene of SCENES) {
    process.stdout.write(`Scène ${scene.id}… `);
    const parts: string[] = [];
    const times: Array<[number, number]> = [];
    let t = 1.0; // petite intro silencieuse
    const silence = join(tmp, "gap.wav");
    run("ffmpeg", ["-y", "-f", "lavfi", "-i", `anullsrc=r=22050:cl=mono`, "-t", String(GAP), silence]);
    const intro = join(tmp, "intro.wav");
    run("ffmpeg", ["-y", "-f", "lavfi", "-i", `anullsrc=r=22050:cl=mono`, "-t", "1", intro]);
    parts.push(intro);
    scene.lines.forEach((line, i) => {
      const wav = join(tmp, `${scene.id}-${i}.wav`);
      const voice = scene.speakers[line.speaker]?.voice ?? "it";
      run("espeak-ng", ["-v", voice, "-s", "140", "-w", wav, line.it]);
      const d = duration(wav);
      times.push([+t.toFixed(2), +(t + d).toFixed(2)]);
      t += d + GAP;
      parts.push(wav, silence);
    });
    const list = join(tmp, `${scene.id}.txt`);
    writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
    const audio = join(tmp, `${scene.id}.wav`);
    run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", audio]);
    const total = duration(audio);

    // Fond animé : dégradé aux couleurs de la scène + nom du personnage qui parle.
    const [c1, c2] = scene.palette.map((c) => c.replace("#", "0x"));
    const draw: string[] = [];
    if (FONT) {
      draw.push(
        `drawtext=fontfile=${FONT}:text='${esc(scene.work.toUpperCase())}':fontcolor=white@0.55:fontsize=18:x=28:y=24`,
        `drawtext=fontfile=${FONT}:text='${esc(scene.title)}':fontcolor=white@0.9:fontsize=34:x=28:y=50`,
        `drawtext=fontfile=${FONT}:text='Scène de démonstration · voix de synthèse':fontcolor=white@0.45:fontsize=14:x=28:y=h-36`,
      );
      scene.lines.forEach((line, i) => {
        const [a, b] = times[i];
        const color = (scene.speakers[line.speaker]?.color ?? "#ffffff").replace("#", "0x");
        draw.push(
          `drawtext=fontfile=${FONT}:text='${esc(line.speaker)}':fontcolor=${color}:fontsize=46:x=(w-text_w)/2:y=(h-text_h)/2-10:enable='between(t,${a},${b + 0.3})'`,
        );
      });
    }
    const vf = [
      `gradients=s=640x360:c0=${c1}:c1=${c2}:x0=0:y0=0:x1=640:y1=360:speed=0.004:d=${total.toFixed(2)}:r=24`,
    ];
    const out = join(OUT, "scenes", `${scene.id}.mp4`);
    try {
      run("ffmpeg", [
        "-y", "-f", "lavfi", "-i", vf[0], "-i", audio,
        "-vf", draw.join(",") || "null",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "64k", "-shortest", "-movflags", "+faststart", out,
      ]);
    } catch {
      // ffmpeg ancien sans filtre « gradients » : fond uni.
      run("ffmpeg", [
        "-y", "-f", "lavfi", "-i", `color=c=${c1}:s=640x360:r=24:d=${total.toFixed(2)}`, "-i", audio,
        "-vf", draw.join(",") || "null",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "64k", "-shortest", "-movflags", "+faststart", out,
      ]);
    }
    const vtt = (key: "it" | "fr") =>
      "WEBVTT\n\n" + scene.lines.map((l, i) => `${i + 1}\n${vttTime(times[i][0])} --> ${vttTime(times[i][1])}\n${l[key]}\n`).join("\n");
    writeFileSync(join(OUT, "scenes", `${scene.id}.it.vtt`), vtt("it"));
    writeFileSync(join(OUT, "scenes", `${scene.id}.fr.vtt`), vtt("fr"));
    timings[scene.id] = times;
    console.log(`${total.toFixed(1)} s`);
  }
  writeFileSync(resolve("src/content/it/scene-timings.json"), JSON.stringify(timings, null, 1) + "\n");
}

if (!onlyScenes) {
  const entries = lang().dictionary;
  process.stdout.write(`Audio de ${entries.length} mots… `);
  for (const e of entries) {
    const wav = join(tmp, "w.wav");
    run("espeak-ng", ["-v", "it", "-s", "125", "-w", wav, e.lemma]);
    run("ffmpeg", ["-y", "-i", wav, "-ac", "1", "-ar", "22050", "-b:a", "32k", join(OUT, "words", `${e.id}.mp3`)]);
  }
  console.log("ok");
}
rmSync(tmp, { recursive: true, force: true });
