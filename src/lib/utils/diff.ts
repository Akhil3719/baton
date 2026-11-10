export interface DiffPart {
  type: "added" | "removed" | "unchanged";
  text: string;
}

/**
 * Computes a simple word-level diff between two strings.
 */
export function computeWordDiff(oldStr: string, newStr: string): DiffPart[] {
  if (oldStr === newStr) {
    return [{ type: "unchanged", text: oldStr }];
  }

  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      parts.push({ type: "unchanged", text: oldWords[i] });
      i++;
      j++;
    } else {
      // Find lookahead
      let matchFound = false;
      for (let lookJ = j + 1; lookJ < Math.min(j + 6, newWords.length); lookJ++) {
        if (i < oldWords.length && oldWords[i] === newWords[lookJ]) {
          while (j < lookJ) {
            parts.push({ type: "added", text: newWords[j] });
            j++;
          }
          matchFound = true;
          break;
        }
      }

      if (!matchFound && i < oldWords.length) {
        parts.push({ type: "removed", text: oldWords[i] });
        i++;
      } else if (!matchFound && j < newWords.length) {
        parts.push({ type: "added", text: newWords[j] });
        j++;
      }
    }
  }

  return parts;
}
