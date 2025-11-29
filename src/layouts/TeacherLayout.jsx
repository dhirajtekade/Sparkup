import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Avatar
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarsIcon from '@mui/icons-material/Stars';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

// Define menu items in an array for easy mapping
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher/dashboard' },
  { text: 'Students', icon: <PeopleIcon />, path: '/teacher/students' },
  { text: 'Tasks', icon: <AssignmentIcon />, path: '/teacher/tasks' },
  { text: 'Badges', icon: <StarsIcon />, path: '/teacher/badges' },
  { text: 'Goals', icon: <EmojiEventsIcon />, path: '/teacher/goals' },
];

function TeacherLayout() {
  const { logout, currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
      try {
          await logout();
          navigate('/login');
      } catch (error) {
          console.error("Failed to log out", error);
      }
  }

  // The contents of the sidebar (Drawer)
  const drawerContent = (
    <div>
      <Toolbar sx={{ backgroundColor: 'primary.main', color: 'white' }}>
         <Typography variant="h6" noWrap component="div">
            SparkUp Teacher
          </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>{userRole?.charAt(0).toUpperCase()}</Avatar>
           <Typography variant="subtitle2" noWrap>
               {currentUser?.email}
           </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
            >
              <ListItemIcon color={location.pathname === item.path ? "primary" : "inherit"}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List>
           <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => location.pathname === item.path)?.text || 'Dashboard'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* The navigation drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA - Where your pages will render */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh', bgcolor: '#f5f5f5' }}
      >
        <Toolbar /> {/* This empty toolbar pushes content down so it's not hidden behind the fixed AppBar */}
        {/* <Outlet /> renders the child route selected by the router (e.g., TeacherDashboard) */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default TeacherLayout;