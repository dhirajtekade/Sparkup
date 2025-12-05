import { createTheme, responsiveFontSizes } from "@mui/material";

// --- MODERN THEME DEFINITION (Age 13-21 Demographic) ---
// - Font: Poppins (geometric, friendly, modern)
// - Colors: Vibrant Indigo/Violet primary, energetic Teal secondary.
// - Shapes: Rounder corners, softer shadows for a "digital app" feel.

let theme = createTheme({
  typography: {
    fontFamily: "'Poppins', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600, letterSpacing: "-0.02em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#6C63FF", // Vibrant digital indigo
      light: "#9089fc",
      dark: "#4b44b8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#00CEC9", // Energetic teal/cyan
      light: "#5ffbf7",
      dark: "#009c98",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F4F7FE", // Slight cool gray-blue tint
      paper: "#ffffff",
    },
    text: {
      primary: "#2D3748", // Soft charcoal
      secondary: "#718096",
    },
    success: { main: "#48BB78" }, // Fresher green
    warning: { main: "#F6AD55" }, // Softer orange
    error: { main: "#F56565" }, // Softer red
  },
  shape: {
    borderRadius: 16, // Significant rounding
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30, // Pill-shaped buttons
          padding: "10px 24px",
          boxShadow: "none",
          fontSize: "1rem",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(108, 99, 255, 0.2)",
          },
        },
        containedPrimary: {
          background: "linear-gradient(45deg, #6C63FF 30%, #9089fc 90%)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        elevation1: { boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)" },
        elevation2: { boxShadow: "0px 8px 30px rgba(0, 0, 0, 0.08)" },
        elevation3: { boxShadow: "0px 10px 40px rgba(0, 0, 0, 0.1)" },
        rounded: { borderRadius: 16 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)" },
      },
    },
  },
});

// Make font sizes responsive
theme = responsiveFontSizes(theme);

export default theme;
