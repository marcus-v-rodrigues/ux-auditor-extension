const SENSITIVE_TYPE_PATTERNS = [
  { pattern: /pass(word)?|senha/i, type: 'password' },
  { pattern: /e-?mail/i, type: 'email' },
  { pattern: /phone|tel|mobile|celular/i, type: 'telephone' },
  { pattern: /cpf/i, type: 'cpf' },
  { pattern: /cnh|rg|document|doc(umento)?/i, type: 'document' },
  { pattern: /credit|card|cc|cart[aã]o/i, type: 'credit_card' },
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

function looksLikeCpf(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11;
}

function looksLikeCard(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 13 && digits.length <= 19;
}

export function classifySensitiveValue(value, context = {}) {
  const normalized = normalizeText(value);
  const haystack = `${context.name ?? ''} ${context.id ?? ''} ${context.placeholder ?? ''} ${context.ariaLabel ?? ''} ${context.tagName ?? ''} ${context.type ?? ''}`;

  for (const rule of SENSITIVE_TYPE_PATTERNS) {
    if (rule.pattern.test(haystack)) return rule.type;
  }

  if (looksLikeEmail(normalized)) return 'email';
  if (looksLikeCpf(normalized)) return 'cpf';
  if (looksLikePhone(normalized)) return 'telephone';
  if (looksLikeCard(normalized)) return 'credit_card';

  return null;
}

export function shouldMaskSensitiveField(element, value = '') {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

  const tagName = element.tagName.toLowerCase();
  const type = normalizeText(element.getAttribute('type')).toLowerCase();
  const name = normalizeText(element.getAttribute('name'));
  const id = normalizeText(element.id);
  const placeholder = normalizeText(element.getAttribute('placeholder'));
  const ariaLabel = normalizeText(element.getAttribute('aria-label'));
  const autoComplete = normalizeText(element.getAttribute('autocomplete'));
  const combined = `${tagName} ${type} ${name} ${id} ${placeholder} ${ariaLabel} ${autoComplete}`;

  if (type === 'password') return true;
  if (/email/.test(combined)) return true;
  if (/tel|phone|mobile|celular/.test(combined)) return true;
  if (/cpf/.test(combined)) return true;
  if (/card|credit|cc/.test(combined)) return true;
  if (/document|rg|cnh/.test(combined)) return true;

  return Boolean(classifySensitiveValue(value, { name, id, placeholder, ariaLabel, tagName, type }));
}

export function createMaskInputFn(contextProvider = () => null) {
  return (text) => {
    const context = contextProvider();
    if (!context) return text;

    const sensitiveType = classifySensitiveValue(text, context);
    if (!sensitiveType) return text;

    return `[[masked:${sensitiveType}]]`;
  };
}
