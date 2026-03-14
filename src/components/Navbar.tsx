import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  alpha,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../hooks/reduxHooks";
import { clearUser } from "../store/authSlice";
import { logout } from "../services/authService";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
// import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

const navItems = [
  {
    path: "/calendar",
    label: "Dashboard",
    icon: <CalendarMonthRoundedIcon fontSize="small" />,
  },
  {
    path: "/persons",
    label: "Persons",
    icon: <PeopleRoundedIcon fontSize="small" />,
  },
  {
    path: "/transactions",
    label: "Transactions",
    icon: <ReceiptLongRoundedIcon fontSize="small" />,
  },
  //   { path: "/calendar", label: "Calendar", icon: <CalendarMonthRoundedIcon fontSize="small" /> },
    {
    path: "/recurring",
    label: "Recurring",
    icon: <RepeatRoundedIcon  fontSize="small" />,
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await logout();
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 56, sm: 64 },
          gap: 0.5,
        }}
      >
        <Box
          component="button"
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
            margin: 0,
            marginRight: { xs: 1, sm: 3 },
          }}
        >
          <AccountBalanceRoundedIcon
            sx={{ fontSize: 28, color: "primary.main" }}
          />
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Cash Tracker
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 0.5 }}>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  px: { xs: 1, md: 1.5 },
                  py: 1,
                  minWidth: 0,
                  color: isActive ? "primary.main" : "text.secondary",
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive
                    ? alpha(theme.palette.primary.main, 0.08)
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.text.primary, 0.06),
                    color: isActive ? "primary.main" : "text.primary",
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: { xs: 0, md: 0.5 },
                  },
                }}
                aria-label={item.label}
              >
                <Typography
                  variant="body2"
                  component="span"
                  sx={{ display: { xs: "none", md: "inline" } }}
                >
                  {item.label}
                </Typography>
              </Button>
            );
          })}
        </Box>

        <Button
          color="inherit"
          startIcon={<LogoutRoundedIcon fontSize="small" />}
          onClick={handleLogout}
          aria-label="Logout"
          sx={{
            borderRadius: 2,
            px: 1.5,
            color: "text.secondary",
            "&:hover": {
              backgroundColor: alpha(theme.palette.error.main, 0.08),
              color: "error.main",
            },
          }}
        >
          <Typography
            variant="body2"
            component="span"
            sx={{ display: { xs: "none", sm: "inline" } }}
          >
            Logout
          </Typography>
        </Button>
      </Toolbar>
    </AppBar>
  );
}
