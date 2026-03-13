import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Persons from "../pages/Persons";
import ProtectedRoute from "../components/ProtectedRoute";

const routes = [
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>
    ),
  },
  {
    path: "/persons",
    element: (
      <ProtectedRoute>
        <Persons />
      </ProtectedRoute>
    ),
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