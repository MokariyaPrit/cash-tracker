import { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Link,
  alpha,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Signupimg from "../components/Signupimg";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      // const res = await signup(email, password);
      // await createUserProfile(res.user);
      
      alert("Signup successful");
      navigate("/login");

    } catch (error: any) {

  if (error.code === "auth/email-already-in-use") {
    alert("This email is already registered. Please login.");
  } else {
    alert(error.message || "Signup failed");
  }

} finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default",
      }}
    >
      {/* Left: Signup Form */}
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
            Sign Up
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Create your account to get started.
          </Typography>

          <form onSubmit={handleSignup}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
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
              {loading ? <CircularProgress size={24} /> : "signup"}
            </Button>
          </form>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Link
              component="button"
              onClick={() => navigate("/login")}
              sx={{ color: "primary.main", fontWeight: "bold" }}
            >
              Login
            </Link>
          </Typography>
        </Box>
      </Box>

      {/* Right: Illustration */}
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
        <Signupimg width="80%" />
      </Box>
    </Box>
  );
}