import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks";

export default function ProtectedRoute({ children }: any) {
  const { user, loading } = useAppSelector((state: any) => state.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
