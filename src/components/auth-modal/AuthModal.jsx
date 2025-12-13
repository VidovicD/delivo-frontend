import React, { useEffect, useRef, useState } from "react";
import "./AuthModal.css";
import { supabase } from "../../supabaseClient";

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

/* ================= HELPERS ================= */

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const getAuthErrorMessage = (err) => {
  if (!err) return "";
  const msg = (err.message || "").toLowerCase();

  if (msg.includes("invalid login credentials"))
    return "Pogrešan email ili lozinka.";

  if (msg.includes("already") && msg.includes("registered"))
    return "Nalog sa ovom email adresom već postoji.";

  if (msg.includes("password"))
    return "Lozinka mora imati najmanje 6 karaktera.";

  if (msg.includes("email") && msg.includes("invalid"))
    return "Email adresa nije validna.";

  if (msg.includes("rate limit"))
    return "Previše pokušaja. Pokušajte kasnije.";

  return "Došlo je do greške. Pokušajte ponovo.";
};

const SuccessCheck = () => (
  <svg className="auth-success-check" viewBox="0 0 52 52">
    <circle
      className="auth-success-circle"
      cx="26"
      cy="26"
      r="25"
      fill="none"
    />
    <path
      className="auth-success-mark"
      fill="none"
      d="M14 27l7 7 17-17"
    />
  </svg>
);

/* ================= COMPONENT ================= */

