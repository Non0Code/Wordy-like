/**
 * MODE DÉMO DU PROFESSEUR (sans IA).
 * Utilisé uniquement quand aucune clé API n'est configurée sur le serveur.
 * Ce n'est PAS une IA : un correcteur à règles qui reconnaît les erreurs les
 * plus fréquentes des francophones, des fiches de grammaire et des
 * conversations scénarisées. L'interface l'indique clairement.
 */
import { allLessons, lookup } from "../content";
import { normalize } from "../core/pronunciation";

export interface RuleHit {
  wrong: string;
  right: string;
  rule: string;
}

interface Rule {
  re: RegExp;
  fix: (m: RegExpMatchArray) => string;
  rule: string;
  exercises: Array<{ prompt: string; answer: string }>;
}

const FAMILY = "madre|padre|fratello|sorella|figlio|figlia|marito|moglie|nonno|nonna|zio|zia|cugino|cugina";
const MOTION = "andato|andata|venuto|venuta|arrivato|arrivata|partito|partita|tornato|tornata|uscito|uscita|stato|stata|nato|nata|entrato|entrata|rimasto|rimasta|caduto|caduta";

const RULES: Rule[] = [
  {
    re: /\b(?:io\s+)?sono\s+(\d+|[a-z]+)\s+anni\b/i,
    fix: (m) => `ho ${m[1]} anni`,
    rule: "L'âge s'exprime avec le verbe AVERE (avoir), comme en français : « ho 19 anni » = j'ai 19 ans. « Sono 19 anni » est un calque erroné.",
    exercises: [
      { prompt: "Traduisez : Ma sœur a 25 ans.", answer: "Mia sorella ha 25 anni." },
      { prompt: "Complétez : Quanti anni ___ (tu) ?", answer: "hai" },
    ],
  },
  {
    re: /\b(?:io\s+)?sono\s+(fame|sete|freddo|caldo|sonno|paura|ragione|torto|fretta)\b/i,
    fix: (m) => `ho ${m[1]}`,
    rule: "Avec fame, sete, freddo, caldo, sonno, paura, ragione, fretta, on utilise AVERE : « ho fame » (j'ai faim), « ho freddo ».",
    exercises: [
      { prompt: "Traduisez : J'ai soif.", answer: "Ho sete." },
      { prompt: "Traduisez : Tu as raison.", answer: "Hai ragione." },
    ],
  },
  {
    re: new RegExp(`\\b(ho|hai|ha|abbiamo|avete|hanno)\\s+(${MOTION})\\b`, "i"),
    fix: (m) => `${({ ho: "sono", hai: "sei", ha: "è", abbiamo: "siamo", avete: "siete", hanno: "sono" } as Record<string, string>)[m[1].toLowerCase()]} ${m[2]}`,
    rule: "Les verbes de mouvement ou de changement d'état (andare, venire, arrivare, partire, tornare, uscire, essere, nascere...) forment le passato prossimo avec ESSERE, et le participe s'accorde : « sono andato/andata ».",
    exercises: [
      { prompt: "Mettez au passé : (noi) arrivare a Roma.", answer: "Siamo arrivati a Roma." },
      { prompt: "Mettez au passé (sujet féminin) : (io) uscire con gli amici.", answer: "Sono uscita con gli amici." },
    ],
  },
  {
    re: /\bla\s+(problema|sistema|programma|tema|clima|cinema)\b/i,
    fix: (m) => `il ${m[1]}`,
    rule: "Problema, sistema, programma, tema, clima sont MASCULINS malgré le -a : « il problema », pluriel « i problemi ».",
    exercises: [{ prompt: "Mettez au pluriel : il problema difficile.", answer: "i problemi difficili" }],
  },
  {
    re: /\b(?:a\s+)?(?:me|io)?\s*mi\s+piace\s+(i|gli|le)\s+(\w+)/i,
    fix: (m) => `mi piacciono ${m[1]} ${m[2]}`,
    rule: "« Piacere » s'accorde avec ce qui plaît : singulier → « mi piace il film », pluriel → « mi piacciono i film ».",
    exercises: [
      { prompt: "Complétez : Ti ___ gli spaghetti ?", answer: "piacciono" },
      { prompt: "Complétez : Mi ___ la musica.", answer: "piace" },
    ],
  },
  {
    re: /\bio\s+piace\b/i,
    fix: () => "mi piace",
    rule: "On ne dit pas « io piace » : le verbe piacere se construit avec un pronom complément : « mi piace » (cela me plaît).",
    exercises: [{ prompt: "Traduisez : J'aime le café.", answer: "Mi piace il caffè." }],
  },
  {
    re: new RegExp(`\\b(il|la)\\s+(mio|mia|tuo|tua|suo|sua)\\s+(${FAMILY})\\b`, "i"),
    fix: (m) => `${m[2]} ${m[3]}`,
    rule: "Pas d'article devant un possessif + nom de famille au singulier : « mia madre », « tuo padre ». (Mais « la mia casa », « i miei fratelli ».)",
    exercises: [{ prompt: "Traduisez : Mon frère et mes sœurs.", answer: "Mio fratello e le mie sorelle." }],
  },
  {
    re: /\b(io\s+chiamo|si\s+chiamo)\b/i,
    fix: () => "mi chiamo",
    rule: "« Chiamarsi » est pronominal : « mi chiamo », « ti chiami », « si chiama ».",
    exercises: [{ prompt: "Complétez : Come ___ chiami ?", answer: "ti" }],
  },
  {
    re: /\bil\s+(s[bcdfglmnpqrtv]\w*|z\w+|gn\w+|ps\w+|x\w+|y\w+)/i,
    fix: (m) => `lo ${m[1]}`,
    rule: "Devant s + consonne, z, gn, ps, x, y on utilise « lo » (pluriel « gli ») : lo studente, lo zio, gli studenti.",
    exercises: [{ prompt: "Article : ___ spettacolo / ___ zaino", answer: "lo spettacolo / lo zaino" }],
  },
  {
    re: /\bun\s+(s[bcdfglmnpqrtv]\w*|z\w+|gn\w+|ps\w+)/i,
    fix: (m) => `uno ${m[1]}`,
    rule: "Devant s + consonne, z, gn, ps, l'article indéfini masculin est « uno » : uno studente, uno zio.",
    exercises: [{ prompt: "Article : ___ zaino / ___ amico", answer: "uno zaino / un amico" }],
  },
  {
    re: /\bun\s+(amica|ora|altra|isola|idea|estate)\b/i,
    fix: (m) => `un'${m[1]}`,
    rule: "Devant un nom FÉMININ commençant par une voyelle, « una » s'élide en « un' » : un'amica, un'idea. (Au masculin : un amico, sans apostrophe.)",
    exercises: [{ prompt: "Article : ___ amico / ___ amica", answer: "un amico / un'amica" }],
  },
  {
    re: /\bpenso\s+che\s+(è|e|ha|sono|hanno)\b/i,
    fix: (m) => `penso che ${({ è: "sia", e: "sia", ha: "abbia", sono: "siano", hanno: "abbiano" } as Record<string, string>)[m[1].toLowerCase()]}`,
    rule: "Après les verbes d'opinion (pensare, credere, sembrare), on utilise le SUBJONCTIF : « penso che sia vero ».",
    exercises: [{ prompt: "Complétez : Credo che lui ___ (avere) ragione.", answer: "abbia" }],
  },
  {
    re: /\bse\s+(avrei|sarei|potrei|vorrei)\b/i,
    fix: (m) => `se ${({ avrei: "avessi", sarei: "fossi", potrei: "potessi", vorrei: "volessi" } as Record<string, string>)[m[1].toLowerCase()]}`,
    rule: "Comme en français, jamais de conditionnel après « se » (si) : on utilise le subjonctif imparfait. « Se avessi tempo, verrei » = Si j'avais le temps, je viendrais.",
    exercises: [{ prompt: "Complétez : Se ___ (essere) ricco, viaggerei.", answer: "fossi" }],
  },
  {
    re: /\b(vado|andiamo|vivo|abito|sono)\s+a\s+(francia|italia|spagna|germania|inghilterra|sicilia|toscana|europa)\b/i,
    fix: (m) => `${m[1]} in ${m[2]}`,
    rule: "Pays, régions et grandes îles → « in » (vado in Italia) ; villes → « a » (vado a Roma).",
    exercises: [{ prompt: "Complétez : Abito ___ Francia, ___ Lione.", answer: "in / a" }],
  },
  {
    re: /^\s*e\s+(bello|bella|vero|tardi|stanco|stanca|facile|difficile|possibile|importante|buono|buona)\b/i,
    fix: (m) => `è ${m[1]}`,
    rule: "« è » (avec accent) = il/elle est ; « e » (sans accent) = et. L'accent est obligatoire à l'écrit.",
    exercises: [{ prompt: "Accent ou pas ? Marco __ alto __ simpatico.", answer: "è / e" }],
  },
  {
    re: /\bperche\b/i,
    fix: () => "perché",
    rule: "« Perché » prend un accent aigu sur le e final (comme poiché, affinché, benché).",
    exercises: [],
  },
];

