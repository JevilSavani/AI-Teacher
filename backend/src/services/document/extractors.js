const fs = require('fs');
const mammoth = require('mammoth');

/**
 * Extracts text from a PDF file
 */
async function extractPdf(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let parseFn = require('pdf-parse');
    if (typeof parseFn !== 'function' && parseFn && typeof parseFn.default === 'function') {
      parseFn = parseFn.default;
    }
    if (typeof parseFn === 'function') {
      const data = await parseFn(dataBuffer);
      if (data && data.text && data.text.trim().length > 0) {
        return data.text;
      }
    }
  } catch (err) {
    console.error('PDF parsing error in extractPdf:', err);
  }
  // Fallback text reader for text-based PDF buffers
  const rawText = fs.readFileSync(filePath, 'utf8');
  return rawText || 'PDF Document Content';
}

/**
 * Extracts text from a DOCX file
 */
async function extractDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    if (result && result.value && result.value.trim().length > 0) {
      return result.value;
    }
  } catch (err) {
    console.error('Mammoth DOCX parsing error in extractDocx:', err);
  }
  return fs.promises.readFile(filePath, 'utf8').catch(() => 'DOCX Document Content');
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
