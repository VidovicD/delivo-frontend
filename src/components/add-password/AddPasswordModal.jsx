import React, { useEffect, useState } from "react";
import "./AddPasswordModal.css";
import { supabase } from "../../supabaseClient";

/* 👁 ICONS */
const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8s-8.5-3-11-8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EyeClosed = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M1 12C3.5 7 7.5 4 12 4s8.5 3 11 8c-2.5 5-6.5 8-11 8s-8.5-3-11-8Z"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <line
      x1="3"
      y1="3"
      x2="21"
      y2="21"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

function AddPasswordModal({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* 🔒 disable scroll */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /* 🛑 ako nema sesije → zatvori modal */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        onSuccess();
      }
    };

    checkSession();
  }, [onSuccess]);

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesija je istekla. Molimo prijavite se ponovo.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        password_set: true,
      },
    });

    setLoading(false);

    if (updateError) {
      console.error("UPDATE PASSWORD ERROR:", updateError);
      setError("Došlo je do greške prilikom čuvanja lozinke.");
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
          Kako biste ubuduće mogli da se prijavljujete i putem email adrese i
          lozinke, potrebno je da sada postavite lozinku za svoj nalog.
        </p>

        {/* PASSWORD */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Nova lozinka"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="toggle-password"
            onClick={() => setShowPassword((p) => !p)}
            aria-label="Prikaži ili sakrij lozinku"
          >
            {showPassword ? <EyeOpen /> : <EyeClosed />}
          </button>
        </div>

        {/* CONFIRM */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Potvrdite lozinku"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <div className="ap-error">{error}</div>}

        <button
          className="ap-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Čuvanje u toku..." : "Sačuvaj lozinku"}
        </button>

        <button
          type="button"
          className="ap-btn ap-btn-secondary"
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
        >
          Prijavite se ponovo
        </button>
      </div>
    </div>
  );
}

export default AddPasswordModal;
