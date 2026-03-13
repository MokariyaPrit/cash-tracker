import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/reduxHooks.ts";
import type { RootState } from "../store/store";

export default function ProtectedRoute({ children }: any) {
  const user = useAppSelector((state: RootState) => state.auth.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}