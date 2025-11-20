// pdf.js
// Small helper that extracts text from a PDF file.
// Nothing complicated, just a clean utility function.

import pdfParse from "pdf-parse";

export async function extractPdfText(fileBuffer) {
  try {
    // If somehow no file was sent, stop early.
    if (!fileBuffer) {
      throw new Error("PDF buffer missing.");
    }

    // pdf-parse does the heavy lifting.
    const data = await pdfParse(fileBuffer);

    // We only care about text for our LLM rules.
    const text = data.text ? data.text.trim() : "";

    return text;
  } catch (err) {
    console.error("Error reading PDF:", err);
    throw new Error("Could not read PDF file.");
  }
}
