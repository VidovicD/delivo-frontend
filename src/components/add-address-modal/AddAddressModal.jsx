import { useEffect, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useAddress } from "../../contexts/AddressContext";

import "./AddAddressModal.css";

function AddAddressModal({ onClose, force = false }) {
  const autocompleteRef = useRef(null);
  const { addAddressFromPlace, savedAddresses } = useAddress();

  const canClose = !force && savedAddresses.length > 0;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handlePlaceChanged = async () => {
    const place = autocompleteRef.current?.getPlace();
    const formatted = place?.formatted_address;
    const loc = place?.geometry?.location;

    if (!formatted || !loc) return;

    await addAddressFromPlace({
      address: formatted,
      lat: loc.lat(),
      lng: loc.lng(),
    });

    onClose();
  };

  return (
    <div className="aa-overlay">
      <div className="aa-modal">
        <h2>Dodavanje adrese</h2>

        <p>Unesite adresu za dostavu.</p>

        <Autocomplete
          onLoad={(a) => (autocompleteRef.current = a)}
          onPlaceChanged={handlePlaceChanged}
          options={{
            types: ["address"],
            componentRestrictions: { country: "rs" },
          }}
        >
          <input
            className="aa-input"
            placeholder="Unesite adresu…"
            autoFocus
          />
        </Autocomplete>

        {canClose && (
          <button
            type="button"
            className="aa-link"
            onClick={onClose}
          >
            Otkaži
          </button>
        )}
      </div>
    </div>
  );
}

export default AddAddressModal;
