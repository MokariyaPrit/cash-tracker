import { useState } from "react";
import { login } from "../services/authService";
import { useAppDispatch } from "../hooks/reduxHooks";
import { setUser } from "../store/authSlice";
import { TextField, Button, Container } from "@mui/material";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      const res = await login(email, password);

      dispatch(setUser(res.user));

      alert("Login successful");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <TextField
        fullWidth
        label="Email"
        margin="normal"
        onChange={(e) => setEmail(e.target.value)}
      />

      <TextField
        fullWidth
        type="password"
        label="Password"
        margin="normal"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button variant="contained" onClick={handleLogin}>
        Login
      </Button>
    </Container>
  );
}