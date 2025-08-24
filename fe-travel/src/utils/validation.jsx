/**
 * Validation utilities for form inputs
 */

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

/**
 * Validates a password (basic requirements)
 * @param {string} password - The password to validate
 * @param {object} [options] - Validation options
 * @param {number} [options.minLength=6] - Minimum length requirement
 * @param {boolean} [options.requireSpecialChar=false] - Whether to require special characters
 * @returns {boolean} True if password meets requirements
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireSpecialChar = false
  } = options;

  if (!password || password.length < minLength) return false;

  if (requireSpecialChar) {
    const specialChars = /[!@#$%^&*(),.?":{}|<>]/;
    return specialChars.test(password);
  }

  return true;
};

/**
 * Validates a username
 * @param {string} username - The username to validate
 * @param {object} [options] - Validation options
 * @param {number} [options.minLength=3] - Minimum length
 * @param {number} [options.maxLength=20] - Maximum length
 * @returns {boolean} True if username is valid
 */
export const validateUsername = (username, options = {}) => {
  const {
    minLength = 3,
    maxLength = 20
  } = options;

  if (!username) return false;

  const trimmed = username.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) return false;

  // Only allow letters, numbers, underscores and hyphens
  const validChars = /^[a-zA-Z0-9_-]+$/;
  return validChars.test(trimmed);
};

/**
 * Validates a phone number (basic international format)
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if phone number is valid
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  // Basic international phone validation (adjust regex as needed)
  const re = /^\+?[\d\s-]{6,}$/;
  return re.test(phone.trim());
};

/**
 * Validates if two fields match (e.g., password confirmation)
 * @param {string} field1 - First field value
 * @param {string} field2 - Second field value
 * @returns {boolean} True if fields match
 */
export const validateMatch = (field1, field2) => {
  return field1 === field2;
};

/**
 * Validates a date string (YYYY-MM-DD format)
 * @param {string} dateStr - The date string to validate
 * @param {object} [options] - Validation options
 * @param {boolean} [options.futureOnly=false] - Whether to only allow future dates
 * @returns {boolean} True if date is valid
 */
export const validateDate = (dateStr, options = {}) => {
  const { futureOnly = false } = options;
  
  if (!dateStr) return false;
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  if (futureOnly && date < new Date()) return false;

  return true;
};

/**
 * Validates a numeric input
 * @param {string|number} value - The value to validate
 * @param {object} [options] - Validation options
 * @param {number} [options.min] - Minimum value
 * @param {number} [options.max] - Maximum value
 * @returns {boolean} True if value is a valid number within range
 */
export const validateNumber = (value, options = {}) => {
  const { min, max } = options;
  
  if (value === '' || value === null || value === undefined) return false;
  
  const num = Number(value);
  if (isNaN(num)) return false;

  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  return true;
};

/**
 * Validates a required field
 * @param {string} value - The value to check
 * @returns {boolean} True if value is not empty
 */
export const validateRequired = (value) => {
  return !!value && value.trim().length > 0;
};

/**
 * Validates a string length
 * @param {string} value - The value to check
 * @param {object} [options] - Validation options
 * @param {number} [options.min] - Minimum length
 * @param {number} [options.max] - Maximum length
 * @returns {boolean} True if length is within range
 */
export const validateLength = (value, options = {}) => {
  const { min, max } = options;
  
  if (!value && value !== '') value = '';
  
  const length = value.toString().trim().length;

  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;

  return true;
};

// Export all validations as an object for convenience
export default {
  email: validateEmail,
  password: validatePassword,
  username: validateUsername,
  phone: validatePhone,
  match: validateMatch,
  date: validateDate,
  number: validateNumber,
  required: validateRequired,
  length: validateLength
};