import { useState } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
// 1. Import theme hook and icons
import { useThemeMode } from "../contexts/ThemeContext";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
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
  Avatar,
  useTheme, // Import useTheme
} from "@mui/material";

// Icons
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import StarsIcon from "@mui/icons-material/Stars";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BarChartIcon from "@mui/icons-material/BarChart";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

// Define menu items in an array for easy mapping
const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/teacher/dashboard" },
  { text: "Leaderboard", icon: <BarChartIcon />, path: "/teacher/leaderboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/teacher/students" },
  { text: "Tasks", icon: <AssignmentIcon />, path: "/teacher/tasks" },
  { text: "Badges", icon: <StarsIcon />, path: "/teacher/badges" },
  { text: "Goals", icon: <EmojiEventsIcon />, path: "/teacher/goals" },
];

function TeacherLayout() {
  const { logout, currentUser, userRole } = useAuth();
  // 2. Get theme mode and toggle function
  const theme = useTheme();
  const { toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // The contents of the sidebar (Drawer)
  const drawerContent = (
    <div>
      <Toolbar sx={{ backgroundColor: "primary.main", color: "white" }}>
        <Typography variant="h6" noWrap component="div">
          SparkUp Teacher
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: "secondary.main" }}>
          {userRole?.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="subtitle2" noWrap>
          {currentUser?.email}
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              // Added component={Link} for client-side routing functionality
              component={Link}
              to={item.path}
              selected={
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + "/")
              }
              // Added hover styles for better UX in both modes
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "primary.light",
                  color: "primary.dark",
                  "& .MuiListItemIcon-root": {
                    color: "primary.dark",
                  },
                },
                "&:hover": {
                  // Use MUI alpha function for theme-aware hover state
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  // Use theme primary color for selected state
                  color: location.pathname.startsWith(item.path)
                    ? "primary.main"
                    : "inherit",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: "auto" }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: "error.main" }}>
            <ListItemIcon sx={{ color: "error.main" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          // Adaptive background color: Blue in light mode, dark grey in dark mode
          bgcolor:
            theme.palette.mode === "dark" ? "background.paper" : "primary.main",
          color: "white", // Keep text white for contrast on both
          // Add a border in dark mode to define the header
          borderBottom:
            theme.palette.mode === "dark"
              ? `1px solid ${theme.palette.divider}`
              : "none",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => location.pathname === item.path)?.text ||
              "Dashboard"}
          </Typography>

          {/* 3. Add Theme Toggle Button */}
          <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
            {theme.palette.mode === "dark" ? (
              <Brightness7Icon />
            ) : (
              <Brightness4Icon />
            )}
          </IconButton>
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
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              // Add border to separate sidebar in dark mode
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* MAIN CONTENT AREA - Where your pages will render */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          // Removed height: '100vh' and overflow: 'auto'
          minHeight: "100vh", // Ensures background fills screen
          // Adaptive background color
          bgcolor:
            theme.palette.mode === "dark" ? "background.default" : "#f5f5f5",
        }}
      >
        <Toolbar />{" "}
        {/* This empty toolbar pushes content down so it's not hidden behind the fixed AppBar */}
        {/* <Outlet /> renders the child route selected by the router (e.g., TeacherDashboard) */}
        <Outlet />
      </Box>
    </Box>
  );
}

export default TeacherLayout;
