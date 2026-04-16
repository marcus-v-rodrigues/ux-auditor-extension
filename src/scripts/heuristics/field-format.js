function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function countMatches(text, pattern) {
  const matches = String(text ?? '').match(pattern);
  return matches ? matches.length : 0;
}

function buildShape(value) {
  return String(value ?? '')
    .replace(/[0-9]/g, 'D')
    .replace(/[A-Za-zÀ-ÿ]/g, 'L')
    .replace(/\s/g, 'S')
    .replace(/[^DLS]/g, 'P');
}

function classifyValueKind(profile) {
  if (!profile) return 'unknown';
  const { digit_count: digits, letter_count: letters, whitespace_count: spaces, separator_count: separators } = profile;

  if (digits > 0 && letters === 0 && spaces === 0 && separators === 0) return 'numeric_only';
  if (letters > 0 && digits === 0 && spaces === 0 && separators === 0) return 'alphabetic_only';
  if (digits > 0 && letters > 0 && spaces === 0 && separators === 0) return 'alphanumeric';
  if (digits > 0 && (spaces > 0 || separators > 0) && letters === 0) return 'formatted_numeric';
  if (letters > 0 && (spaces > 0 || separators > 0) && digits === 0) return 'formatted_text';
  if (digits > 0 && letters > 0 && (spaces > 0 || separators > 0)) return 'formatted_alphanumeric';
  if (digits === 0 && letters === 0 && (spaces > 0 || separators > 0)) return 'symbolic_or_spaced';
  return 'mixed';
}

function normalizePlaceholder(placeholder) {
  return cleanText(placeholder).replace(/\s+/g, ' ');
}

function buildPatternSignature(placeholder) {
  const normalized = normalizePlaceholder(placeholder);
  if (!normalized) return null;

  const digitCount = countMatches(normalized, /[0-9]/g);
  if (!digitCount) return null;

  const digitGroups = normalized.match(/[0-9]+/g)?.map((group) => group.length) || [];
  const literalParts = normalized.split(/[0-9]+/g);
  const patternShape = normalized.replace(/[0-9]/g, 'D');

  return {
    placeholder: normalized,
    digit_count: digitCount,
    digit_groups: digitGroups,
    literal_parts: literalParts,
    pattern_shape: patternShape,
  };
}

function buildExpectedShape(signature) {
  if (!signature) return null;
  return signature.pattern_shape;
}

export function buildValueProfile(value) {
  const text = String(value ?? '');
  const digits = countMatches(text, /[0-9]/g);
  const letters = countMatches(text, /[A-Za-zÀ-ÿ]/g);
  const spaces = countMatches(text, /\s/g);
  const separators = Math.max(text.length - digits - letters - spaces, 0);

  return {
    raw_length: text.length,
    digit_count: digits,
    letter_count: letters,
    whitespace_count: spaces,
    separator_count: separators,
    has_formatting_characters: separators > 0 || spaces > 0,
    shape: buildShape(text),
    pattern_shape: text.replace(/[0-9]/g, 'D'),
    value_kind: classifyValueKind({
      digit_count: digits,
      letter_count: letters,
      whitespace_count: spaces,
      separator_count: separators,
    }),
    has_digits: digits > 0,
    has_letters: letters > 0,
  };
}

export function inferFieldFormatHint(context = {}) {
  const placeholder = cleanText(context.placeholder);
  const pattern = buildPatternSignature(placeholder);
  const hasFormatAttributes = Boolean(pattern) || Boolean(cleanText(context.pattern));

  if (!pattern && !hasFormatAttributes) {
    return null;
  }

  return {
    kind: 'patterned_input',
    source: pattern ? 'placeholder' : 'attributes',
    expected_shape: buildExpectedShape(pattern),
    expected_digit_count: pattern?.digit_count ?? null,
    expected_digit_groups: pattern?.digit_groups ?? null,
    placeholder: placeholder || null,
    pattern_attributes: {
      type: cleanText(context.type) || null,
      autocomplete: cleanText(context.autocomplete) || null,
      inputMode: cleanText(context.inputMode) || null,
      pattern: cleanText(context.pattern) || null,
    },
  };
}

export function detectFieldFormatMismatch(valueProfile, formatHint) {
  if (!valueProfile || !formatHint) return null;

  if (formatHint.expected_digit_count && valueProfile.digit_count !== formatHint.expected_digit_count) {
    return {
      kind: 'format_missing',
      reason: 'digit_count_does_not_match_expected_pattern',
      expected: formatHint,
      observed: valueProfile,
    };
  }

  if (formatHint.expected_shape && valueProfile.pattern_shape !== formatHint.expected_shape) {
    return {
      kind: 'format_missing',
      reason: 'observed_shape_does_not_match_expected_pattern',
      expected: formatHint,
      observed: valueProfile,
    };
  }

  if (formatHint.expected_digit_count && valueProfile.digit_count >= formatHint.expected_digit_count && !valueProfile.has_formatting_characters && /[^\d]/.test(formatHint.expected_shape || '')) {
    return {
      kind: 'format_missing',
      reason: 'expected_formatting_characters_were_missing',
      expected: formatHint,
      observed: valueProfile,
    };
  }

  return null;
}

export function summarizeObservedValue(valueProfile) {
  if (!valueProfile) return null;

  return {
    raw_length: valueProfile.raw_length,
    digit_count: valueProfile.digit_count,
    letter_count: valueProfile.letter_count,
    whitespace_count: valueProfile.whitespace_count,
    separator_count: valueProfile.separator_count,
    value_kind: valueProfile.value_kind,
    has_formatting_characters: valueProfile.has_formatting_characters,
    pattern_shape: valueProfile.pattern_shape,
  };
}
