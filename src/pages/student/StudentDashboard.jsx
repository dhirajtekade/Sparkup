import { Typography, Box } from '@mui/material';

const StudentDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Student Tracker</Typography>
      <Typography paragraph>
        Welcome student! Your daily tasks will appear here.
      </Typography>
    </Box>
  );
};

export default StudentDashboard;