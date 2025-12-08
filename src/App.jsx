import { BrowserRouter as Router } from "react-router-dom";

// Contexts
import { AuthProvider } from "./contexts/AuthContext";
// 1. Import the new ThemeContextProvider
import { ThemeContextProvider } from "./contexts/ThemeContext";

// Configuration & Routes
// 2. REMOVED the static theme import: import theme from "./theme";
import AppRoutes from "./AppRoutes";

function App() {
  return (
    // 3. Replace MUI's ThemeProvider & CssBaseline with our custom ThemeContextProvider
    <ThemeContextProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeContextProvider>
  );
}

export default App;
