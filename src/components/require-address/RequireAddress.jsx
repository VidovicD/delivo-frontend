import { Navigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";
import AddAddressModal from "../add-address-modal/AddAddressModal";

function RequireAddress({
  children,
  session,
  passwordFlowActive,
  registrationIncomplete,
  authModalOpen,
}) {
  const { addressesReady, activeAddress } = useAddress();

  if (authModalOpen) {
    return children;
  }

  if (registrationIncomplete) {
    return <Navigate to="/" replace />;
  }

  if (!addressesReady) {
    return children;
  }

  const isAuthed = !!session?.user;

  // Dok traje password flow – ne diramo routing
  if (passwordFlowActive) {
    return children;
  }

  // Guest bez adrese → nazad na home
  if (!activeAddress && !isAuthed) {
    return <Navigate to="/" replace />;
  }

  const needsGuestDetails =
    !isAuthed &&
    activeAddress &&
    (!activeAddress.address_type ||
      (activeAddress.address_type === "kuca" &&
        !activeAddress.house_number) ||
      (activeAddress.address_type !== "kuca" &&
        (!activeAddress.entrance_number ||
          !activeAddress.apartment_number ||
          !activeAddress.floor)));

  if (needsGuestDetails) {
    return (
      <>
        {children}
        <AddAddressModal
          force
          initialAddress={activeAddress}
          onClose={() => {}}
        />
      </>
    );
  }

  // Ulogovan bez adrese → OBAVEZAN modal
  if (!activeAddress && isAuthed) {
    return (
      <>
        {children}
        <AddAddressModal force onClose={() => {}} />
      </>
    );
  }

  return children;
}

export default RequireAddress;