function AuthModal({ mode, onClose, onSwitch }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth"); // auth | forgot | success
  const [successType, setSuccessType] = useState("auth");

  // LOGIN
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // REGISTER
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // "aktivni" inputi u zavisnosti od taba
  const email = mode === "login" ? loginEmail : registerEmail;
  const password = mode === "login" ? loginPassword : registerPassword;
  const name = registerName;

  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("weak");

  const [loading, setLoading] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [formError, setFormError] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const resendKey = email ? `resendUntil:${email}` : null;

  const [resendSuccess, setResendSuccess] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
    setLoading(false);

    if (mode === "register") nameRef.current?.focus();
    else emailRef.current?.focus();
  }, [mode]);

  // ✅ kad menjaš tab: briši samo poruke/flagove (NE inpute)
  useEffect(() => {
    setFormError("");
    setNeedsEmailVerification(false);
    setShowPassword(false);
  }, [mode]);

  useEffect(() => {
    if (step === "success") {
      if (isMobile() && navigator.vibrate) navigator.vibrate(40);

      const t = setTimeout(() => {
        if (successType === "auth") {
          onClose();
          window.location.href = "/";
        }
      }, 3500);

      return () => clearTimeout(t);
    }
  }, [step, successType, onClose]);

  useEffect(() => {
    if (!resendKey) return;

    const storedUntil = Number(localStorage.getItem(resendKey) || 0);
    const now = Date.now();

    if (storedUntil > now) {
      const secondsLeft = Math.ceil((storedUntil - now) / 1000);
      setResendCooldown(secondsLeft);
    }
  }, [resendKey]);

  useEffect(() => {
    setResendSuccess("");
  }, [email]);

  useEffect(() => {
    if (step !== "auth") setResendSuccess("");
  }, [step]);

  useEffect(() => {
    setNeedsEmailVerification(false);
    setResendSuccess("");      // 👈 KLJUČNO
    // ❌ NE DIRAMO resendCooldown OVDE
  }, [email]);

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleLogin = async () => {
    if (loading) return;

    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      setFormError(getAuthErrorMessage(error));
    }
  };

  /* ================= LOGIN / REGISTER ================= */

  const handleSubmit = async () => {
    setFormError("");

    // validacija (radi i za login i za register)
    if (!email || !password || (mode === "register" && !name)) {
      setFormError("Popunite sva obavezna polja.");
      return;
    }

    setLoading(true);

    try {
      /* ================= REGISTER ================= */
      if (mode === "register") {
        const { data, error: fnError } = await supabase.functions.invoke(
          "check-email",
          { body: { email } }
        );

        if (fnError) {
          console.error("EDGE FUNCTION ERROR:", fnError);
          setLoading(false);
          setFormError("Greška na serveru. Pokušajte ponovo.");
          return;
        }

        // ❌ Postoji i potvrđen je → prebaci na login
        if (data?.exists && data?.confirmed) {
          setLoading(false);
          onSwitch("login");

          requestAnimationFrame(() => {
            setFormError(
              "Nalog sa ovom email adresom već postoji. Prijavite se."
            );
          });

          return;
        }

        // ⚠️ Postoji ali nije potvrđen → ostaje na register, pokaži resend
        if (data?.exists && !data?.confirmed) {
          setLoading(false);
          setNeedsEmailVerification(true);
          setResendSuccess(""); // da nema dve poruke
          setFormError("Nalog već postoji, ali email nije potvrđen. Proverite inbox.");
          return;
        }

        // ✅ Prava registracija
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        });

        if (error) {
          setLoading(false);
          setFormError(getAuthErrorMessage(error));
          return;
        }

        setLoading(false);
        setSuccessType("verify");
        setStep("success");
        return;
      }

      /* ================= LOGIN ================= */
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);

        // 🔒 Email nije potvrđen
        if (error.message?.toLowerCase().includes("confirm")) {
          setNeedsEmailVerification(true);
          setResendSuccess(""); // da nema dve poruke
          setFormError(
            "Email adresa nije potvrđena. Proverite inbox i kliknite na link za potvrdu."
          );
          return;
        }

        setFormError(getAuthErrorMessage(error));
        return;
      }

      // ✅ Login uspešan
      setLoading(false);
      setSuccessType("auth");
      setStep("success");
    } catch (err) {
      setLoading(false);
      setFormError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  /* ================= FORGOT PASSWORD ================= */

  const handleForgotPassword = async () => {
    // forgot je iz login-a → koristi loginEmail
    if (!loginEmail) {
      setFormError("Email je obavezan.");
      return;
    }

    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: window.location.origin + "/reset-password",
    });

    setLoading(false);

    if (error) setFormError(getAuthErrorMessage(error));
    else {
      setSuccessType("forgot");
      setStep("success");
    }
  };

  /* ================= RESEND VERIFICATION ================= */

  const handleResendVerification = async () => {
    if (loading || resendCooldown > 0) return;
    if (!email) return;

    const now = Date.now();
    const storedUntil = resendKey
      ? Number(localStorage.getItem(resendKey) || 0)
      : 0;

    if (storedUntil > now) {
    const secondsLeft = Math.ceil((storedUntil - now) / 1000);
    setResendCooldown(secondsLeft);

    // ✅ Zeleni tekst pokaži samo ako je već bio prikazan za OVAJ email
    // (a kad promeniš email, ti ga brišeš u useEffect([email]) -> setResendSuccess(""))
    if (resendSuccess) {
      setFormError("");
      setResendSuccess(
        "Email za potvrdu je ponovo poslat. Proverite inbox (i spam)."
      );
    }

    return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    const until = Date.now() + 60 * 1000;

    if (resendKey) {
      localStorage.setItem(resendKey, until.toString());
    }

    if (!error) {
      const newUntil = Date.now() + 60 * 1000;

      if (resendKey) {
        localStorage.setItem(resendKey, newUntil.toString());
      }

      setResendCooldown(60);        // 👈 UVEK resetuj
      setFormError("");
      setResendSuccess(
        "Email za potvrdu je ponovo poslat. Proverite inbox (i spam)."
      );
    }

  };

  /* ================= RENDER ================= */

  return (
    <div
      className="auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setLoading(false);
          onClose();
        }
      }}
    >
      <div
        className="auth-modal"
        ref={modalRef}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-close"
          onClick={() => {
            setLoading(false);
            onClose();
          }}
        >
          ✕
        </button>

        {/* SUCCESS */}
        {step === "success" && (
          <div className="auth-success">
            <SuccessCheck />

            <h2 className="auth-success-title">Uspešno</h2>

            <p className="auth-success-text">
              {successType === "verify" && (
                <>
                  Email za potvrdu je uspešno poslat.
                  <br />
                  Molimo vas da proverite inbox i pratite instrukcije.
                </>
              )}

              {successType === "verify_or_login" && (
                <>
                  Ako je ovo nova registracija, poslali smo vam email za potvrdu.
                  <br />
                  Ukoliko već imate nalog, možete se odmah prijaviti.
                </>
              )}

              {successType === "forgot" && (
                <>
                  Link za resetovanje lozinke je poslat na vašu email adresu.
                  <br />
                  Proverite inbox za dalja uputstva.
                </>
              )}

              {successType === "auth" && (
                <>Uspešno ste se prijavili.</>
              )}
            </p>

            {successType === "verify_or_login" && (
              <button
                className="auth-link"
                onClick={() => {
                  setStep("auth");
                  onSwitch("login");
                }}
              >
                Idi na prijavu
              </button>
            )}
          </div>
        )}

        {/* FORGOT */}

        {step === "forgot" && (
          <>
            <div className="auth-hero">
              <div className="auth-avatar">🔒</div>
              <h2>Zaboravljena lozinka</h2>
            </div>

            <div className="auth-form">
              <input
                ref={emailRef}
                type="email"
                placeholder="Email adresa"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />

              {formError && <div className="error-text">{formError}</div>}
              {resendSuccess && (
                <div className="success-text">{resendSuccess}</div>
              )}

              <button
                className="auth-submit"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                Pošalji link
              </button>

              <button className="auth-link" onClick={() => setStep("auth")}>
                Nazad
              </button>
            </div>
          </>
        )}

        {/* AUTH */}
        {step === "auth" && (
          <>
            <div className="auth-hero">
              <div className="auth-avatar">👤</div>
              <h2>{mode === "login" ? "Prijava" : "Registracija"}</h2>
            </div>

            <div className="auth-tabs">
              <div
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => onSwitch("login")}
              >
                Prijava
              </div>

              <div
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => onSwitch("register")}
              >
                Registracija
              </div>

              <div className={`auth-indicator ${mode}`} />
            </div>

            <div className="auth-form">
              {mode === "register" && (
                <input
                  ref={nameRef}
                  type="text"
                  placeholder="Ime i prezime"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                />
              )}

              <input
                ref={emailRef}
                type="email"
                placeholder="Email adresa"
                value={mode === "login" ? loginEmail : registerEmail}
                onChange={(e) =>
                  mode === "login"
                    ? setLoginEmail(e.target.value)
                    : setRegisterEmail(e.target.value)
                }
              />

              <div className="password-field">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Lozinka"
                  value={mode === "login" ? loginPassword : registerPassword}
                  onChange={(e) =>
                    mode === "login"
                      ? setLoginPassword(e.target.value)
                      : setRegisterPassword(e.target.value)
                  }
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                />

                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Prikaži / sakrij lozinku"
                >
                  {showPassword ? <EyeOpen /> : <EyeClosed />}
                </button>
              </div>

              {capsLock && (
                <div className="caps-warning">⚠ Caps Lock je uključen</div>
              )}

              <button className="auth-submit" onClick={handleSubmit} disabled={loading}>
                {mode === "login" ? "Prijavi se" : "Registruj se"}
              </button>

              {formError && <div className="error-text">{formError}</div>}

              {resendSuccess && (
                <div className="success-text">{resendSuccess}</div>
              )}

              {needsEmailVerification && (
                <button
                  type="button"
                  className="auth-link"
                  onClick={handleResendVerification}
                  disabled={loading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Ponovo pošalji za ${resendCooldown}s`
                    : "Ponovo pošalji verifikacioni email"}
                </button>
              )}
            </div>

            <div className="auth-divider">
              <span>ili</span>
            </div>

            <div className="auth-social">
              <button className="google" onClick={handleGoogleLogin}>
                Nastavi sa Google
              </button>

              <button className="apple" disabled>
                Nastavi sa Apple
              </button>
            </div>

            {mode === "login" && (
              <button className="auth-link" onClick={() => setStep("forgot")}>
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
