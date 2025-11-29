import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Typography, Container } from '@mui/material';

// This component wraps routes that need protection.
// It checks if the user is logged in AND if they have the required role.
const ProtectedRoute = ({ requiredRole }) => {
  const { currentUser, userRole } = useAuth();

  // 1. Check if logged in at all
  if (!currentUser) {
    // If not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // 2. If a specific role is required, check for it
  if (requiredRole && userRole !== requiredRole) {
    // User is logged in, but doesn't have permission for this page.
    // You could redirect to a "Not Authorized" page instead.
    return (
        <Container sx={{ mt: 5 }}>
             <Typography variant="h4" color="error">Access Denied</Typography>
             <Typography>You do not have permission to view this page.</Typography>
             <Typography variant="caption">Current Role: {userRole || 'None'}</Typography>
        </Container>
    )
  }

  // 3. If all checks pass, render the child route (Outlet)
  return <Outlet />;
};

export default ProtectedRoute;