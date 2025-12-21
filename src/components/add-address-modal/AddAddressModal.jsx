import { useEffect, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useAddress } from "../../contexts/AddressContext";

import "./AddAddressModal.css";

function AddAddressModal({ onClose }) {
  const autocompleteRef = useRef(null);
  const { addAddressFromPlace } = useAddress();

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
    <div className="add-address-modal__backdrop">
      <div className="add-address-modal">
        <h3 className="add-address-modal__title">
          Dodaj novu adresu
        </h3>

        <Autocomplete
          onLoad={(a) => (autocompleteRef.current = a)}
          onPlaceChanged={handlePlaceChanged}
          options={{
            types: ["address"],
            componentRestrictions: { country: "rs" },
          }}
        >
          <input
            className="add-address-modal__input"
            placeholder="Unesite adresu…"
            autoFocus
          />
        </Autocomplete>

        <button
          className="add-address-modal__close"
          type="button"
          onClick={onClose}
        >
          Otkaži
        </button>
      </div>
    </div>
  );
}

export default AddAddressModal;