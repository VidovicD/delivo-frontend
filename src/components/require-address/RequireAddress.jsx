import { Navigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";
import AddAddressModal from "../add-address-modal/AddAddressModal";

function RequireAddress({ children, session, passwordFlowActive }) {
  const { addressesReady, activeAddress } = useAddress();

  if (!addressesReady) return null;

  const isAuthed = !!session?.user;

  // Dok traje password flow – ne diramo routing
  if (passwordFlowActive) {
    return children;
  }

  // Guest bez adrese → nazad na home
  if (!activeAddress && !isAuthed) {
    return <Navigate to="/" replace />;
  }

  // Ulogovan bez adrese → OBAVEZAN modal
  if (!activeAddress && isAuthed) {
    return <AddAddressModal force onClose={() => {}} />;
  }

  return children;
}

export default RequireAddress;
