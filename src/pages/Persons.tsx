import { useEffect, useState } from "react";
import { addPerson, getPersons, deletePerson } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Persons() {

  const [name, setName] = useState("");
  const [persons, setPersons] = useState<any[]>([]);

  const user = useAppSelector((state: any) => state.auth.user);

  const navigate = useNavigate();

  const loadPersons = async () => {
    if (!user) return;
    const data = await getPersons(user.uid);
    setPersons(data);
  };

  useEffect(() => {
    loadPersons();
  }, [user]);

  const handleAdd = async () => {

    if (!name.trim()) return;

    await addPerson({
      name,
      userId: user.uid,
      createdAt: new Date(),
    });

    setName("");
    loadPersons();
  };

  const handleDelete = async (id: string) => {
    await deletePerson(id);
    loadPersons();
  };

  return (
    <Box>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Persons
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Person Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Button
          variant="contained"
          onClick={handleAdd}
        >
          Add
        </Button>
      </Box>

      <List>

        {persons.map((p) => (

          <ListItem
            key={p.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              border: "1px solid #eee",
              mb: 1
            }}
          >

            <ListItemText primary={p.name} />

            <Box>

             <Button
  size="small"
  onClick={() => navigate(`/persons/ledger/${p.id}`)}
>
  Ledger
</Button>

              <Button
                size="small"
                color="error"
                onClick={() => handleDelete(p.id)}
              >
                Delete
              </Button>

            </Box>

          </ListItem>

        ))}

      </List>

    </Box>
  );
}