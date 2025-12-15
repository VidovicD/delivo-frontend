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
    <circle className="auth-success-circle" cx="26" cy="26" r="25" fill="none" />
    <path className="auth-success-mark" fill="none" d="M14 27l7 7 17-17" />
  </svg>
);

const isValidEmail = (email) =>
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function AuthModal({ mode, onClose, onSwitch }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth"); // auth | forgot | success
  const [successType, setSuccessType] = useState("auth");

  const [loginStep, setLoginStep] = useState("email"); // email | password

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const email = mode === "login" ? loginEmail : registerEmail;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const resendKey = email ? `resendUntil:${email}` : null;

  const [resendSuccess, setResendSuccess] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  
 const switchMode = (nextMode) => {
  setStep("auth");
  // ugasi oba error režima (da nema “prenosa”)
  setLoginTouched(false);
  setRegisterTouched(false);
  setFormError("");

  // obriši polja (tvoj izbor: clean slate)
  setLoginEmail("");
  setLoginPassword("");
  setRegisterName("");
  setRegisterPhone("");
  setRegisterEmail("");
  setRegisterPassword("");

  // reset login flow kad se vraćaš na login
  if (nextMode === "login") {
    setLoginStep("email");
  }

  onSwitch(nextMode);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((p) => p - 1), 1000);
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

    if (step !== "auth") return;

    if (mode === "register") nameRef.current?.focus();
    else emailRef.current?.focus();
  }, [mode, step]);

  useEffect(() => {
    setShowPassword(false);
  }, [mode]);

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
    setNeedsEmailVerification(false);
  }, [email]);

  useEffect(() => {
    if (step !== "success") return;

    // 🔐 SAMO POSLE LOGIN-A
    if (successType === "auth") {
      const t = setTimeout(() => {
        onClose();
        window.location.href = "/restaurants";
      }, 900);

      return () => clearTimeout(t);
    }

    // ⛔ forgot / verify / reset → nema redirecta
  }, [step, successType, onClose]);

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setLoading(false);
      setFormError(getAuthErrorMessage(error));
    }
  };

  const handleAppleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setLoading(false);
      setFormError(getAuthErrorMessage(error));
    }
  };

  const handleLoginNext = async () => {
    setLoginTouched(true);
    setFormError("");
    setNeedsEmailVerification(false);

    if (!loginEmail) {
      setFormError("Email je obavezan.");
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "check-email",
        { body: { email: loginEmail } }
      );

      setLoading(false);

      if (error) {
        setFormError("Greška na serveru. Pokušajte ponovo.");
        return;
      }

      if (!data?.exists) {
        setFormError("Ne postoji nalog sa ovom email adresom.");
        return;
      }

      if (data.exists && !data.confirmed) {
        setNeedsEmailVerification(true);
        setFormError(
          "Email adresa nije potvrđena. Proverite inbox."
        );
        return;
      }

      // ✅ PRELAZ NA PASSWORD
      setLoginTouched(false);
      setLoginStep("password");

      requestAnimationFrame(() => {
        passwordRef.current?.focus();
      });
    } catch {
      setLoading(false);
      setFormError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (mode === "login") {
      setLoginTouched(true);
    } else {
      setRegisterTouched(true);
    }

    if (mode === "login") {
      if (!loginEmail) {
        setFormError("Email je obavezan.");
        return;
      }

      if (loginStep !== "password") {
        setLoginStep("password");
        requestAnimationFrame(() => passwordRef.current?.focus());
        return;
      }

      if (!loginPassword) {
        setFormError("Lozinka je obavezna.");
        return;
      }

      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      setLoading(false);

      if (error) {
        if (error.message?.toLowerCase().includes("confirm")) {
          setNeedsEmailVerification(true);
          setResendSuccess("");
          setFormError(
            "Email adresa nije potvrđena. Proverite inbox i kliknite na link za potvrdu."
          );
          return;
        }
        setFormError(getAuthErrorMessage(error));
        return;
      }

      setSuccessType("auth");
      setStep("success");
      return;
    }

    if (!registerName || !registerPhone || !registerEmail || !registerPassword) {
      setFormError("Popunite sva obavezna polja.");
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    if (registerPassword.length < 6) {
      setFormError("Lozinka mora sadržati najmanje 6 karaktera.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "check-email",
        { body: { email: registerEmail } }
      );

      if (fnError) {
        setLoading(false);
        setFormError("Greška na serveru. Pokušajte ponovo.");
        return;
      }

      if (data?.exists && data?.confirmed) {
        setLoading(false);
        onSwitch("login");
        requestAnimationFrame(() => {
          setFormError("Nalog sa ovom email adresom već postoji. Prijavite se.");
        });
        return;
      }

      if (data?.exists && !data?.confirmed) {
        setLoading(false);
        setNeedsEmailVerification(true);
        setResendSuccess("");
        setFormError(
          "Nalog već postoji, ali email nije potvrđen. Proverite inbox."
        );
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          data: {
            full_name: registerName,
            phone: registerPhone,
          },
        },
      });

      setLoading(false);

      if (error) {
        setFormError(getAuthErrorMessage(error));
        return;
      }

      setSuccessType("verify_or_login");
      setStep("success");
    } catch (err) {
      setLoading(false);
      setFormError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleForgotPassword = async () => {
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

  const handleResendVerification = async () => {
    if (loading || resendCooldown > 0) return;
    if (!email) return;

    const now = Date.now();
    const storedUntil = resendKey ? Number(localStorage.getItem(resendKey) || 0) : 0;

    if (storedUntil > now) {
      const secondsLeft = Math.ceil((storedUntil - now) / 1000);
      setResendCooldown(secondsLeft);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    const until = Date.now() + 60 * 1000;
    if (resendKey) localStorage.setItem(resendKey, until.toString());

    if (!error) {
      setResendCooldown(60);
      setFormError("");
      setResendSuccess(
        "Email za potvrdu je ponovo poslat. Proverite inbox (i spam)."
      );
    } else {
      setFormError(getAuthErrorMessage(error));
    }
  };

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

        {step === "success" && (
          <div className="auth-success">
            <SuccessCheck />
            <h2 className="auth-success-title">Uspešno</h2>

            <p className="auth-success-text">
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
              {successType === "auth" && <>Uspešno ste se prijavili.</>}
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

        {step === "forgot" && (
          <>
            <div className="auth-hero auth-hero--forgot">
              <h2>Zaboravljena lozinka</h2>
            </div>

            <div className="auth-form">
              {/* EMAIL INPUT */}
              <div className="form-field">
                <label>Email adresa</label>

                <input
                  ref={emailRef}
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setFormError("");
                    setLoginTouched(false);
                  }}
                  className={
                    loginTouched &&
                    (!loginEmail || !isValidEmail(loginEmail))
                      ? "error"
                      : ""
                  }
                />
              </div>

              {/* SUBMIT */}
              <button
                className="auth-submit"
                onClick={() => {
                  setLoginTouched(true);

                  if (!loginEmail || !isValidEmail(loginEmail)) return;

                  handleForgotPassword();
                }}
                disabled={loading}
              >
                Pošalji link za reset lozinke
              </button>

              {/* WARNING + BACK (bliže jedno drugom) */}
              <div className="auth-forgot-footer">
                {loginTouched && !loginEmail && (
                  <div className="error-text">
                    Email adresa je obavezna.
                  </div>
                )}

                {loginTouched && loginEmail && !isValidEmail(loginEmail) && (
                  <div className="error-text">
                    Unesite ispravnu email adresu.
                  </div>
                )}

                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setFormError("");
                    setLoginTouched(false);
                    setStep("auth");
                  }}
                >
                  Nazad
                </button>
              </div>
            </div>
          </>
        )}

        {step === "auth" && (
          <>
            <div className="auth-hero">
              <h2>{mode === "login" ? "Prijava" : "Registracija"}</h2>
            </div>

            <div className="auth-tabs">
              <div
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => switchMode("login")}
              >
                Prijava
              </div>

              <div
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => switchMode("register")}
              >
                Registracija
              </div>

              <div className={`auth-indicator ${mode}`} />
            </div>

              <div className="auth-form">
                {mode === "register" && (
                  <>
                    <div className="form-field">
                      <label>Ime i prezime</label>
                      <input
                        ref={nameRef}
                        type="text"
                        value={registerName}
                        onChange={(e) => {
                          setRegisterName(e.target.value);
                          setRegisterTouched(false);
                        }}
                        className={
                          registerTouched && !registerName ? "error" : ""
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Broj telefona</label>
                      <input
                        ref={phoneRef}
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => {
                          setRegisterPhone(e.target.value);
                          setRegisterTouched(false);
                        }}
                        className={
                          registerTouched && !registerPhone ? "error" : ""
                        }
                      />
                    </div>
                  </>
                )}

                {/* EMAIL – sakriva se samo u login/password koraku */}
                {!(mode === "login" && loginStep === "password") && (
                  <div className="form-field">
                    <label>Email adresa</label>
                    <input
                      ref={emailRef}
                      type="email"
                      value={mode === "login" ? loginEmail : registerEmail}
                      onChange={(e) => {
                        if (mode === "login") {
                          setLoginEmail(e.target.value);
                          setLoginTouched(false);
                        } else {
                          setRegisterEmail(e.target.value);
                          setRegisterTouched(false);
                        }
                      }}
                      className={
                        mode === "login"
                          ? loginTouched &&
                            (!loginEmail || !isValidEmail(loginEmail))
                            ? "error"
                            : ""
                          : registerTouched &&
                            (!registerEmail || !isValidEmail(registerEmail))
                          ? "error"
                          : ""
                      }
                    />
                  </div>
                )}

                {mode === "login" && loginStep === "email" ? (
                  <button
                    className="auth-submit"
                    type="button"
                    onClick={handleLoginNext}
                    disabled={loading}
                  >
                    Nastavi
                  </button>
                ) : (
                  <>
                    {/* HELPER TEKST SAMO ZA LOGIN PASSWORD */}
                    {mode === "login" && loginStep === "password" && (
                      <p className="auth-helper-text">
                        Unesite lozinku da biste se prijavili
                      </p>
                    )}

                    {/* PASSWORD */}
                    <div className="form-field">
                      <label>Lozinka</label>
                      <div className="password-field">
                        <input
                          ref={passwordRef}
                          type={showPassword ? "text" : "password"}
                          value={mode === "login" ? loginPassword : registerPassword}
                          onChange={(e) => {
                            if (mode === "login") {
                              setLoginPassword(e.target.value);
                              setLoginTouched(false);
                            } else {
                              setRegisterPassword(e.target.value);
                              setRegisterTouched(false);
                            }
                          }}
                          className={
                            mode === "login"
                              ? loginTouched && !loginPassword
                                ? "error"
                                : ""
                              : registerTouched && !registerPassword
                              ? "error"
                              : ""
                          }
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowPassword((p) => !p)}
                        >
                          {showPassword ? <EyeOpen /> : <EyeClosed />}
                        </button>
                      </div>
                    </div>

                    <button
                      className="auth-submit"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {mode === "login" ? "Prijavi se" : "Registruj se"}
                    </button>

                    {mode === "login" && (
                      <button
                        type="button"
                        className="auth-link"
                        onClick={() => {
                          setLoginStep("email");
                          setLoginPassword("");
                          setFormError("");
                          requestAnimationFrame(() =>
                            emailRef.current?.focus()
                          );
                        }}
                      >
                        Nazad
                      </button>
                    )}
                  </>
                )}

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
              <button
                className="google"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                Nastavi sa Google
              </button>

              <button
                className="apple"
                onClick={handleAppleLogin}
                disabled={loading}
              >
                Nastavi sa Apple
              </button>
            </div>

            {mode === "login" && (
            <button
              type="button"
              className="auth-forgot"
              onClick={() => setStep("forgot")}
            >
              Zaboravili ste lozinku?
            </button>
            )}

            {mode === "register" && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => {
                  switchMode("login");
                  requestAnimationFrame(() => emailRef.current?.focus());
                }}
              >
                Imate nalog? Ulogujte se
              </button>
            )}

          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
