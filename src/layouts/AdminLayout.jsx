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
  Avatar,
  useTheme, // Import useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import DashboardIcon from "@mui/icons-material/Dashboard";

const drawerWidth = 240;

const menuItems = [
  {
    text: "Manage Teachers",
    icon: <SupervisorAccountIcon />,
    path: "/admin/teachers",
  },
  {
    text: "Platform Settings",
    icon: <SettingsSuggestIcon />,
    path: "/admin/settings",
  },
];

function AdminLayout() {
  const { logout, currentUser } = useAuth();
  // 2. Get theme mode and toggle function
  const theme = useTheme();
  const { toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  // Determine colors based on theme mode for the custom admin branding
  const headerBg =
    theme.palette.mode === "dark"
      ? theme.palette.error.dark
      : theme.palette.error.main;
  const userBlockBg =
    theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.1)" : "#fff0f0";
  const selectedBg =
    theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.2)" : "#ffebee";
  const selectedHoverBg =
    theme.palette.mode === "dark" ? "rgba(211, 47, 47, 0.3)" : "#ffcdd2";
  const mainBg =
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : "#fff8f8";

  const drawerContent = (
    <div>
      {/* Using a Red color for ADMIN theme */}
      <Toolbar sx={{ backgroundColor: headerBg, color: "white" }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ fontWeight: "bold" }}
        >
          SparkUp Super Admin
        </Typography>
      </Toolbar>
      <Divider />
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: userBlockBg,
        }}
      >
        <Avatar sx={{ bgcolor: "error.dark" }}>
          {currentUser?.email?.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ maxWidth: 140, fontWeight: "bold" }}
          >
            {currentUser?.email}
          </Typography>
          <Typography
            variant="caption"
            color="error.main"
            sx={{ fontWeight: "bold" }}
          >
            ROLE: SUPER ADMIN
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                "&.Mui-selected": {
                  bgcolor: selectedBg,
                  borderRight: `3px solid ${theme.palette.error.main}`,
                },
                "&.Mui-selected:hover": { bgcolor: selectedHoverBg },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path ? "error.main" : "inherit",
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
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: headerBg, // Red App Bar adapted for dark mode
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
              "Admin"}
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
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
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
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          bgcolor: mainBg,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
