import { createTheme, responsiveFontSizes, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Define color palette constants
const PRIMARY = {
  main: '#2563eb', // Blue
  light: '#3b82f6',
  dark: '#1d4ed8',
  contrastText: '#ffffff',
};

const SECONDARY = {
  main: '#8b5cf6', // Purple
  light: '#a78bfa',
  dark: '#7c3aed',
  contrastText: '#ffffff',
};

const SUCCESS = {
  main: '#10b981', // Green
  light: '#34d399',
  dark: '#059669',
  contrastText: '#ffffff',
};

const INFO = {
  main: '#0ea5e9', // Light Blue
  light: '#38bdf8',
  dark: '#0284c7',
  contrastText: '#ffffff',
};

const WARNING = {
  main: '#f59e0b', // Amber
  light: '#fbbf24',
  dark: '#d97706',
  contrastText: '#ffffff',
};

const ERROR = {
  main: '#ef4444', // Red
  light: '#f87171',
  dark: '#dc2626',
  contrastText: '#ffffff',
};


// Create theme settings based on mode (light/dark)
const getDesignTokens = (mode: PaletteMode): any => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
        // Light mode
        primary: PRIMARY,
        secondary: SECONDARY,
        success: SUCCESS,
        info: INFO,
        warning: WARNING,
        error: ERROR,
        background: {
          default: '#f8fafc',
          paper: '#ffffff',
        },
        text: {
          primary: '#1e293b',
          secondary: '#64748b',
          disabled: '#94a3b8',
        },
        divider: '#e2e8f0',
        action: {
          active: '#64748b',
          hover: alpha('#64748b', 0.05),
          selected: alpha('#64748b', 0.1),
          disabled: '#cbd5e1',
          disabledBackground: '#f1f5f9',
        },
      }
      : {
        // Dark mode
        primary: {
          ...PRIMARY,
          main: '#3b82f6', // Slightly lighter in dark mode
        },
        secondary: {
          ...SECONDARY,
          main: '#a78bfa', // Slightly lighter in dark mode
        },
        success: {
          ...SUCCESS,
          main: '#34d399', // Slightly lighter in dark mode
        },
        info: {
          ...INFO,
          main: '#38bdf8', // Slightly lighter in dark mode
        },
        warning: {
          ...WARNING,
          main: '#fbbf24', // Slightly lighter in dark mode
        },
        error: {
          ...ERROR,
          main: '#f87171', // Slightly lighter in dark mode
        },
        background: {
          default: '#0f172a',
          paper: '#1e293b',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#cbd5e1',
          disabled: '#94a3b8',
        },
        divider: '#334155',
        action: {
          active: '#cbd5e1',
          hover: alpha('#cbd5e1', 0.05),
          selected: alpha('#cbd5e1', 0.1),
          disabled: '#475569',
          disabledBackground: '#334155',
        },
      }),
  },

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },

  custom: {
    cardShadow: "0 2px 12px rgba(0, 0, 0, 0.08)", // for cards
    mediumShadow: "0 4px 20px rgba(0, 0, 0, 0.12)", // for modals/popups
    lightShadow: "0 1px 4px rgba(0, 0, 0, 0.06)", // for inputs or hover
    deepShadow: "0 8px 30px rgba(0, 0, 0, 0.18)", // for large containers
    insetShadow: "inset 0 2px 6px rgba(0,0,0,0.1)", // for inset fields
    glowingShadow: "0 0 10px rgba(33, 150, 243, 0.4)", // for active states
  },

  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.05),0px 1px 1px 0px rgba(0,0,0,0.03),0px 1px 3px 0px rgba(0,0,0,0.05)',
    '0px 3px 1px -2px rgba(0,0,0,0.05),0px 2px 2px 0px rgba(0,0,0,0.03),0px 1px 5px 0px rgba(0,0,0,0.05)',
    '0px 3px 3px -2px rgba(0,0,0,0.05),0px 3px 4px 0px rgba(0,0,0,0.03),0px 1px 8px 0px rgba(0,0,0,0.05)',
    '0px 2px 4px -1px rgba(0,0,0,0.05),0px 4px 5px 0px rgba(0,0,0,0.03),0px 1px 10px 0px rgba(0,0,0,0.05)',
    '0px 3px 5px -1px rgba(0,0,0,0.05),0px 5px 8px 0px rgba(0,0,0,0.03),0px 1px 14px 0px rgba(0,0,0,0.05)',
    '0px 3px 5px -1px rgba(0,0,0,0.05),0px 6px 10px 0px rgba(0,0,0,0.03),0px 1px 18px 0px rgba(0,0,0,0.05)',
    '0px 4px 5px -2px rgba(0,0,0,0.05),0px 7px 10px 1px rgba(0,0,0,0.03),0px 2px 16px 1px rgba(0,0,0,0.05)',
    '0px 5px 5px -3px rgba(0,0,0,0.05),0px 8px 10px 1px rgba(0,0,0,0.03),0px 3px 14px 2px rgba(0,0,0,0.05)',
    '0px 5px 6px -3px rgba(0,0,0,0.05),0px 9px 12px 1px rgba(0,0,0,0.03),0px 3px 16px 2px rgba(0,0,0,0.05)',
    '0px 6px 6px -3px rgba(0,0,0,0.05),0px 10px 14px 1px rgba(0,0,0,0.03),0px 4px 18px 3px rgba(0,0,0,0.05)',
    '0px 6px 7px -4px rgba(0,0,0,0.05),0px 11px 15px 1px rgba(0,0,0,0.03),0px 4px 20px 3px rgba(0,0,0,0.05)',
    '0px 7px 8px -4px rgba(0,0,0,0.05),0px 12px 17px 2px rgba(0,0,0,0.03),0px 5px 22px 4px rgba(0,0,0,0.05)',
    '0px 7px 8px -4px rgba(0,0,0,0.05),0px 13px 19px 2px rgba(0,0,0,0.03),0px 5px 24px 4px rgba(0,0,0,0.05)',
    '0px 7px 9px -4px rgba(0,0,0,0.05),0px 14px 21px 2px rgba(0,0,0,0.03),0px 5px 26px 4px rgba(0,0,0,0.05)',
    '0px 8px 9px -5px rgba(0,0,0,0.05),0px 15px 22px 2px rgba(0,0,0,0.03),0px 6px 28px 5px rgba(0,0,0,0.05)',
    '0px 8px 10px -5px rgba(0,0,0,0.05),0px 16px 24px 2px rgba(0,0,0,0.03),0px 6px 30px 5px rgba(0,0,0,0.05)',
    '0px 8px 11px -5px rgba(0,0,0,0.05),0px 17px 26px 2px rgba(0,0,0,0.03),0px 6px 32px 5px rgba(0,0,0,0.05)',
    '0px 9px 11px -5px rgba(0,0,0,0.05),0px 18px 28px 2px rgba(0,0,0,0.03),0px 7px 34px 6px rgba(0,0,0,0.05)',
    '0px 9px 12px -6px rgba(0,0,0,0.05),0px 19px 29px 2px rgba(0,0,0,0.03),0px 7px 36px 6px rgba(0,0,0,0.05)',
    '0px 10px 13px -6px rgba(0,0,0,0.05),0px 20px 31px 3px rgba(0,0,0,0.03),0px 8px 38px 7px rgba(0,0,0,0.05)',
    '0px 10px 13px -6px rgba(0,0,0,0.05),0px 21px 33px 3px rgba(0,0,0,0.03),0px 8px 40px 7px rgba(0,0,0,0.05)',
    '0px 10px 14px -6px rgba(0,0,0,0.05),0px 22px 35px 3px rgba(0,0,0,0.03),0px 8px 42px 7px rgba(0,0,0,0.05)',
    '0px 11px 14px -7px rgba(0,0,0,0.05),0px 23px 36px 3px rgba(0,0,0,0.03),0px 9px 44px 8px rgba(0,0,0,0.05)',
    '0px 11px 15px -7px rgba(0,0,0,0.05),0px 24px 38px 3px rgba(0,0,0,0.03),0px 9px 46px 8px rgba(0,0,0,0.05)',
  ],


  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          display: 'block',
          maxWidth: '100%',
        },
        a: {
          textDecoration: 'none',
          color: 'inherit',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[700],
          color: theme.palette.mode === 'light' ? theme.palette.grey[700] : theme.palette.grey[200],
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius,
          boxShadow: 'none',
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'scale(1.02)', // Add hover effect
          },
          '&:active': {
            transform: 'scale(0.98)', // Add active effect
          },
        }),
        contained: ({ theme }: any) => ({
          boxShadow: theme.shadows[2],
          '&:hover': {
            boxShadow: theme.shadows[4],
          },
        }),
        containedPrimary: {
          '&:hover': {
            backgroundColor: PRIMARY.dark,
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: SECONDARY.dark,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(PRIMARY.main, 0.15),
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeMedium: {
          padding: '8px 20px',
        },
        sizeLarge: {
          padding: '11px 24px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit',
          fontWeight: 400,
        },
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
        body1: {
          fontSize: '1rem',
          lineHeight: 1.6,
          color: '#4b5563', // Neutral gray for body text
        },
        caption: {
          fontSize: '0.75rem',
          color: '#6b7280', // Lighter gray for captions
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          boxShadow: theme.shadows[3],
          borderRadius: theme.shape.borderRadius * 1.5,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme.shadows[6],
            transform: 'translateY(-4px)', // Add hover lift effect
          },
        }),
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius,
          fontWeight: 500,
          '&.MuiChip-outlined': {
            borderWidth: '1.5px',
          },
        }),
        label: {
          paddingLeft: 12,
          paddingRight: 12,
        },
        icon: {
          marginLeft: 6,
        },
        deleteIcon: {
          marginRight: 6,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius * 1.5,
          boxShadow: theme.shadows[5],
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '24px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 24px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius,
          padding: 8,
          '&:hover': {
            backgroundColor: alpha(theme.palette.action.active, 0.08),
          },
        }),
        sizeSmall: {
          padding: 4,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius,
          '& fieldset': {
            borderWidth: '1.5px',
            borderColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
          },
        }),
        input: {
          padding: '12px 16px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
          },
        },
        notchedOutline: ({ theme }: any) => ({
          borderColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
          transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
        }),
        rounded: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius * 1.5,
        }),
        elevation1: ({ theme }: any) => ({
          boxShadow: theme.shadows[1],
        }),
        elevation2: ({ theme }: any) => ({
          boxShadow: theme.shadows[2],
        }),
        elevation3: ({ theme }: any) => ({
          boxShadow: theme.shadows[3],
        }),
        elevation4: ({ theme }: any) => ({
          boxShadow: theme.shadows[4],
        }),
        elevation5: ({ theme }: any) => ({
          boxShadow: theme.shadows[5],
        }),
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 8px', // Add spacing between rows
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }: { theme: any }) => ({
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '16px',
          '&:first-of-type': {
            borderTopLeftRadius: theme.shape.borderRadius,
            borderBottomLeftRadius: theme.shape.borderRadius,
          },
          '&:last-of-type': {
            borderTopRightRadius: theme.shape.borderRadius,
            borderBottomRightRadius: theme.shape.borderRadius,
          },
        }),
        head: {
          fontWeight: 600,
          color: '#cbd5e1',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }: { theme: any }) => ({
          '&:last-child td': {
            borderBottom: 0,
          },
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.8),
          },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: 'divider',
        },
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 100,
          padding: '12px 16px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          borderRadius: theme.shape.borderRadius,
          padding: '12px 16px',
        }),
        standardSuccess: ({ theme }: any) => ({
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.dark,
        }),
        standardInfo: ({ theme }: any) => ({
          backgroundColor: alpha(theme.palette.info.main, 0.1),
          color: theme.palette.info.dark,
        }),
        standardWarning: ({ theme }: any) => ({
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.dark,
        }),
        standardError: ({ theme }: any) => ({
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.dark,
        }),
        message: {
          padding: '8px 0',
          fontWeight: 500,
        },
        icon: {
          padding: '8px 0',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: ({ theme }: any) => ({
          backgroundColor: theme.palette.grey[800],
          color: theme.palette.common.white,
          fontSize: '0.875rem',
          borderRadius: theme.shape.borderRadius,
          padding: '8px 12px',  
        }),
        arrow: ({ theme }: any) => ({
          color: theme.palette.grey[800],
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }: { theme: any }) => ({
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[2],
          '& .MuiToolbar-root': {
            minHeight: 64,
          },
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }: { theme: any }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[4],
        }),
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }: any) => ({
          border: 'none',
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontWeight: 600,
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
            color: 'white',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.mode === 'light' ? theme.palette.text.primary : theme.palette.text.primary,
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
          '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: 'none',
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiTablePagination-root': {
            color: 'black',
          },
          '& .MuiDataGrid-toolbarContainer': {
            padding: '8px 16px',
            backgroundColor: theme.palette.background.paper,
            '& .MuiButton-root': {
              marginRight: 8,
            },
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-cellContent, & .MuiDataGrid-cellCheckbox, & .MuiDataGrid-booleanCell': {
            color: 'black',
          },
        }),
      },
    },
  },
});

// Create theme with responsive font sizes
const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};

// Export light and dark themes
export const lightTheme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Export default theme (light)
export default lightTheme;

// Theme context types
export interface ThemeContextProps {
  mode: PaletteMode;
  toggleMode: () => void;
}