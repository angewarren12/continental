/**
 * Design Tokens pour l'application Continental Manager
 * Système de design unifié basé sur la palette de couleurs de la marque
 */

export const designTokens = {
  colors: {
    // Couleurs principales
    primary: {
      main: '#bd0f3b', // Rouge Continental
      light: '#e01a4f',
      dark: '#9a0c2f',
      contrast: '#FFFFFF',
    },
    secondary: {
      main: '#000000', // Noir
      light: '#333333',
      dark: '#000000',
      contrast: '#FFFFFF',
    },
    // Couleurs de fond
    background: {
      default: '#FFFFFF', // Fond clair (changé de #221015)
      paper: '#FAFAFA',
      dark: '#221015', // Pour splash/onboarding
      light: '#F5F5F5',
    },
    // Couleurs de texte
    text: {
      primary: '#000000',
      secondary: '#666666',
      disabled: '#999999',
      inverse: '#FFFFFF',
    },
    // Couleurs de statut
    status: {
      success: '#2E7D32',
      successLight: '#E8F5E9',
      warning: '#FF9800',
      warningLight: '#FFF3E0',
      error: '#DC143C',
      errorLight: '#FFEBEE',
      info: '#2196F3',
      infoLight: '#E3F2FD',
    },
    // Couleurs de paiement
    payment: {
      paid: '#2E7D32',
      pending: '#FF9800',
      failed: '#DC143C',
    },
    // Couleurs de stock
    stock: {
      good: '#2E7D32',
      low: '#FF9800',
      critical: '#DC143C',
    },
  },
  typography: {
    fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif",
    fontFamilySerif: "'Noto Serif', serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
  },
  spacing: {
    unit: 8,
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
    round: '50%',
    full: '9999px',
  },
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.08)',
    medium: '0 2px 8px rgba(0, 0, 0, 0.1)',
    large: '0 4px 16px rgba(0, 0, 0, 0.12)',
    xlarge: '0 8px 24px rgba(0, 0, 0, 0.15)',
    card: '0 2px 12px rgba(0, 0, 0, 0.08)',
    hover: '0 8px 24px rgba(220, 20, 60, 0.15)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
  zIndex: {
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
} as const;

export type DesignTokens = typeof designTokens;
