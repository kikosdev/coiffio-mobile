// Character sets exclude common lookalikes (0/O, 1/l/I) so a password read off a screen and
// typed on a phone keyboard by someone else isn't a guessing game.
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function pick(charset: string): string {
  return charset[Math.floor(Math.random() * charset.length)];
}

function shuffle(chars: string[]): string[] {
  const out = [...chars];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Generates a readable strong password: at least one uppercase, one lowercase, one digit and
 * one symbol, padded to `length` (12+ recommended) from the combined set, then shuffled. Not
 * cryptographically secure (`Math.random`) — fine for a one-time initial password the owner
 * hands off and the staff member is expected to change; not used for anything else.
 */
export function genPassword(length = 12): string {
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const padCount = Math.max(0, length - required.length);
  const padding = Array.from({ length: padCount }, () => pick(ALL));
  return shuffle([...required, ...padding]).join('');
}
