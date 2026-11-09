/**
 * Professeur d'italien IA (API Claude d'Anthropic).
 * Activé uniquement si ANTHROPIC_API_KEY est défini côté serveur : la clé
 * n'est jamais exposée au navigateur. Sans clé, /api/health renvoie ai=false
 * et l'interface bascule en « mode démo » clairement signalé.
 */
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.PARLA_AI_MODEL ?? "claude-opus-5-5";

let client: Anthropic | null = null;
export function aiAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ChatInput {
  mode: "tutor" | "conversation";
  level: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  weakWords?: Array<{ lemma: string; translation: string }>;
  scenario?: string;
}

function systemPrompt(input: ChatInput): string {
  const weak = (input.weakWords ?? []).slice(0, 25).map((w) => `${w.lemma} (${w.translation})`).join(", ");
  const common = `L'apprenant est francophone et apprend l'italien. Son niveau CECRL actuel est ${input.level}.
Adapte strictement ton vocabulaire et tes structures à ce niveau (phrases courtes et fréquentes en A1-A2, registre plus riche en C1-C2).
${weak ? `Mots que l'apprenant maîtrise mal et qu'il faut réutiliser naturellement quand c'est pertinent : ${weak}.` : ""}`;
  if (input.mode === "conversation") {
    return `Tu es un partenaire de conversation italien, chaleureux et naturel.
${common}
Scénario : ${input.scenario ?? "conversation libre de la vie quotidienne"}.
Règles :
- Réponds UNIQUEMENT en italien dans la conversation, en 1 à 3 phrases, et termine le plus souvent par une question pour relancer.
- Si le dernier message de l'apprenant contient des erreurs, ajoute après ta réponse une ligne séparée commençant par « 💡 » qui donne en français la forme correcte et une explication très brève. S'il n'y a pas d'erreur, n'ajoute pas cette ligne.
- N'utilise pas de Markdown.`;
  }
  return `Tu es un professeur particulier d'italien, bienveillant et précis.
${common}
Ce que tu fais :
- Tu expliques les règles de grammaire en français, avec des exemples italiens traduits.
- Quand l'apprenant écrit une phrase en italien, tu la corriges : donne la forme correcte, explique chaque erreur en français (pourquoi), puis propose 2 ou 3 petits exercices ciblés (avec les réponses à la fin, séparées).
- Exemple : « Io sono 19 anni » → « Ho 19 anni » : en italien l'âge s'exprime avec le verbe avere, comme en français.
- Tu identifies les lacunes récurrentes et tu les signales.
Format : texte simple, paragraphes courts, listes avec des tirets si utile, pas de tableaux.`;
}

async function call(params: {
  system: string;
  messages: Anthropic.Beta.Messages.BetaMessageParam[];
  effort: "low" | "medium";
  format?: { type: "json_schema"; schema: Record<string, unknown> };
}): Promise<string> {
  if (!aiAvailable()) throw new AiError(503, "Aucune clé API configurée sur le serveur.");
  try {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: params.system,
      messages: params.messages,
      output_config: { effort: params.effort, ...(params.format ? { format: params.format } : {}) },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
    if (response.stop_reason === "refusal") {
      throw new AiError(422, "Le professeur IA n'a pas pu répondre à cette demande. Reformulez votre message.");
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) throw new AiError(502, "Réponse vide du service IA.");
    return text;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.AuthenticationError) throw new AiError(502, "Clé API refusée par le service IA.");
    if (e instanceof Anthropic.RateLimitError) throw new AiError(429, "Service IA saturé, réessayez dans un instant.");
    if (e instanceof Anthropic.BadRequestError) throw new AiError(400, "Requête IA invalide : " + e.message);
    if (e instanceof Anthropic.APIError) throw new AiError(502, `Erreur du service IA (${e.status ?? "réseau"}).`);
    throw new AiError(502, "Service IA injoignable.");
  }
}

function sanitizeMessages(messages: ChatInput["messages"]) {
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-30)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  // L'API exige que la conversation commence par un message utilisateur.
  while (clean.length && clean[0].role !== "user") clean.shift();
  if (!clean.length) throw new AiError(400, "Message vide.");
  return clean;
}

export async function chat(input: ChatInput): Promise<string> {
  return call({ system: systemPrompt(input), messages: sanitizeMessages(input.messages), effort: "low" });
}

export interface Correction {
  correct: boolean;
  corrected: string;
  explanation: string;
  errors: Array<{ wrong: string; right: string; rule: string }>;
  exercises: Array<{ prompt: string; answer: string }>;
}

const CORRECTION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["correct", "corrected", "explanation", "errors", "exercises"],
  properties: {
    correct: { type: "boolean" },
    corrected: { type: "string" },
    explanation: { type: "string" },
    errors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["wrong", "right", "rule"],
        properties: { wrong: { type: "string" }, right: { type: "string" }, rule: { type: "string" } },
      },
    },
    exercises: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["prompt", "answer"],
        properties: { prompt: { type: "string" }, answer: { type: "string" } },
      },
    },
  },
};

export async function correct(sentence: string, level: string): Promise<Correction> {
  const text = await call({
    system: `Tu corriges des phrases italiennes écrites par un francophone de niveau ${level}. Les explications sont en français, courtes et pédagogiques. Propose 2 exercices ciblés sur les erreurs (ou sur la structure utilisée si la phrase est correcte).`,
    messages: [{ role: "user", content: `Phrase à corriger : « ${sentence.slice(0, 1000)} »` }],
    effort: "medium",
    format: { type: "json_schema", schema: CORRECTION_SCHEMA },
  });
  try {
    return JSON.parse(text) as Correction;
  } catch {
    throw new AiError(502, "Réponse IA illisible.");
  }
}

export async function translateInContext(word: string, sentence: string): Promise<{ translation: string; explanation: string }> {
  const text = await call({
    system: "Tu es un dictionnaire italien-français contextuel. Donne la traduction du mot TELLE QU'ELLE S'APPLIQUE DANS CETTE PHRASE (pas la traduction littérale par défaut), puis une explication d'une ou deux phrases en français.",
    messages: [{ role: "user", content: `Mot : « ${word.slice(0, 80)} »\nPhrase : « ${sentence.slice(0, 600)} »` }],
    effort: "low",
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["translation", "explanation"],
        properties: { translation: { type: "string" }, explanation: { type: "string" } },
      },
    },
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError(502, "Réponse IA illisible.");
  }
}
