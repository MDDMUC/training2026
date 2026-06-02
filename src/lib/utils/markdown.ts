// Tiny dependency-free Markdown renderer for short notes.
// Supports: **bold**, *italic* / _italic_, `code`, line breaks, autolinks.
// Escapes everything else.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderInlineMarkdown(input: string): string {
  if (!input) return '';
  let s = escapeHtml(input);

  // Code spans first (so their content isn't further parsed)
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);

  // Bold **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text* or _text_ (avoid matching list bullets / underscores in words)
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  s = s.replace(/(?<![A-Za-z0-9_])_([^_\n]+)_(?![A-Za-z0-9_])/g, '<em>$1</em>');

  // Autolinks for http(s) URLs
  s = s.replace(/(https?:\/\/[^\s<]+)/g, (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`);

  // Line breaks
  s = s.replace(/\n/g, '<br />');

  return s;
}
