export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;
export const WISDOM_MIN_LENGTH = 5;
export const WISDOM_MAX_LENGTH = 280;

const USERNAME_PATTERN = /^[a-zA-Z0-9._ -]+$/;
const BLOCKED_USERNAME_TERMS = ['admin', 'moderator', 'support', 'staff', 'fuck', 'shit', 'bitch'];

export const validateUsername = (value: string): string | null => {
  const username = value.trim();

  if (username.length < USERNAME_MIN_LENGTH) return 'Username must be at least 2 characters.';
  if (username.length > USERNAME_MAX_LENGTH) return 'Username must be 30 characters or less.';
  if (!USERNAME_PATTERN.test(username)) return 'Use only letters, numbers, spaces, dots, dashes, or underscores.';

  const normalized = username.toLowerCase();
  if (BLOCKED_USERNAME_TERMS.some(term => normalized.includes(term))) {
    return 'Choose a username without reserved or offensive words.';
  }

  return null;
};

export const validateWisdomText = (label: string, value: string): string | null => {
  const text = value.trim();

  if (text.length < WISDOM_MIN_LENGTH) return `${label} must be at least 5 characters.`;
  if (text.length > WISDOM_MAX_LENGTH) return `${label} must be 280 characters or less.`;

  return null;
};
