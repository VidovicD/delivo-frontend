import React, { useEffect, useState } from "react";
import "./AddPasswordModal.css";
import { supabase } from "../../supabaseClient";

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8s-8.5-3-11-8Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EyeClosed = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8s-8.5-3-11-8Z" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function AddPasswordModal({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (password.length < 6) {
      setError("Lozinka mora sadržati najmanje 6 karaktera.");
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
      setError("Došlo je do greške prilikom čuvanja lozinke.");
      return;
    }

    if (typeof onSuccess === "function") {
      onSuccess();
    }
  };

  return (
    <div className="ap-overlay">
      <div className="ap-modal">
        <h2>Postavljanje lozinke</h2>

        <p>
          Uspešno ste se prijavili putem Google naloga.
          <br />
          Potrebno je da sada postavite lozinku.
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
          />
        </div>

        {error && <div className="ap-error">{error}</div>}

        <button className="ap-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Čuvanje..." : "Sačuvaj lozinku"}
        </button>

        <button
          type="button"
          className="ap-link"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
        >
          Odjavite se
        </button>
      </div>
    </div>
  );
}

export default AddPasswordModal;
