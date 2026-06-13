function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, v));
}

export function adjustBrightness(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(clamp(r + amount), clamp(g + amount), clamp(b + amount));
}

export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function buildCustomThemeVars(accent: string, bg: string): Record<string, string> {
  return {
    '--accent':        accent,
    '--accent-hover':  adjustBrightness(accent, 30),
    '--accent-dim':    hexToRgba(accent, 0.12),
    '--accent-border': hexToRgba(accent, 0.3),
    '--text-cursor':   accent,
    '--shadow-accent': `0 0 20px ${hexToRgba(accent, 0.2)}`,
    '--bg-primary':    bg,
    '--bg-secondary':  adjustBrightness(bg, 10),
    '--bg-tertiary':   adjustBrightness(bg, 18),
    '--bg-card':       adjustBrightness(bg, 8),
    '--bg-hover':      adjustBrightness(bg, 22),
    '--border':        adjustBrightness(bg, 24),
  };
}
