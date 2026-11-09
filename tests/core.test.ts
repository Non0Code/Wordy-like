import { describe, expect, it } from "vitest";
import { schedule, newCardState, deriveStatus, forceStatus, queueStats, DAY_MS, BASE_INTERVALS, previewIntervals } from "../src/core/srs";
import { pronounce } from "../src/core/phonetics";
import { conjugate, pluralOf, adjectiveForms } from "../src/core/morphology";
import { lang, analyze, lookup, entry } from "../src/content";
import { chooseSense } from "../src/core/analysis";
import { evaluatePronunciation, diagnose } from "../src/core/pronunciation";
import { demoCorrect, scriptedReply, SCENARIOS } from "../src/ai/demoTutor";
import { parseSubtitles, alignTranslations, cueAt } from "../src/core/subtitles";
import { checkTyped, checkSentence, buildExercise, seededRng } from "../src/core/exercises";
import { computeStreak, emptyDay, levelFromXp } from "../src/core/gamification";
import { allLessons } from "../src/content";

const NOW = new Date(2026, 0, 10, 12).getTime();

describe("Répétition espacée", () => {
  it("suit la table J0 → J1 → J3 → J7 → J14 → J30 → J60 → J90 avec « Correct »", () => {
    let c = newCardState();
    const got: number[] = [];
    for (let k = 0; k < 8; k++) {
      c = schedule(c, "good", NOW);
      got.push(c.intervalDays);
    }
    expect(got).toEqual([...BASE_INTERVALS.slice(1), Math.round(90 * 2.5)]);
  });
  it("« Oublié » renvoie le mot dans 10 minutes et baisse la facilité", () => {
    let c = schedule(schedule(schedule(newCardState(), "good", NOW), "good", NOW), "good", NOW);
    const after = schedule(c, "again", NOW);
    expect(after.step).toBe(0);
    expect(after.dueAt).toBe(NOW + 10 * 60_000);
    expect(after.ease).toBeLessThan(c.ease);
    expect(after.lapses).toBe(1);
    c = schedule(after, "good", NOW);
    expect(c.intervalDays).toBe(1);
  });
  it("« Facile » allonge l'intervalle plus que « Correct », « Difficile » moins", () => {
    const base = schedule(schedule(newCardState(), "good", NOW), "good", NOW); // J3
    const easy = schedule(base, "easy", NOW).intervalDays;
    const good = schedule(base, "good", NOW).intervalDays;
    const hard = schedule(base, "hard", NOW).intervalDays;
    expect(easy).toBeGreaterThan(good);
    expect(hard).toBeLessThan(good);
    expect(hard).toBeGreaterThanOrEqual(1);
  });
  it("calcule la date de prochaine révision", () => {
    const c = schedule(newCardState(), "good", NOW);
    expect(c.dueAt).toBe(NOW + DAY_MS);
    expect(previewIntervals(c, NOW).again).toBe("10 min");
  });
  it("dérive le statut inconnu / en apprentissage / connu", () => {
    let c = newCardState();
    expect(deriveStatus(c)).toBe("unknown");
    c = schedule(c, "good", NOW);
    expect(deriveStatus(c)).toBe("learning");
    for (let k = 0; k < 5; k++) c = schedule(c, "good", NOW);
    expect(deriveStatus(c)).toBe("known");
  });
  it("applique un statut manuel", () => {
    const known = forceStatus(newCardState(), "known", NOW);
    expect(deriveStatus(known)).toBe("known");
    expect(forceStatus(known, "unknown", NOW).step).toBe(-1);
  });
  it("compte les mots dus, en retard et le temps estimé", () => {
    const due = { ...schedule(newCardState(), "good", NOW - 3 * DAY_MS), status: "learning" as const };
    const later = { ...schedule(newCardState(), "easy", NOW), status: "learning" as const };
    const fresh = { ...newCardState(), status: "unknown" as const };
    const s = queueStats([due, later, fresh], 5, 0, NOW);
    expect(s.dueToday).toBe(1);
    expect(s.overdue).toBe(1);
    expect(s.newAvailable).toBe(1);
    expect(s.estimatedMinutes).toBeGreaterThan(0);
  });
});

