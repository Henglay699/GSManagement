/**
 * Opens the print dialog with `fileTitle` as the document title, which
 * browsers use as the default file name when saving to PDF.
 */
export function printDocument(fileTitle: string) {
  const previous = document.title;
  const restore = () => {
    document.title = previous;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  document.title = fileTitle;
  window.print();
}

/** Safe for a file name: "Vichea Thnin" → "Vichea-Thnin". */
export const fileSlug = (text: string) =>
  text
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
