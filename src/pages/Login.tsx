import { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  alpha,
  CircularProgress,
} from "@mui/material";
import { login } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setUser } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import Loginimg from "../components/Loginimg";
import { useAlert } from "../contexts/AlertContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const showAlert = useAlert();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await login(email, password);

      dispatch(setUser(res.user));

      navigate("/Calendar", { replace: true });
    } catch (error: any) {
      showAlert(error.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/Calendar");
    }
  }, [user]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default",
      }}
    >
      {/* Left Image */}
      <Box
        sx={{
          flex: 1,
          display: { xs: "none", md: "flex" },
          justifyContent: "center",
          alignItems: "center",
          bgcolor: alpha("#2563eb", 0.1),
          p: 4,
        }}
      >
        <Loginimg width="80%" />
      </Box>

      {/* Login Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: { xs: 3, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 400, width: "100%" }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Login
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Welcome back! Please login to your account.
          </Typography>

          <form onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              autoComplete="email"
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, mt: 2, mb: 2 }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <Typography variant="body2" align="center">
            Don’t have an account?{" "}
            <Link
              component="button"
              onClick={() => navigate("/signup")}
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              Sign Up
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
