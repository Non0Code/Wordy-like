import { memo, useMemo } from "react";
import { analyze } from "../content";
import type { Token } from "../core/analysis";
import type { VocabRecord } from "../core/types";
import type { WordTarget } from "./WordSheet";

/**
 * Texte italien dont chaque mot est cliquable. Le soulignement indique le
 * statut du mot dans le vocabulaire personnel (inconnu / en apprentissage).
 */
export const InteractiveText = memo(function InteractiveText({
  text,
  translation,
  vocab,
  onWord,
  senses,
  activeWord,
  source,
}: {
  text: string;
  translation?: string;
  vocab: Map<string, VocabRecord>;
  onWord: (t: WordTarget) => void;
  senses?: Record<string, number>;
  activeWord?: string | null;
  source?: WordTarget["source"];
}) {
  const tokens = useMemo(() => analyze(text), [text]);
  return (
    <span lang="it">
      {tokens.map((t, i) => {
        if (!t.isWord) return <span key={i}>{t.text}</span>;
        const id = t.expressionId ?? t.entryIds[0];
        const rec = id ? vocab.get(id) : undefined;
        const cls = !id && t.proper ? "s-none" : rec ? `s-${rec.status}` : "s-unknown";
        return (
          <span
            key={i}
            role="button"
            tabIndex={0}
            className={`word ${cls} ${t.expressionId ? "expr" : ""} ${activeWord === t.norm ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onWord(targetFor(t, tokens, text, translation, senses, source));
            }}
            onKeyDown={(e) => e.key === "Enter" && onWord(targetFor(t, tokens, text, translation, senses, source))}
          >
            {t.text}
          </span>
        );
      })}
    </span>
  );
});

function targetFor(
  t: Token,
  tokens: Token[],
  text: string,
  translation: string | undefined,
  senses: Record<string, number> | undefined,
  source: WordTarget["source"],
): WordTarget {
  const id = t.entryIds[0];
  return {
    surface: t.text,
    entryIds: t.entryIds,
    expressionId: t.expressionId,
    sentence: text,
    translation,
    tokens,
    wordIndex: t.wordIndex,
    annotatedSense: id && senses ? senses[id] : undefined,
    source,
  };
}
