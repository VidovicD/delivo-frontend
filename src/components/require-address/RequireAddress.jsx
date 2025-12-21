import { Navigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";

function RequireAddress({ children }) {
  const { addressesReady, activeAddress } = useAddress();

  if (!addressesReady) return null;

  // ⛔ redirect SAMO za guest-a bez adrese
  if (!activeAddress && !localStorage.getItem("sb-access-token")) {
    return <Navigate to="/" replace />;
  }

  // ✅ ulogovan user može na /explore i bez adrese
  return children;
}

export default RequireAddress;
