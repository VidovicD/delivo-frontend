import { useEffect, useState } from "react";
import "./AddPasswordModal.css";
import { supabase } from "../../supabaseClient";
import { isValidPassword } from "../auth-modal/authUtils";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";

function AddPasswordModal({ onSuccess, onOpen, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔒 SIGNALIZUJ DA JE PASSWORD FLOW AKTIVAN
  useEffect(() => {
    onOpen?.();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      onClose?.();
    };
  }, [onOpen, onClose]);

  const handleSubmit = async () => {
    setError("");

    if (!isValidPassword(password)) {
      if (password.length < 8) {
        setError("Lozinka mora sadržati najmanje 8 karaktera.");
      } else if (!/[a-zA-Z]/.test(password)) {
        setError("Lozinka mora sadržati bar jedno slovo.");
      } else if (!/[0-9]/.test(password)) {
        setError("Lozinka mora sadržati bar jedan broj.");
      }
      return;
    }

    if (password !== confirm) {
      setError("Unete lozinke se ne poklapaju.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { password_set: true },
    });

    setLoading(false);

    if (updateError) {
      setError("Došlo je do greške. Pokušajte ponovo.");
      return;
    }

    onSuccess();
  };

  return (
    <div className="ap-overlay">
      <div className="ap-modal">
        <h2>Postavljanje lozinke</h2>

        <p>
          Uspešno ste se prijavili putem Google naloga.
          <br />
          Potrebno je da postavite lozinku.
        </p>

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova lozinka"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className={error ? "error" : ""}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((p) => !p)}
          >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
          </button>
        </div>

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Potvrdite lozinku"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError("");
            }}
            className={error ? "error" : ""}
          />
        </div>

        {error && <div className="ap-error">{error}</div>}

        <button
          className="ap-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Čuvanje..." : "Sačuvaj"}
        </button>
      </div>
    </div>
  );
}

export default AddPasswordModal;
