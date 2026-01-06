import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";

function RegisterForm({
  registerStep,
  registerName,
  registerEmail,
  registerPassword,
  registerOtp,
  setRegisterName,
  setRegisterEmail,
  setRegisterPassword,
  setRegisterOtp,
  registerTouched,
  setRegisterTouched,
  loading,
  formError,
  isValidEmail,
  nameRef,
  emailRef,
  showPassword,
  setShowPassword,
  onSubmit,
  otpExpiresAt,
  otpAttemptsLeft,
  onResendOtp,
}) {
  const minutesLeft = otpExpiresAt
    ? Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 60000))
    : 0;

  return (
    <div className="auth-form">
      {registerStep === "details" && (
        <>
          <div className="form-field">
            <label>Ime</label>
            <input
              ref={nameRef}
              type="text"
              value={registerName}
              onChange={(e) => {
                setRegisterName(e.target.value);
                setRegisterTouched(false);
              }}
              className={registerTouched && !registerName ? "error" : ""}
            />
          </div>

          <div className="form-field">
            <label>Email adresa</label>
            <input
              ref={emailRef}
              type="email"
              value={registerEmail}
              onChange={(e) => {
                setRegisterEmail(e.target.value);
                setRegisterTouched(false);
              }}
              className={
                registerTouched &&
                (!registerEmail || !isValidEmail(registerEmail))
                  ? "error"
                  : ""
              }
            />
          </div>

          <div className="form-field">
            <label>Lozinka</label>

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={registerPassword}
                onChange={(e) => {
                  setRegisterPassword(e.target.value);
                  setRegisterTouched(false);
                }}
                className={
                  registerTouched && !registerPassword ? "error" : ""
                }
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((p) => !p)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOpen /> : <EyeClosed />}
              </button>
            </div>
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setRegisterTouched(true);
              onSubmit();
            }}
            disabled={loading}
          >
            Registruj se
          </button>

          {formError && <div className="error-text">{formError}</div>}
        </>
      )}

      {registerStep === "otp" && (
        <>
          <p className="auth-helper-text">
            Poslat je kod na email <strong>{registerEmail}</strong>
          </p>

          <p className="auth-helper-text">
            Kod vazi jos {minutesLeft} min | Preostali pokusaji:{" "}
            {otpAttemptsLeft}
          </p>

          <div className="form-field">
            <label>Verifikacioni kod</label>
            <input
              type="text"
              inputMode="numeric"
              value={registerOtp}
              onChange={(e) => {
                setRegisterOtp(e.target.value);
                setRegisterTouched(false);
              }}
              className={registerTouched && !registerOtp ? "error" : ""}
            />
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setRegisterTouched(true);
              onSubmit();
            }}
            disabled={loading}
          >
            Potvrdi kod
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={onResendOtp}
            disabled={loading}
          >
            Posalji novi kod
          </button>

          {formError && <div className="error-text">{formError}</div>}
        </>
      )}
    </div>
  );
}

export default RegisterForm;
