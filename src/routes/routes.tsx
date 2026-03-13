import type { RouteObject } from "react-router-dom";

import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Persons from "../pages/Persons";
import Transactions from "../pages/Transactions";
import AddTransaction from "../pages/AddTransaction";
import CalendarDashboard from "../pages/CalendarDashboard";

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "persons",
        element: <Persons />,
      },
  {
  path: "transactions",
  element: <Transactions />,
},
{
  path: "transactions/add",
  element: <AddTransaction />,
},
{
  path: "transactions/edit/:id",
  element: <AddTransaction />,
},
{
  path: "calendar",
  element: <CalendarDashboard />
}
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
];

export default routes;