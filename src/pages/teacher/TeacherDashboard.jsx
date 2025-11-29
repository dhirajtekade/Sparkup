import { Typography, Box } from '@mui/material';

const TeacherDashboard = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Teacher Dashboard</Typography>
      <Typography paragraph>
        Welcome teacher! You will manage students and tasks here.
      </Typography>
    </Box>
  );
};

export default TeacherDashboard;