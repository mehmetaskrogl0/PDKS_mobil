export const colors = {
  surface: '#FFFFFF',
  onSurface: '#111827',
  surfaceSecondary: '#F4F6F9',
  onSurfaceSecondary: '#4B5563',
  surfaceTertiary: '#E8EEFF',
  onSurfaceTertiary: '#2E5BFF',
  surfaceInverse: '#111827',
  onSurfaceInverse: '#FFFFFF',
  brand: '#2E5BFF',
  brandPrimary: '#2E5BFF',
  brandSecondary: '#1A3BCC',
  brandTertiary: '#E8EEFF',
  onBrandPrimary: '#FFFFFF',
  success: '#22C55E',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#32ADE6',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  divider: '#F3F4F6',
  muted: '#9CA3AF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  strong: {
    shadowColor: '#2E5BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const fonts = {
  mono: 'JetBrainsMono',
  monoBold: 'JetBrainsMono-Bold',
  text: 'PlusJakartaSans',
  textMedium: 'PlusJakartaSans-Medium',
  textSemibold: 'PlusJakartaSans-SemiBold',
  textBold: 'PlusJakartaSans-Bold',
} as const;
