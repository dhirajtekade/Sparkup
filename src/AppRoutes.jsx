import { Routes, Route, Navigate } from "react-router-dom";

// Auth Guard
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import TeacherLayout from "./layouts/TeacherLayout";
import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentsPage from "./pages/teacher/StudentsPage";
import TasksPage from "./pages/teacher/TasksPage";
import BadgesPage from "./pages/teacher/BadgesPage";
import GoalsPage from "./pages/teacher/GoalsPage";
import StudentTrackerPage from "./pages/student/StudentTrackerPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import IconTestPage from "./pages/IconTestPage";
import ManageTeachersPage from "./pages/admin/ManageTeachersPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/test-icons" element={<IconTestPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* --- TEACHER ROUTES SECTION --- */}
      <Route element={<ProtectedRoute requiredRole="teacher" />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="goals" element={<GoalsPage />} />
        </Route>
      </Route>

      {/* --- ADMIN ROUTES SECTION --- */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/teachers" replace />} />
          <Route path="teachers" element={<ManageTeachersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {/* --- STUDENT ROUTES SECTION (UPDATED) --- */}
      <Route element={<ProtectedRoute requiredRole="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          {/* 1. Change index to redirect to tracker */}
          <Route index element={<Navigate to="/student/tracker" replace />} />

          {/* 2. Add explicit route for dashboard so sidebar link works */}
          <Route path="dashboard" element={<StudentDashboard />} />

          <Route path="tracker" element={<StudentTrackerPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
