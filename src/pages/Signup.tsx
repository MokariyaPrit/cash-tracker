import { useState } from "react";
import { signup } from "../services/authService";
import { TextField, Button, Container, Typography } from "@mui/material";
import { createUserProfile } from "../services/userService";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

const handleSignup = async () => {
  try {
    const res = await signup(email, password);

    await createUserProfile(res.user);

    alert("Signup successful");
  } catch (error: any) {
    alert(error.message);
  }
};

  return (
    <Container maxWidth="sm">
      <Typography variant="h4">Signup</Typography>

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

      <Button variant="contained" onClick={handleSignup}>
        Signup
      </Button>
    </Container>
  );
}