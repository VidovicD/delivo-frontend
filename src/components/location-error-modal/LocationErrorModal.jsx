import { useEffect } from "react";
import "./LocationErrorModal.css";

function LocationErrorModal({ isOpen, message, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="le-toast" role="status" aria-live="polite">
      <h2>Ne možemo da odredimo lokaciju</h2>
      <div className="le-message">{message}</div>
    </div>
  );
}

export default LocationErrorModal;
