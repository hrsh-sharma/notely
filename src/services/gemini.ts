/**
 * Gemini AI Service for Notely
 * Uses the Gemini API to generate structured notes on any topic.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

export type AIMode =
  | 'notes'        // Generate structured notes on a topic
  | 'summarize'    // Summarize selected / pasted text
  | 'expand'       // Expand a brief idea into full notes
  | 'questions'    // Generate practice questions on a topic
  | 'simplify';    // Simplify complex text

export interface AIRequest {
  mode: AIMode;
  topic: string;
  extraContext?: string;
  style?: 'bullet' | 'structured' | 'cornell' | 'paragraph';
}

export interface AIResponse {
  success: boolean;
  content?: string;   // raw markdown text returned by Gemini
  error?: string;
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildPrompt(req: AIRequest): string {
  const styleInstructions: Record<string, string> = {
    bullet: 'Use bullet points and sub-bullets. Keep each point concise.',
    structured:
      'Use clear headings (##) and sub-headings (###). Under each heading write 2–5 bullet points.',
    cornell:
      'Format as Cornell Notes: first write "## Key Questions" with 3–5 questions, then "## Notes" with detailed bullet points, then "## Summary" with a short paragraph.',
    paragraph: 'Write in flowing paragraphs with clear topic sentences.',
  };

  const style = req.style ?? 'structured';
  const styleHint = styleInstructions[style];

  switch (req.mode) {
    case 'notes':
      return `You are an expert note-taking assistant. Create comprehensive, well-structured study notes on the following topic for a student's notebook.

Topic: ${req.topic}
${req.extraContext ? `Additional context: ${req.extraContext}` : ''}

Requirements:
- ${styleHint}
- Start with a brief introduction (1–2 sentences)
- Cover the most important concepts, definitions, and examples
- Include key terms in **bold**
- If relevant, add a "Key Takeaways" section at the end
- Use clear, plain language suitable for a student notebook
- Do NOT include any preamble like "Here are your notes:" — just output the notes directly
- Write in Markdown format`;

    case 'summarize':
      return `Summarize the following text into clear, concise notes for a student notebook.

Text to summarize:
${req.topic}

Requirements:
- ${styleHint}
- Extract the most important points
- Use **bold** for key terms
- Keep it shorter than the original
- Output Markdown only, no preamble`;

    case 'expand':
      return `Expand the following brief idea/outline into full, detailed notes suitable for a student notebook.

Idea/Outline: ${req.topic}
${req.extraContext ? `Additional context: ${req.extraContext}` : ''}

Requirements:
- ${styleHint}
- Add explanations, examples, and context
- Use **bold** for key terms
- Output Markdown only, no preamble`;

    case 'questions':
      return `Generate practice questions and answers for the following topic to help a student study.

Topic: ${req.topic}
${req.extraContext ? `Additional context: ${req.extraContext}` : ''}

Requirements:
- Generate 5–8 questions of varying difficulty
- Format each as: **Q: [question]** followed by **A: [answer]**
- Include a mix of definition, conceptual, and application questions
- Output Markdown only, no preamble`;

    case 'simplify':
      return `Rewrite the following text in simpler, easier-to-understand language for a student notebook.

Text: ${req.topic}

Requirements:
- ${styleHint}
- Replace jargon with plain language
- Keep all key information intact
- Output Markdown only, no preamble`;

    default:
      return req.topic;
  }
}

// ── Core API call ─────────────────────────────────────────────────────────────

export async function callGemini(req: AIRequest): Promise<AIResponse> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error:
        'Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file and restart the dev server.',
    };
  }

  const prompt = buildPrompt(req);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg =
        errBody?.error?.message || `API error ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      return { success: false, error: 'Gemini returned an empty response. Please try again.' };
    }

    return { success: true, content: text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error. Check your connection.';
    return { success: false, error: message };
  }
}

// ── Markdown → TipTap JSON ────────────────────────────────────────────────────
// Converts the Gemini markdown response into TipTap-compatible JSON nodes
// so the content can be inserted directly into the editor.

export function markdownToTipTapNodes(markdown: string): object[] {
  const nodes: object[] = [];
  const lines = markdown.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Heading 1
    if (line.startsWith('# ')) {
      nodes.push(makeHeading(line.slice(2).trim(), 1));
      i++;
      continue;
    }
    // Heading 2
    if (line.startsWith('## ')) {
      nodes.push(makeHeading(line.slice(3).trim(), 2));
      i++;
      continue;
    }
    // Heading 3
    if (line.startsWith('### ')) {
      nodes.push(makeHeading(line.slice(4).trim(), 3));
      i++;
      continue;
    }
    // Bullet list items (-, *, +)
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, '').trim());
        i++;
      }
      nodes.push(makeBulletList(items));
      continue;
    }
    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, '').trim());
        i++;
      }
      nodes.push(makeOrderedList(items));
      continue;
    }
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push({ type: 'horizontalRule' });
      i++;
      continue;
    }
    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }
    // Normal paragraph
    nodes.push(makeParagraph(line.trim()));
    i++;
  }

  if (nodes.length === 0) {
    nodes.push({ type: 'paragraph', content: [] });
  }

  return nodes;
}

// ── Node builders ─────────────────────────────────────────────────────────────

function parseInline(text: string): object[] {
  // Handle **bold** and *italic* inline
  const parts: object[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', text: text.slice(last, match.index) });
    }
    if (match[2]) {
      // **bold**
      parts.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] });
    } else if (match[3]) {
      // *italic*
      parts.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] });
    } else if (match[4]) {
      // `code`
      parts.push({ type: 'text', text: match[4], marks: [{ type: 'code' }] });
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    parts.push({ type: 'text', text: text.slice(last) });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', text });
  }

  return parts;
}

function makeParagraph(text: string): object {
  return { type: 'paragraph', content: parseInline(text) };
}

function makeHeading(text: string, level: 1 | 2 | 3): object {
  return {
    type: 'heading',
    attrs: { level },
    content: parseInline(text),
  };
}

function makeBulletList(items: string[]): object {
  return {
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [makeParagraph(item)],
    })),
  };
}

function makeOrderedList(items: string[]): object {
  return {
    type: 'orderedList',
    content: items.map(item => ({
      type: 'listItem',
      content: [makeParagraph(item)],
    })),
  };
}

