export const brand = {
  name: 'ACN Institute',
  tagline: 'Inglés con Propósito',
  colors: {
    red: '#B22234',
    redHsl: '0 68% 42%',
    blue: '#3C3B6E',
    blueHsl: '241 30% 33%',
    white: '#FFFFFF',
    whiteHsl: '0 0% 100%',
    foreground: '#1A1A2E',
    foregroundHsl: '241 30% 10%',
    muted: '#F5F5F5',
    mutedHsl: '0 0% 96.1%',
  },
  fonts: {
    heading: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    body: "'Inter', ui-sans-serif, system-ui, sans-serif",
    display: "'Poppins', ui-sans-serif, system-ui, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  assets: {
    isotipo: '/brand/isotipo.svg',
    logo: '/brand/logo.svg',
  },
} as const;

export type Brand = typeof brand;
