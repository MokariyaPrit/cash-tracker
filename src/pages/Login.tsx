import { useEffect, useState } from "react";
import { login } from "../services/authService";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import { setUser } from "../store/authSlice";
import { TextField, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  
  const handleLogin = async () => {
  try {
    const res = await login(email, password);

    dispatch(setUser(res.user));

    navigate("/"); // redirect to dashboard
  } catch (error: any) {
    alert(error.message);
  }
};


useEffect(() => {
  if (user) {
    navigate("/");
  }
}, [user]);

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