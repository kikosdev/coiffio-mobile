export const DEFAULT_PHONE_PREFIX = '+216';

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
