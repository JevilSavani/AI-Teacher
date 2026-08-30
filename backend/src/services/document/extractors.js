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
 * Extracts text from a PPTX file
 * Note: PPTX extraction can be complex. For a basic implementation without 
 * heavy dependencies, we'll return a placeholder or use a lightweight library if added.
 * For now, we will throw an error to indicate it needs a dedicated parser if required,
 * or just return a placeholder.
 */
async function extractPptx(filePath) {
  // To fully support PPTX, we would need a package like 'officegen' or a python script.
  // For this phase, we'll return a basic parsed message or throw if unsupported natively.
  throw new Error('PPTX extraction requires an additional parser (e.g. textract or a python service).');
}

module.exports = {
  extractPdf,
  extractDocx,
  extractTxt,
  extractPptx
};
