import React from "react";
function RegisterForm({
  registerStep,
  registerName,
  registerEmail,
  registerPassword,
  registerPasswordConfirm,
  registerOtp,
  setRegisterName,
  setRegisterEmail,
  setRegisterPassword,
  setRegisterPasswordConfirm,
  setRegisterOtp,
  registerTouched,
  setRegisterTouched,
  loading,
  formError,
  isValidEmail,
  nameRef,
  emailRef,
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
            <input
              type="password"
              value={registerPassword}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setRegisterPassword(e.target.value);
                setRegisterTouched(false);
              }}
              className={
                registerTouched && !registerPassword ? "error" : ""
              }
            />
          </div>

          <div className="form-field">
            <label>Potvrdi lozinku</label>
            <input
              type="password"
              value={registerPasswordConfirm}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setRegisterPasswordConfirm(e.target.value);
                setRegisterTouched(false);
              }}
              className={
                registerTouched && !registerPasswordConfirm ? "error" : ""
              }
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
