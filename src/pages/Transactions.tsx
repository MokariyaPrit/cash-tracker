import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  getTransactions,
  deleteTransaction,
} from "../services/transactionService";

import { getPersons } from "../services/personService";
import { useAppSelector } from "../hooks/reduxHooks";

import {
  DataGrid,
  type GridColDef,
  GridToolbar,
} from "@mui/x-data-grid";

export default function Transactions() {
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.auth.user);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);

  const loadData = async () => {
    if (!user) return;

    const personsData = await getPersons(user.uid);
    const transactionData = await getTransactions(user.uid);

    setPersons(personsData);
    setTransactions(transactionData);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    loadData();
  };

  const personMap = Object.fromEntries(
    persons.map((p) => [p.id, p.name])
  );

  const rows = transactions.map((t) => ({
    id: t.id,
    date: t.date?.seconds
      ? new Date(t.date.seconds * 1000).toLocaleDateString()
      : "",
    person: personMap[t.personId] || "-",
    type: t.type,
    amount: t.amount,
    status: t.status,
  }));

  const columns: GridColDef[] = [
    { field: "date", headerName: "Date", flex: 1 },

    { field: "person", headerName: "Person", flex: 1 },

    { field: "type", headerName: "Type", flex: 1 },

    { field: "amount", headerName: "Amount", flex: 1 },

    { field: "status", headerName: "Status", flex: 1 },

    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      filterable: false,
      renderCell: (params : any) => (
        <Box>
          <Button
            size="small"
            onClick={() =>
              navigate(`/transactions/edit/${params.row.id}`)
            }
          >
            Edit
          </Button>

          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ height: 500, width: "100%" }}>

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => navigate("/transactions/add")}
      >
        Add Transaction
      </Button>

      <DataGrid
        rows={rows}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
}