export interface DemoCorrection {
  correct: boolean;
  corrected: string;
  errors: RuleHit[];
  exercises: Array<{ prompt: string; answer: string }>;
  unknownWords: string[];
}

export function demoCorrect(sentence: string): DemoCorrection {
  let corrected = sentence;
  const errors: RuleHit[] = [];
  const exercises: Array<{ prompt: string; answer: string }> = [];
  for (const r of RULES) {
    const m = corrected.match(r.re);
    if (!m) continue;
    const right = r.fix(m);
    errors.push({ wrong: m[0].trim(), right, rule: r.rule });
    corrected = corrected.replace(m[0], (m[0].match(/^\s*/)?.[0] ?? "") + right);
    exercises.push(...r.exercises);
  }
  if (corrected.length) corrected = corrected[0].toUpperCase() + corrected.slice(1);
  const unknownWords = normalize(sentence)
    .split(" ")
    .filter((w) => w.length > 2 && !/^\d+$/.test(w) && lookup(w).length === 0);
  return { correct: errors.length === 0, corrected, errors, exercises: exercises.slice(0, 4), unknownWords };
}

/** Recherche une fiche de grammaire du parcours correspondant à la question. */
export function demoGrammar(question: string): Array<{ title: string; body: string; lesson: string }> {
  const q = normalize(question);
  const words = q.split(" ").filter((w) => w.length > 3);
  const notes = allLessons().filter((l) => l.grammar).map((l) => ({ ...l.grammar!, lesson: l.title }));
  const scored = notes
    .map((n) => {
      const hay = normalize(`${n.title} ${n.body} ${n.lesson}`);
      return { n, score: words.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map((x) => x.n);
}

/** Réponse du professeur en mode démo (texte). */
export function demoTutorReply(message: string): string {
  const looksItalian = lookup(message.split(/\s+/)[0] ?? "").length > 0 || /\b(sono|ho|mi|io|il|la|che|non)\b/i.test(message);
  const isQuestion = /\?|comment|pourquoi|quand|quelle?|explique|règle|difference|différence/i.test(message);
  if (looksItalian && !/[éèàùç]/.test(message.replace(/[èé]\b/g, "")) && !isQuestion) {
    const c = demoCorrect(message);
    if (c.errors.length) {
      return [
        `✏️ Forme correcte : « ${c.corrected} »`,
        ...c.errors.map((e) => `• « ${e.wrong} » → « ${e.right} » : ${e.rule}`),
        c.exercises.length ? "\n🏋️ Exercices :\n" + c.exercises.map((x, i) => `${i + 1}. ${x.prompt}`).join("\n") : "",
        c.exercises.length ? "\nRéponses : " + c.exercises.map((x, i) => `${i + 1}) ${x.answer}`).join(" · ") : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      "✅ Je n'ai pas détecté d'erreur fréquente dans cette phrase.",
      c.unknownWords.length ? `Mots absents de mon dictionnaire (faute de frappe ?) : ${c.unknownWords.join(", ")}.` : "",
      "ℹ️ Mode démo : seules les erreurs les plus courantes des francophones sont reconnues. Une correction complète nécessite le professeur IA.",
    ]
      .filter(Boolean)
      .join("\n");
  }
  const notes = demoGrammar(message);
  if (notes.length) {
    return notes.map((n) => `📘 ${n.title} (leçon « ${n.lesson} »)\n${n.body}`).join("\n\n");
  }
  return "Mode démo : je peux corriger une phrase italienne (essayez « Io sono 19 anni ») ou retrouver une règle du parcours (essayez « passé composé », « piacere », « subjonctif », « article lo »). Pour des explications libres, le professeur IA doit être connecté.";
}

// ——— Conversations scénarisées (démo) ———
export interface ScriptStep {
  bot: string;
  hint: string;
  expect: string[];
  retry: string;
}
export interface Scenario {
  id: string;
  title: string;
  level: string;
  description: string;
  steps: ScriptStep[];
  end: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "bar",
    title: "Commander au bar",
    level: "A1",
    description: "Vous êtes au comptoir d'un bar à Rome.",
    steps: [
      { bot: "Buongiorno! Cosa prende?", hint: "Commandez une boisson (vorrei..., un caffè...).", expect: ["vorrei", "prendo", "caffè", "cappuccino", "acqua", "tè", "cornetto"], retry: "Scusi, non ho capito. Vuole un caffè? Un cappuccino?" },
      { bot: "Perfetto. Qualcos'altro? Un cornetto?", hint: "Répondez oui ou non (sì, grazie / no, grazie).", expect: ["sì", "si", "no", "grazie", "cornetto"], retry: "Allora, prende anche un cornetto? Sì o no?" },
      { bot: "Ecco a lei. Sono tre euro.", hint: "Remerciez et dites au revoir.", expect: ["grazie", "arrivederci", "buona", "ciao", "ecco"], retry: "Tre euro, prego." },
    ],
    end: "Grazie a lei, buona giornata! 👋",
  },
  {
    id: "presentarsi",
    title: "Faire connaissance",
    level: "A1",
    description: "Une soirée entre amis : quelqu'un vient vous parler.",
    steps: [
      { bot: "Ciao! Io sono Luca. Tu come ti chiami?", hint: "Donnez votre prénom (mi chiamo...).", expect: ["mi chiamo", "sono", "chiamo"], retry: "Scusa? Come ti chiami?" },
      { bot: "Piacere! Di dove sei?", hint: "Dites d'où vous venez (sono francese, di...).", expect: ["sono", "di", "francese", "belga", "svizzero", "canadese", "vengo"], retry: "Sei francese? Di dove sei?" },
      { bot: "Che bello! E cosa fai nella vita?", hint: "Parlez de votre travail ou études (lavoro..., studio...).", expect: ["lavoro", "studio", "sono", "faccio"], retry: "Lavori o studi?" },
      { bot: "Interessante! Perché studi l'italiano?", hint: "Expliquez pourquoi (perché...).", expect: ["perché", "perche", "mi piace", "amo", "voglio", "italia"], retry: "Ti piace l'Italia?" },
    ],
    end: "Bravo, parli già bene! Ci vediamo! 🎉",
  },
  {
    id: "strada",
    title: "Demander son chemin",
    level: "A2",
    description: "Vous cherchez la gare à Florence.",
    steps: [
      { bot: "Buongiorno, posso aiutarla?", hint: "Demandez où est la gare (scusi, dov'è...?).", expect: ["dov", "dove", "stazione", "cerco"], retry: "Cosa cerca, scusi?" },
      { bot: "La stazione? Vada sempre dritto e poi giri a sinistra.", hint: "Demandez si c'est loin (è lontano?).", expect: ["lontano", "vicino", "quanto", "minuti"], retry: "Ha capito? Dritto e poi a sinistra." },
      { bot: "No, sono cinque minuti a piedi.", hint: "Remerciez.", expect: ["grazie", "gentile", "arrivederci"], retry: "Prego!" },
    ],
    end: "Si figuri! Buon viaggio! 🚆",
  },
];

export function scriptedReply(scenario: Scenario, stepIndex: number, userText: string): { reply: string; advance: boolean } {
  const step = scenario.steps[stepIndex];
  if (!step) return { reply: scenario.end, advance: false };
  const t = userText.toLowerCase();
  const ok = step.expect.some((k) => t.includes(k));
  const corr = demoCorrect(userText);
  const note = corr.errors.length ? `\n💡 ${corr.errors.map((e) => `« ${e.wrong} » → « ${e.right} »`).join(" ; ")}` : "";
  if (!ok) return { reply: step.retry + note, advance: false };
  const next = scenario.steps[stepIndex + 1];
  return { reply: (next ? next.bot : scenario.end) + note, advance: true };
}
