// Share to X helpers. X counts any link as 23 characters.
export const X_LIMIT = 280;
export const X_LINK_LENGTH = 23;

export function truncateForX(text, appUrl = "", limit = X_LIMIT) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  const reserve = appUrl ? X_LINK_LENGTH + 1 : 0; // link plus a space or newline before it
  const room = limit - reserve;
  let body = clean;
  if ([...body].length > room) {
    const chars = [...body].slice(0, room - 3).join("");
    const lastSpace = chars.lastIndexOf(" ");
    body = (lastSpace > room * 0.6 ? chars.slice(0, lastSpace) : chars).replace(/[\s,;:.]+$/, "") + "...";
  }
  return appUrl ? `${body}\n${appUrl}` : body;
}

export function xIntentUrl(text, appUrl = "") {
  return `https://x.com/intent/post?text=${encodeURIComponent(truncateForX(text, appUrl))}`;
}
