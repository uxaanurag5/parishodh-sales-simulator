function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function wordsClose(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))) return true;
  return false;
}

/**
 * Greedily walks the spoken words against the suggestion's words in order,
 * tolerating small mismatches (filler words, partial STT results) by
 * skipping ahead a little before giving up on a word. Used both for the
 * learner-facing karaoke highlight and the server-side adherence score.
 */
export function wordMatchProgress(
  suggestion: string,
  spoken: string,
): { matchedWords: number; totalWords: number; ratio: number } {
  const suggestionWords = tokenize(suggestion);
  const spokenWords = tokenize(spoken);
  const totalWords = suggestionWords.length;

  if (totalWords === 0) return { matchedWords: 0, totalWords: 0, ratio: 0 };

  let cursor = 0;
  for (const word of spokenWords) {
    for (let lookahead = 0; lookahead < 3 && cursor + lookahead < suggestionWords.length; lookahead++) {
      if (wordsClose(suggestionWords[cursor + lookahead]!, word)) {
        cursor += lookahead + 1;
        break;
      }
    }
  }

  const matchedWords = Math.min(cursor, totalWords);
  return { matchedWords, totalWords, ratio: matchedWords / totalWords };
}
