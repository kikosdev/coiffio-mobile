export const DEFAULT_PHONE_PREFIX = '+216';

/**
 * Strict validator/normalizer for Tunisian mobile numbers — unlike joinPhoneNumber/
 * splitPhoneNumber (UI helpers for a prefix+local input pair), this never guesses or
 * silently repairs malformed input. Accepts a bare 8-digit local number or one already
 * carrying a +216/216 country code; anything that isn't exactly 8 digits once the country
 * code is stripped is rejected outright.
 *
 * @returns '+216 XX XXX XXX' on success, or `null` if the input isn't a valid 8-digit
 * Tunisian mobile number — callers must handle the rejection explicitly, never coerce it.
 */
export function normalizePhone(input: string): string | null {
  const digitsOnly = input.replace(/\D/g, '');
  const local = digitsOnly.startsWith('216') && digitsOnly.length > 8
    ? digitsOnly.slice(3)
    : digitsOnly;
  if (local.length !== 8) return null;
  return `${DEFAULT_PHONE_PREFIX} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
}

export function normalizePhonePrefix(value: string): string {
  const digits = value.replace(/[^\d]/g, '').slice(0, 4);
  return digits ? `+${digits}` : '+';
}

export function joinPhoneNumber(prefix: string, local: string): string {
  const trimmed = local.trim();
  if (trimmed.startsWith('+')) return trimmed.replace(/\s+/g, ' ');
  return `${normalizePhonePrefix(prefix)} ${trimmed}`.trim().replace(/\s+/g, ' ');
}

export function splitPhoneNumber(value: string, fallbackPrefix = DEFAULT_PHONE_PREFIX): { prefix: string; local: string } {
  const trimmed = value.trim();
  if (trimmed.startsWith(DEFAULT_PHONE_PREFIX)) {
    return {
      prefix: DEFAULT_PHONE_PREFIX,
      local: trimmed.slice(DEFAULT_PHONE_PREFIX.length).replace(/^[\s-]+/, ''),
    };
  }
  const match = trimmed.match(/^(\+\d{1,4})[\s-]*(.*)$/);
  if (!match) return { prefix: fallbackPrefix, local: trimmed };
  return { prefix: normalizePhonePrefix(match[1]), local: match[2] ?? '' };
}
