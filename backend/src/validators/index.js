/**
 * Request Validation Helpers
 */
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const validateRequiredFields = (body, fields) => {
  const missing = [];
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      missing.push(field);
    }
  }
  return missing;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRequiredFields
};