describe("Phonétique", () => {
  it.each([
    ["magari", 2, "ma-GA-ri", "/maˈga.ri/"],
    ["famiglia", 2, "fa-MI-glia", "/faˈmi.ʎa/"],
    ["città", 2, "cit-TÀ", "/tʃitˈta/"],
    ["telefono", 3, "te-LE-fo-no", "/teˈle.fo.no/"],
    ["gnocchi", 2, "GNOC-chi", "/ˈɲok.ki/"],
    ["pesce", 2, "PE-sce", "/ˈpe.ʃe/"],
  ])("%s", (w, s, readable, ipa) => {
    const p = pronounce(w, s);
    expect(p.readable).toBe(readable);
    expect(p.ipa).toBe(ipa);
  });
});

describe("Morphologie", () => {
  it("conjugue réguliers, irréguliers et pronominaux", () => {
    expect(conjugate(entry("parlare")!)!.tenses.presente).toEqual(["parlo", "parli", "parla", "parliamo", "parlate", "parlano"]);
    expect(conjugate(entry("mangiare")!)!.tenses.futuro[0]).toBe("mangerò");
    expect(conjugate(entry("cercare")!)!.tenses.presente[1]).toBe("cerchi");
    expect(conjugate(entry("capire")!)!.tenses.presente[0]).toBe("capisco");
    expect(conjugate(entry("andare")!)!.tenses["passato prossimo"][0]).toBe("sono andato");
    expect(conjugate(entry("chiamarsi")!)!.tenses.presente[0]).toBe("mi chiamo");
    expect(conjugate(entry("essere")!)!.tenses["congiuntivo imperfetto"][2]).toBe("fosse");
  });
  it("forme pluriels et adjectifs", () => {
    expect(pluralOf("ragazzo", "m")).toBe("ragazzi");
    expect(pluralOf("casa", "f")).toBe("case");
    expect(pluralOf("città", "f")).toBe("città");
    expect(adjectiveForms("simpatico")).toEqual(["simpatico", "simpatica", "simpatici", "simpatiche"]);
  });
  it("rattache les formes fléchies au même lemme (pas de doublon)", () => {
    for (const f of ["vado", "andiamo", "andato", "andrò"]) expect(lookup(f)[0]?.id).toBe("andare");
    expect(lookup("buonissima")[0]?.id).toBe("buono");
    expect(lookup("dimmi")[0]?.id).toBe("dire");
    expect(lookup("dell'")[0]?.id).toBe("di");
  });
});

describe("Contenu", () => {
  it("chaque leçon référence des mots existants", () => {
    for (const l of allLessons()) for (const w of l.words) expect(entry(w), `${l.id}:${w}`).toBeTruthy();
  });
  it("couvre les six niveaux CECRL", () => {
    expect(lang().curriculum.map((c) => c.level)).toEqual(["A1", "A2", "B1", "B2", "C1", "C2"]);
    expect(lang().dictionary.length).toBeGreaterThan(400);
  });
});

describe("Traduction contextuelle", () => {
  const senseOf = (sentence: string, word: string) => {
    const toks = analyze(sentence);
    const t = toks.find((x) => x.norm === word)!;
    const e = entry(t.entryIds[0])!;
    return e.senses[chooseSense(e, toks, t.wordIndex, lang().formIndex).index].fr;
  };
  it("« magari » : peut-être / si seulement / volontiers", () => {
    expect(senseOf("Magari andiamo al mare domani.", "magari")).toMatch(/peut-être/);
    expect(senseOf("Magari fosse vero!", "magari")).toMatch(/si seulement/);
    expect(senseOf("Al mare? Magari!", "magari")).toMatch(/volontiers/);
  });
  it("« perché » : pourquoi / parce que", () => {
    expect(senseOf("Perché ridi?", "perché")).toMatch(/pourquoi/);
    expect(senseOf("Resto a casa perché piove.", "perché")).toMatch(/parce que/);
  });
  it("repère les expressions figées", () => {
    const toks = analyze("Mi stai prendendo in giro?");
    expect(toks.filter((t) => t.expressionId === "prendere_in_giro").length).toBe(3);
  });
});

