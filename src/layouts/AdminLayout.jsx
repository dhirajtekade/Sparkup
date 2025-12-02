import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
// Admin specific icons
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import DashboardIcon from "@mui/icons-material/Dashboard";

const drawerWidth = 240;

const menuItems = [
  // Placeholder for a future admin dashboard
  // { text: 'Admin Overview', icon: <DashboardIcon />, path: '/admin/overview' },
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

  const drawerContent = (
    <div>
      {/* Using a Red color for ADMIN theme */}
      <Toolbar sx={{ backgroundColor: "error.main", color: "white" }}>
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
          bgcolor: "#fff0f0",
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
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                "&.Mui-selected": {
                  bgcolor: "#ffebee",
                  borderRight: "3px solid #d32f2f",
                },
                "&.Mui-selected:hover": { bgcolor: "#ffcdd2" },
              }}
            >
              <ListItemIcon
                color={location.pathname === item.path ? "error" : "inherit"}
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
          bgcolor: "error.main", // Red App Bar
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
          // Removed height: '100vh' and overflow: 'auto'
          minHeight: "100vh",
          bgcolor: "#fff8f8",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
