import { Navigate } from "react-router-dom";

function RequireAuth({ session, authReady, children }) {
  if (!authReady) return null;

  if (!session?.user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAuth;
