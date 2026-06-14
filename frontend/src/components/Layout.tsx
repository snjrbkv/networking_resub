/** App shell: responsive sidebar drawer + top app bar. */
import { useState, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

const DRAWER_WIDTH = 248;

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Products", path: "/products", icon: <Inventory2Icon /> },
  { label: "Customers", path: "/customers", icon: <PeopleIcon /> },
  { label: "Orders", path: "/orders", icon: <ReceiptLongIcon /> },
  { label: "Warehouse", path: "/warehouse", icon: <WarehouseIcon /> },
  { label: "Profile", path: "/profile", icon: <PersonIcon /> },
];

// ─── Style objects (kept out of JSX to avoid brace clutter) ───
const drawerRootSx = { display: "flex", flexDirection: "column", height: "100%" };
const brandToolbarSx = { display: "flex", alignItems: "center", gap: 1 };
const brandIconSx = { fontSize: 28 };
const navListSx = { flexGrow: 1, px: 1, py: 1 };
const navItemSx = { borderRadius: 2, mb: 0.5 };
const navIconSx = { minWidth: 40 };
const footerBoxSx = { p: 2 };
const appBarSx = {
  width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
  ml: { md: `${DRAWER_WIDTH}px` },
  borderBottom: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
};
const menuButtonSx = { mr: 2, display: { md: "none" } };
const titleSx = { flexGrow: 1, fontWeight: 600 };
const userTextSx = { mr: 1, display: { xs: "none", sm: "block" } };
const avatarSmSx = { width: 32, height: 32, bgcolor: "primary.main" };
const navBoxSx = { width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } };
const modalProps = { keepMounted: true };
const tempDrawerSx = {
  display: { xs: "block", md: "none" },
  "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
};
const permDrawerSx = {
  display: { xs: "none", md: "block" },
  "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
};
const mainSx = {
  flexGrow: 1,
  width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
  minHeight: "100vh",
  bgcolor: "background.default",
};
const contentSx = { p: { xs: 2, sm: 3 } };
const rootSx = { display: "flex" };

export default function Layout({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    if (!isDesktop) setMobileOpen(false);
  };

  const goProfile = () => {
    setAnchorEl(null);
    navigate("/profile");
  };

  const doLogout = () => {
    setAnchorEl(null);
    logout();
    navigate("/login");
  };

  const currentLabel = navItems.find((n) => location.pathname.startsWith(n.path))?.label ?? "WholesaleOS";

  const drawerContent = (
    <Box sx={drawerRootSx}>
      <Toolbar sx={brandToolbarSx}>
        <WarehouseIcon color="primary" sx={brandIconSx} />
        <Typography variant="h6" noWrap fontWeight={800} color="primary">
          WholesaleOS
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={navListSx}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => handleNavigate(item.path)}
            sx={navItemSx}
          >
            <ListItemIcon sx={navIconSx}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={footerBoxSx}>
        <Typography variant="caption" color="text.secondary">
          Networking in the Cloud — demo
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={rootSx}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={appBarSx}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={menuButtonSx}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={titleSx} color="text.primary">
            {currentLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={userTextSx}>
            {user?.name} · {user?.role.replace("_", " ")}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={avatarSmSx}>{user?.name?.charAt(0).toUpperCase()}</Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={goProfile}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={doLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={navBoxSx}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={modalProps}
          sx={tempDrawerSx}
        >
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent" open sx={permDrawerSx}>
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={mainSx}>
        <Toolbar />
        <Box sx={contentSx}>{children}</Box>
      </Box>
    </Box>
  );
}
