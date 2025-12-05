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
import StudentLayout from "./layouts/StudentLayout";
import StudentTrackerPage from "./pages/student/StudentTrackerPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import IconTestPage from "./pages/IconTestPage";
import AdminLayout from "./layouts/AdminLayout";
import ManageTeachersPage from "./pages/admin/ManageTeachersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

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
            <Route path="/test-icons" element={<IconTestPage />} />

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

            <Route element={<ProtectedRoute requiredRole="admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                {/* Default redirect to teachers page */}
                <Route
                  index
                  element={<Navigate to="/admin/teachers" replace />}
                />

                <Route path="teachers" element={<ManageTeachersPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            {/* --- STUDENT ROUTES SECTION --- */}
            {/* Student layout will come later, for now this is fine */}
            <Route element={<ProtectedRoute requiredRole="student" />}>
              {/* 2. Wrap student routes in the layout */}
              <Route path="/student" element={<StudentLayout />}>
                {/* Default to tracker */}
                <Route
                  index
                  element={<Navigate to="/student/dashboard" replace />}
                />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="tracker" element={<StudentTrackerPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
              </Route>
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
