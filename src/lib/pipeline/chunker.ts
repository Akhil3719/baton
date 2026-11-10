import { SourceType } from "@/types/handover";

export interface ParsedPassage {
  idx: number;
  locator: string;
  text: string;
  author: string | null;
  timestamp: string | null;
  charStart?: number;
  charEnd?: number;
}

/**
 * Parses GitHub Issues export JSON into structured, numbered passages.
 */
export function parseGitHubIssues(rawText: string): ParsedPassage[] {
  const passages: ParsedPassage[] = [];
  let idx = 1;

  try {
    const issues = JSON.parse(rawText);
    if (!Array.isArray(issues)) {
      return fallbackLineParser(rawText);
    }

    for (const issue of issues) {
      const issueNum = issue.number || issue.id || idx;
      const issueTitle = issue.title || "Untitled Issue";
      const issueAuthor = issue.author || "unknown";
      const issueTime = issue.created_at || null;
      const issueBody = issue.body || "";

      // Issue body segment
      const bodyText = `Issue #${issueNum}: ${issueTitle}\nStatus: ${issue.status || 'unknown'}\nAssignee: ${issue.assignee || 'None'}\n${issueBody}`.trim();

      passages.push({
        idx: idx++,
        locator: `Issue #${issueNum} (description)`,
        text: bodyText,
        author: issueAuthor,
        timestamp: issueTime,
      });

      // Issue comments segments
      if (Array.isArray(issue.comments)) {
        for (let cIdx = 0; cIdx < issue.comments.length; cIdx++) {
          const c = issue.comments[cIdx];
          const commentAuthor = c.author || "unknown";
          const commentTime = c.created_at || null;
          const commentBody = c.body || "";

          passages.push({
            idx: idx++,
            locator: `Issue #${issueNum} (comment #${cIdx + 1})`,
            text: `Comment on Issue #${issueNum} by ${commentAuthor}:\n${commentBody}`.trim(),
            author: commentAuthor,
            timestamp: commentTime,
          });
        }
      }
    }
  } catch {
    return fallbackLineParser(rawText);
  }

  return passages;
}

/**
 * Parses Markdown meeting notes into section-based numbered passages.
 */
export function parseMarkdownNotes(rawText: string, defaultAuthor: string = "Meeting Notes"): ParsedPassage[] {
  const passages: ParsedPassage[] = [];
  const lines = rawText.split(/\r?\n/);
  let idx = 1;

  // Extract document-level date or metadata if present
  let docDate: string | null = null;
  for (const line of lines.slice(0, 8)) {
    const dateMatch = line.match(/\*\*Date:\*\*\s*([^\s*]+)/i);
    if (dateMatch) {
      docDate = dateMatch[1].trim();
      break;
    }
  }

  let currentHeading = "Document Header";
  let currentLines: string[] = [];
  let startLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isHeading = line.match(/^#{1,3}\s+(.+)$/);

    if (isHeading) {
      if (currentLines.length > 0 && currentLines.join("").trim().length > 0) {
        passages.push({
          idx: idx++,
          locator: `Lines ${startLine}-${i} (${currentHeading})`,
          text: currentLines.join("\n").trim(),
          author: defaultAuthor,
          timestamp: docDate,
        });
        currentLines = [];
      }
      currentHeading = isHeading[1].trim();
      startLine = i + 1;
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 && currentLines.join("").trim().length > 0) {
    passages.push({
      idx: idx++,
      locator: `Lines ${startLine}-${lines.length} (${currentHeading})`,
      text: currentLines.join("\n").trim(),
      author: defaultAuthor,
      timestamp: docDate,
    });
  }

  return passages.length > 0 ? passages : fallbackLineParser(rawText);
}

/**
 * Parses Chat export text into discrete message passages with exact timestamps and authors.
 */
export function parseChatExport(rawText: string): ParsedPassage[] {
  const passages: ParsedPassage[] = [];
  const lines = rawText.split(/\r?\n/);
  let idx = 1;

  // Regex for formats like: [2026-10-20 14:12:05] [alex.leaver]: Message text
  const chatRegex = /^\[([^\]]+)\]\s*\[([^\]]+)\]:\s*(.*)$/;

  let pendingPassage: ParsedPassage | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const match = line.match(chatRegex);
    if (match) {
      if (pendingPassage) {
        passages.push(pendingPassage);
      }
      const timestamp = match[1].trim();
      const author = match[2].trim();
      const message = match[3].trim();

      pendingPassage = {
        idx: idx++,
        locator: `Chat Message #${idx - 1} (Line ${i + 1})`,
        text: `[${timestamp}] [${author}]: ${message}`,
        author,
        timestamp,
      };
    } else if (pendingPassage) {
      // Continuation line for multi-line chat messages
      pendingPassage.text += `\n${line.trim()}`;
    } else {
      // Fallback for lines without standard prefix
      passages.push({
        idx: idx++,
        locator: `Line ${i + 1}`,
        text: line.trim(),
        author: "unknown",
        timestamp: null,
      });
    }
  }

  if (pendingPassage) {
    passages.push(pendingPassage);
  }

  return passages.length > 0 ? passages : fallbackLineParser(rawText);
}

/**
 * Fallback parser that chunks by paragraph or line ranges.
 */
function fallbackLineParser(rawText: string): ParsedPassage[] {
  const paragraphs = rawText.split(/\n\s*\n/);
  return paragraphs
    .map((p, i) => ({
      idx: i + 1,
      locator: `Paragraph #${i + 1}`,
      text: p.trim(),
      author: null,
      timestamp: null,
    }))
    .filter((p) => p.text.length > 0);
}

/**
 * Unified entrypoint to parse source text by type.
 */
export function parseSourceText(type: SourceType, rawText: string, defaultAuthor?: string): ParsedPassage[] {
  switch (type) {
    case "github":
      return parseGitHubIssues(rawText);
    case "notes":
      return parseMarkdownNotes(rawText, defaultAuthor);
    case "chat":
      return parseChatExport(rawText);
    default:
      return fallbackLineParser(rawText);
  }
}
