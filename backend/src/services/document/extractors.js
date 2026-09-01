const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts text from a PDF file
 */
async function extractPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * Extracts text from a DOCX file
 */
async function extractDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value; // The raw text
}

/**
 * Extracts text from a TXT file
 */
async function extractTxt(filePath) {
  return fs.promises.readFile(filePath, 'utf8');
}

/**
 * Extracts text from a PPTX file (reads binary XML strings or text fallback)
 */
async function extractPptx(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const str = buffer.toString('binary');
    const matches = str.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
    const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    if (text && text.trim().length > 0) {
      return text;
    }
  } catch (e) {
    console.error('PPTX text extraction error:', e);
  }
  return fs.promises.readFile(filePath, 'utf8').catch(() => 'PPTX presentation content');
}

module.exports = {
  extractPdf,
  extractDocx,
  extractTxt,
  extractPptx
};
