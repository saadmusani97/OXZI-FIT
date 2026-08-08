export const darkTheme = {
  bg: '#0E0E0E',
  card: '#28292D',
  cardAlt: '#1C1C1E',
  border: 'rgba(255,255,255,0.07)',
  accent: '#F66C3F',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  track: 'rgba(255,255,255,0.08)',
  tabBar: '#141416',
  tabBorder: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(28,28,30,0.85)',
  glassBg: 'rgba(28,28,30,0.85)',
  blurTint: 'dark' as const,
}

export const lightTheme = {
  bg: '#F5F5F0',
  card: '#FFFFFF',
  cardAlt: '#F0F0EC',
  border: 'rgba(0,0,0,0.07)',
  accent: '#F66C3F',
  text: '#111111',
  textSub: 'rgba(0,0,0,0.5)',
  textMuted: 'rgba(0,0,0,0.35)',
  track: 'rgba(0,0,0,0.08)',
  tabBar: '#FFFFFF',
  tabBorder: 'rgba(0,0,0,0.08)',
  inputBg: 'rgba(255,255,255,0.9)',
  glassBg: 'rgba(255,255,255,0.85)',
  blurTint: 'light' as const,
}

export type Theme = typeof darkTheme

export function getTheme(isDark: boolean): Theme {
  return isDark ? darkTheme : lightTheme
}
