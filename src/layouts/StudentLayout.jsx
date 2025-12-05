import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  AppBar as MuiAppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Tooltip,
  styled, // Import styled for custom component overrides
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashboardIcon from '@mui/icons-material/Dashboard';

// Define widths
const drawerWidth = 240;
const closedDrawerWidth = 65; // Width when collapsed (just enough for icons)

// --- MUI STYLED COMPONENTS FOR ANIMATION ---

// Mixin for opened drawer styles
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

// Mixin for closed drawer styles
const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: closedDrawerWidth,
  },
});

// Styled AppBar that shifts when drawer opens
const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

// Styled Drawer that handles open/closed states
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

// --- MAIN COMPONENT ---

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />, // Use the new icon
    path: "/student", // Path to the index route
  },
  {
    text: "Daily Tracker",
    icon: <DashboardCustomizeIcon />,
    path: "/student/tracker",
  },
  {
    text: "My Profile & Goals",
    icon: <AccountCircleIcon />,
    path: "/student/profile",
  },
];

function StudentLayout() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // STATE: Is the sidebar open? Default to true (expanded)
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  // Content inside the drawer
  const drawerContent = (
    <div>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          px: [1],
          bgcolor: "success.main",
          color: "white",
        }}
      >
        {/* Button to close the drawer */}
        <IconButton onClick={handleDrawerClose} sx={{ color: "white" }}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />

      {/* User Info Section - hides text when closed */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          bgcolor: "#e8f5e9",
          minHeight: 64,
        }}
      >
        <Avatar sx={{ bgcolor: "success.dark" }}>
          {currentUser?.email?.charAt(0).toUpperCase()}
        </Avatar>
        {open && (
          <Box sx={{ overflow: "hidden" }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: "bold" }}>
              {currentUser?.displayName || "Student"}
            </Typography>
            <Typography variant="caption" noWrap display="block">
              {currentUser?.email}
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />

      {/* Menu Items */}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: "block" }}>
            {/* Add Tooltip so user knows what icon means when collapsed */}
            <Tooltip title={open ? "" : item.text} placement="right">
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                  "&.Mui-selected": {
                    bgcolor: "#c8e6c9",
                    borderRight: "3px solid #2e7d32",
                  },
                  "&.Mui-selected:hover": { bgcolor: "#a5d6a7" },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                    color:
                      location.pathname === item.path
                        ? "success.dark"
                        : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {/* Hide text when closed */}
                <ListItemText
                  primary={item.text}
                  sx={{ opacity: open ? 1 : 0, whiteSpace: "nowrap" }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: "auto" }} />
      {/* Logout Button */}
      <List>
        <ListItem disablePadding sx={{ display: "block" }}>
          <Tooltip title={open ? "" : "Logout"} placement="right">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                color: "error.main",
                minHeight: 48,
                justifyContent: open ? "initial" : "center",
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  color: "error.main",
                  minHeight: 0,
                  mr: open ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Using our styled AppBar */}
      <AppBar position="fixed" open={open} sx={{ bgcolor: "success.main" }}>
        <Toolbar>
          {/* Button to open drawer - hidden when already open */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: "none" }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {menuItems.find((item) => location.pathname === item.path)?.text ||
              "Student Portal"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Using our styled Drawer (permanent variant for desktop) */}
      <Drawer variant="permanent" open={open}>
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          // Removed height: '100vh' and overflow: 'auto'
          minHeight: "100vh",
          bgcolor: "#e8f5e9",
          // Keep top margin so content isn't hidden behind AppBar
          marginTop: "64px",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default StudentLayout;
