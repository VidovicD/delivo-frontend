import { useEffect, useState } from "react";
import { useAddress } from "../../contexts/AddressContext";
import { formatAddressDisplay } from "../../utils/addressValidation";
import AddAddressModal from "../add-address-modal/AddAddressModal";
import "./AddressListModal.css";

function AddressListModal({
  isOpen,
  addresses,
  activeAddressId,
  onClose,
  onSelect,
}) {
  const { deleteAddressById } = useAddress();
  const [mode, setMode] = useState("list");
  const [editingAddress, setEditingAddress] = useState(null);
  const [backRequest, setBackRequest] = useState(0);
  const [pendingBack, setPendingBack] = useState(false);
  const canDelete = addresses.length > 1;

  useEffect(() => {
    if (!isOpen) {
      setMode("list");
      setEditingAddress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="address-list-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`address-list-modal${mode === "edit" ? " is-edit" : ""}`}>
        {mode === "list" && (
          <>
            <div className="address-list-header">
              <h2>Adrese</h2>
              <button
                type="button"
                className="address-list-close"
                onClick={onClose}
              >
                x
              </button>
            </div>

            <div className="address-list-body">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className={`address-list-row${
                    a.id === activeAddressId ? " active" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(a)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelect(a);
                  }}
                >
                  <div className="address-list-text">
                    <span>{formatAddressDisplay(a.address)}</span>
                  </div>
                  <div className="address-list-actions">
                    <button
                      type="button"
                      className="address-list-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAddress(a);
                        setMode("edit");
                      }}
                      aria-label="Izmeni adresu"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="address-list-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canDelete) return;
                        deleteAddressById(a.id);
                      }}
                      disabled={!canDelete}
                      aria-label="Obrisi adresu"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="address-list-add"
              onClick={() => {
                setEditingAddress(null);
                setMode("edit");
              }}
            >
              Dodaj novu adresu
            </button>
          </>
        )}

        {mode === "edit" && (
          <>
            <div className="address-list-header">
              <button
                type="button"
                className="address-list-back"
                onClick={() => {
                  setPendingBack(true);
                  setBackRequest((v) => v + 1);
                }}
                aria-label="Nazad"
              >
                <svg viewBox="0 0 24 24" width="26" height="26">
                  <path
                    d="M15 5l-7 7 7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="address-list-close"
                onClick={onClose}
              >
                x
              </button>
            </div>
            <AddAddressModal
              inline
              initialAddress={editingAddress}
              onClose={() => {
                setMode("list");
                setEditingAddress(null);
              }}
              onReady={undefined}
              backRequest={backRequest}
              onBackHandled={(handled) => {
                if (!pendingBack) return;
                if (handled) {
                  setPendingBack(false);
                  return;
                }
                setPendingBack(false);
                setMode("list");
                setEditingAddress(null);
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default AddressListModal;