describe("Prononciation", () => {
  it("donne 100 à une prononciation parfaite", () => {
    expect(evaluatePronunciation("Ciao, come stai?", [{ transcript: "ciao come stai", confidence: 0.9 }]).score).toBe(100);
  });
  it("diagnostique les consonnes doubles et gli", () => {
    expect(diagnose("palla", "pala").join(" ")).toMatch(/Consonne double/);
    expect(diagnose("famiglia", "familia").join(" ")).toMatch(/gli/);
  });
  it("signale un mot manqué", () => {
    const fb = evaluatePronunciation("Ho fame adesso", [{ transcript: "ho adesso", confidence: 0.8 }]);
    expect(fb.words.find((w) => w.expected === "fame")?.verdict).toBe("manqué");
    expect(fb.score).toBeLessThan(80);
  });
});

describe("Professeur (mode démo)", () => {
  it("corrige « Io sono 19 anni » en « Ho 19 anni »", () => {
    const r = demoCorrect("Io sono 19 anni");
    expect(r.correct).toBe(false);
    expect(r.corrected).toBe("Ho 19 anni");
    expect(r.errors[0].rule).toMatch(/AVERE/);
    expect(r.exercises.length).toBeGreaterThan(0);
  });
  it("corrige l'auxiliaire et l'article", () => {
    expect(demoCorrect("Ieri ho andato al cinema").corrected).toMatch(/sono andato/);
    expect(demoCorrect("Il studente è bravo").corrected).toMatch(/^Lo studente/);
  });
  it("laisse une phrase correcte", () => {
    expect(demoCorrect("Ho fame").correct).toBe(true);
  });
  it("fait avancer une conversation scénarisée", () => {
    expect(scriptedReply(SCENARIOS[0], 0, "Vorrei un caffè").advance).toBe(true);
    expect(scriptedReply(SCENARIOS[0], 0, "bonjour").advance).toBe(false);
  });
});

describe("Sous-titres", () => {
  const srt = "1\n00:00:01,000 --> 00:00:02,500\n<i>Ciao!</i>\n\n2\n00:00:03,000 --> 00:00:04,000\nCome stai?\n";
  const vtt = "WEBVTT\n\n00:00:01.100 --> 00:00:02.400\nSalut !\n\n00:00:03.000 --> 00:00:04.000\nComment vas-tu ?\n";
  it("lit SRT et VTT et aligne les traductions", () => {
    const it = parseSubtitles(srt);
    expect(it).toEqual([
      { start: 1, end: 2.5, text: "Ciao!" },
      { start: 3, end: 4, text: "Come stai?" },
    ]);
    expect(alignTranslations(it, parseSubtitles(vtt))).toEqual(["Salut !", "Comment vas-tu ?"]);
    expect(cueAt(it, 3.5)).toBe(1);
    expect(cueAt(it, 0.2)).toBe(-1);
  });
});

describe("Exercices", () => {
  it("accepte les variantes et les petites fautes", () => {
    expect(checkTyped("Peut etre", ["peut-être", "si seulement"]).ok).toBe(true);
    expect(checkTyped("la famille", ["famille"]).ok).toBe(true);
    expect(checkTyped("famile", ["famille"]).typo).toBe(true);
    expect(checkTyped("maison", ["famille"]).ok).toBe(false);
    expect(checkSentence(["ho", "fame!"], "Ho fame")).toBe(true);
  });
  it("construit un QCM valide", () => {
    const e = entry("casa")!;
    const ex = buildExercise(e, undefined, lang().dictionary, 0, { difficulty: "normal", allowSpeech: false, rng: seededRng(1) });
    expect(ex.kind).toBe("qcm");
    if (ex.kind === "qcm") expect(ex.options[ex.answer]).toBe("maison");
  });
});

describe("Gamification", () => {
  it("calcule la série de jours", () => {
    const d = (id: string) => ({ ...emptyDay(id), xp: 10 });
    expect(computeStreak([d("2026-01-08"), d("2026-01-09"), d("2026-01-10")], "2026-01-10").current).toBe(3);
    expect(computeStreak([d("2026-01-08"), d("2026-01-09")], "2026-01-10").current).toBe(2);
    expect(computeStreak([d("2026-01-05")], "2026-01-10").current).toBe(0);
  });
  it("calcule les niveaux personnels", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(50).level).toBe(2);
    expect(levelFromXp(200).level).toBe(3);
  });
});
