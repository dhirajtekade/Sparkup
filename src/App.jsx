import { BrowserRouter as Router } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";

// Configuration & Routes
import theme from "./theme"; // Import the newly extracted theme
import AppRoutes from "./AppRoutes"; // Import the newly extracted routes

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
