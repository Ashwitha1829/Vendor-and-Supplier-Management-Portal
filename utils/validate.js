function requiredText(value, label, max = 120) {
  if (typeof value !== 'string' || !value.trim()) return `${label} is required.`;
  if (value.trim().length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}
function optionalText(value, label, max = 500) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > max) return `${label} must be text with at most ${max} characters.`;
  return null;
}
function validEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
module.exports = { requiredText, optionalText, validEmail };
