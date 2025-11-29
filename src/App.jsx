import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';

// Import pages we just created
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

// Create a default MUI theme (makes things look decent automatically)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // A nice blue
    },
  },
});

function App() {
  // This is temporary state just to test routing. 
  // In the next step, Firebase will handle this.
  const [isLoggedIn, ] = useState(false);
  const [userRole, ] = useState(null); // 'teacher' or 'student'
  console.log("App render: isLoggedIn =", isLoggedIn,  ", userRole =", userRole);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstarts an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Temporary Protected Routes 
             Later we will wrap these in a real security check component.
             For now, if not logged in, redirect to login.
          */}
          
          <Route 
            path="/teacher/*" 
            element={ isLoggedIn && userRole === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" /> } 
          />

          <Route 
            path="/student/*" 
            element={ isLoggedIn && userRole === 'student' ? <StudentDashboard /> : <Navigate to="/login" /> } 
          />

          {/* Default redirect: go to login if path doesn't exist */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;