// Test helpers: a strict scanner that walks rendered markup tag by tag.

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[a-zA-Z_:][a-zA-Z0-9_:.-]*(?:="[^"<>]*")?)*)\s*(\/?)>/y;
const ATTR = /\s+([a-zA-Z_:][a-zA-Z0-9_:.-]*)(?:="([^"]*)")?/g;

/**
 * Parse every tag in `html`. Throws if a "<" does not start a well-formed
 * tag, which is exactly what an unescaped payload would cause.
 */
export function scanTags(html) {
  const tags = [];
  let i = 0;
  while ((i = html.indexOf("<", i)) !== -1) {
    TAG.lastIndex = i;
    const m = TAG.exec(html);
    if (!m) throw new Error(`Unparsed "<" at ${i}: ${html.slice(i, i + 40)}`);
    const attributes = {};
    for (const a of m[3].matchAll(ATTR)) attributes[a[1]] = a[2] ?? true;
    tags.push({ closing: m[1] === "/", name: m[2].toLowerCase(), attrs: attributes });
    i = TAG.lastIndex;
  }
  return tags;
}

/** Return the text content of the first element with the given class. */
export function textOf(html, className) {
  const re = new RegExp(`class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<`);
  const m = re.exec(html);
  return m ? m[1] : null;
}
