// Simple placeholder for the Login Page
import { Box, Typography, Button, Container } from '@mui/material';

const LoginPage = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4">
          SparkUp Login
        </Typography>
        {/* We will add the login form here later */}
        <Typography variant="body1" sx={{ mt: 2 }}>
          [Login Form will go here]
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;