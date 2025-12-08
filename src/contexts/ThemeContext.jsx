import React, {
  createContext,
  useState,
  useMemo,
  useContext,
  useEffect,
} from "react";
import {
  createTheme,
  ThemeProvider as MuiThemeProvider,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

// Custom hook to use the theme context
export const useThemeMode = () => useContext(ThemeContext);

export const ThemeContextProvider = ({ children }) => {
  // 1. Initialize state based on localStorage or system preference
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("themeMode");
    if (savedMode) {
      return savedMode;
    }
    // Check system preference if no local setting found
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // 2. Function to toggle between light and dark
  const toggleColorMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", newMode); // Save preference
      return newMode;
    });
  };

  // 3. Create the MUI theme object based on the current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#1976d2", // Your primary brand color
          },
          secondary: {
            main: "#dc004e", // Your secondary brand color
          },
          // MUI automatically adjusts background and text colors based on 'mode'
          ...(mode === "dark" && {
            background: {
              default: "#121212", // Standard dark mode background
              paper: "#1e1e1e", // Slightly lighter for cards/papers
            },
          }),
        },
        // You can customize typography, breakpoints, etc., here too
      }),
    [mode]
  );

  // 4. Listen for system preference changes (optional polish)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      // Only auto-switch if the user hasn't manually set a preference
      if (!localStorage.getItem("themeMode")) {
        setMode(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = useMemo(() => ({ mode, toggleColorMode }), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
