import { useEffect, useState } from "react";
import { addPerson, getPersons, deletePerson } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";
import { TextField, Button, List, ListItem } from "@mui/material";

export default function Persons() {
  const [name, setName] = useState("");
  const [persons, setPersons] = useState<any[]>([]);

  const user = useAppSelector((state: any) => state.auth.user);

  const loadPersons = async () => {
    const data = await getPersons(user.uid);
    setPersons(data);
  };

  useEffect(() => {
    if (user) loadPersons();
  }, [user]);

  const handleAdd = async () => {
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
    <div>
      <h2>Persons</h2>

      <TextField
        label="Person Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Button onClick={handleAdd}>Add</Button>

      <List>
        {persons.map((p) => (
          <ListItem key={p.id}>
            {p.name}
            <Button onClick={() => handleDelete(p.id)}>Delete</Button>
          </ListItem>
        ))}
      </List>
    </div>
  );
}