import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PublicRoute({ children }) {
  const { isAuthenticated } = useSelector(state => state.user);
  return !isAuthenticated ? children : <Navigate to="/feed" replace />;
}