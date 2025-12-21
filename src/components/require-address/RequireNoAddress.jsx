import { Navigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";

function RequireNoAddress({ children, session }) {
  const { addressesReady, activeAddress } = useAddress();

  if (!addressesReady) return null;

  const isAuthed = !!session?.user;

  // 🔒 ULOGOVAN USER → NIKAD HOME
  if (isAuthed) {
    return <Navigate to="/explore" replace />;
  }

  // 🔒 GUEST SA ADRESOM → NIKAD HOME
  if (activeAddress) {
    return <Navigate to="/explore" replace />;
  }

  // ✅ GUEST BEZ ADRESE → SME HOME
  return children;
}

export default RequireNoAddress;
