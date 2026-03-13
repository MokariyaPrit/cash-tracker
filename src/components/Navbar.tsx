import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography sx={{ flexGrow: 1 }}>Cash Tracker</Typography>

        <Button color="inherit" onClick={() => navigate("/")}>
          Dashboard
        </Button>

        <Button color="inherit" onClick={() => navigate("/persons")}>
          Persons
        </Button>

        <Button color="inherit" onClick={() => navigate("/transactions")}>
  Transactions
</Button>
      </Toolbar>
    </AppBar>
  );
}