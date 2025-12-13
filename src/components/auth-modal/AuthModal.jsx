import React, { useEffect, useRef, useState } from "react";
import "./AuthModal.css";

import { supabase } from "../../supabaseClient";

/* ================= HELPERS ================= */

const getStrength = (password) => {
  if (password.length < 6) return "weak";
  if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return "strong";
  return "medium";
};

const isMobile = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// 🔧 FEATURE FLAG – haptic feedback ON/OFF
const ENABLE_HAPTIC = true;

/* ================= COMPONENT ================= */

function AuthModal({ mode, onClose, onSwitch }) {
  const modalRef = useRef(null);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth"); // auth | forgot | success

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState("weak");
  const [loading, setLoading] = useState(false);

  const [capsLock, setCapsLock] = useState(false);

  const [errors, setErrors] = useState({
    name: false,
    email: false,
    password: false,
  });

  const [errorText, setErrorText] = useState({
    name: "",
    email: "",
    password: "",
  });

  /* ================= EFFECTS ================= */

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
    if (mode === "register") nameRef.current?.focus();
    else emailRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    setStrength(getStrength(password));
  }, [password]);

  useEffect(() => {
    if (step === "success") {
    if (isMobile() && navigator.vibrate) {
    navigator.vibrate(40);
    }

      const timer = setTimeout(() => {
        onClose();
        window.location.href = "/";
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [step, onClose]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    const newErrors = {
      name: mode === "register" && !name,
      email: !email,
      password: !password,
    };

    const newErrorText = {
      name:
        mode === "register" && !name
          ? "Ime i prezime su obavezni"
          : "",
      email: !email ? "Email je obavezan" : "",
      password: !password ? "Lozinka je obavezna" : "",
    };

    setErrors(newErrors);
    setErrorText(newErrorText);

    if (
    ENABLE_HAPTIC &&
    (newErrors.name || newErrors.email || newErrors.password) &&
    isMobile() &&
    navigator.vibrate
    ) {
    navigator.vibrate([60, 40, 60]);
    }


    if (newErrors.name) {
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (newErrors.email) {
      emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (newErrors.password) {
      passwordRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    if (newErrors.name || newErrors.email || newErrors.password) {
      setTimeout(() => {
        setErrors({ name: false, email: false, password: false });
      }, 400);
      return;
    }

    setLoading(true);

    try {
    if (mode === "register") {
        const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
            full_name: name,
            },
        },
        });

        if (error) throw error;
    }

    if (mode === "login") {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    }

    setLoading(false);
    setStep("success");
    } catch (err) {
    setLoading(false);
    alert(err.message);
    }
  };

  const isDisabled =
    loading ||
    !email ||
    !password ||
    (mode === "register" && !name);

  /* ================= RENDER ================= */

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        ref={modalRef}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="auth-close" onClick={onClose}>
          ✕
        </button>

        {/* ================= SUCCESS ================= */}
        {step === "success" && (
          <div className="auth-success">
            <div className="auth-success-icon">
              <svg viewBox="0 0 24 24">
                <polyline points="4 12 10 17 20 6" />
              </svg>
            </div>
            <h2>Uspešno!</h2>
            <p>
              {mode === "login"
                ? "Uspešno ste se prijavili."
                : "Nalog je uspešno kreiran."}
            </p>
          </div>
        )}

        {/* ================= AUTH ================= */}
        {step === "auth" && (
          <>
            <div className="auth-hero">
              <div className="auth-avatar">👤</div>
              <h2>{mode === "login" ? "Prijava" : "Registracija"}</h2>
              <p>
                {mode === "login"
                  ? "Prijavite se na svoj nalog"
                  : "Kreirajte novi nalog"}
              </p>
            </div>

            <div className="auth-tabs">
              <div className="auth-tab" onClick={() => onSwitch("login")}>
                Prijava
              </div>
              <div className="auth-tab" onClick={() => onSwitch("register")}>
                Registracija
              </div>
              <div className={`auth-indicator ${mode}`} />
            </div>

            <div className="auth-form">
              {mode === "register" && (
                <>
                  <input
                    ref={nameRef}
                    className={errors.name ? "shake" : ""}
                    type="text"
                    placeholder="Ime i prezime"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errorText.name && (
                    <div className="error-text">{errorText.name}</div>
                  )}
                </>
              )}

              <input
                ref={emailRef}
                className={errors.email ? "shake" : ""}
                type="email"
                placeholder="Email adresa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errorText.email && (
                <div className="error-text">{errorText.email}</div>
              )}

              <div
                ref={passwordRef}
                className={`password-field ${
                  errors.password ? "shake" : ""
                }`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Lozinka"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) =>
                    setCapsLock(e.getModifierState("CapsLock"))
                  }
                />

                <button
                  type="button"
                  className="toggle-password"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                >
                  👁
                </button>
              </div>

              {capsLock && (
                <div className="caps-warning">
                  ⚠ Caps Lock je uključen
                </div>
              )}

              {errorText.password && (
                <div className="error-text">{errorText.password}</div>
              )}

              {mode === "register" && password && (
                <div className={`password-meter ${strength}`}>
                  <div />
                </div>
              )}

              <button
                className="auth-submit"
                onClick={handleSubmit}
                disabled={isDisabled}
              >
                {loading
                  ? "..."
                  : mode === "login"
                  ? "Prijavi se"
                  : "Registruj se"}
              </button>
            </div>

            <div className="auth-divider">
              <span>ili</span>
            </div>

            <div className="auth-social">
              <button className="google">Nastavi sa Google</button>
              <button className="apple">Nastavi sa Apple</button>
            </div>

            {mode === "login" && (
              <button
                className="auth-link"
                onClick={() => setStep("forgot")}
              >
                Zaboravili ste lozinku?
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
