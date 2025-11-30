import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

// Auth Imports
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout Import (YOU MISSED THIS IMPORT)
import TeacherLayout from "./layouts/TeacherLayout";

// Page Imports
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentsPage from "./pages/teacher/StudentsPage";
import TasksPage from "./pages/teacher/TasksPage";
import BadgesPage from "./pages/teacher/BadgesPage";
import GoalsPage from "./pages/teacher/GoalsPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* --- TEACHER ROUTES SECTION --- */}
            <Route element={<ProtectedRoute requiredRole="teacher" />}>
              {/* YOU MISSED THIS WRAPPER ROUTE FOR THE LAYOUT */}
              <Route path="/teacher" element={<TeacherLayout />}>
                {/* Default to dashboard when going to /teacher */}
                <Route
                  index
                  element={<Navigate to="/teacher/dashboard" replace />}
                />

                {/* Note: paths here are relative to "/teacher" */}
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="badges" element={<BadgesPage />} />
                <Route path="goals" element={<GoalsPage />} />
              </Route>
            </Route>

            {/* --- STUDENT ROUTES SECTION --- */}
            {/* Student layout will come later, for now this is fine */}
            <Route element={<ProtectedRoute requiredRole="student" />}>
              <Route path="/student/tracker" element={<StudentDashboard />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
