/** Test-only: old buggy wiki cite attribute concat (WARN regression). Not for production. */
export function buggyWikiHrefAttr(href) {
  return '<a href="' + href + '">';
}
