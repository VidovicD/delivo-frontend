import React from "react";

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
    <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
  </svg>
);

function LoginForm({
  loginStep,
  loginEmail,
  loginPassword,
  setLoginEmail,
  setLoginPassword,
  loginTouched,
  setLoginTouched,
  loading,
  formError,
  isValidEmail,
  passwordRef,
  onNext,
  onSubmit,
  onBack,
  showPassword,
  setShowPassword,
}) {
  return (
    <div className="auth-form">
      {loginStep === "email" && (
        <>
          <div className="form-field">
            <label>Email adresa</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
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

          <button
            className="auth-submit"
            type="button"
            onClick={onNext}
            disabled={loading}
          >
            Nastavi
          </button>
        </>
      )}

      {loginStep === "password" && (
        <>
          <p className="auth-helper-text">
            Unesite lozinku da biste se prijavili
          </p>

          <div className="form-field">
            <label>Lozinka</label>

            <div className="password-field">
              <input
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setLoginTouched(false);
                }}
                className={loginTouched && !loginPassword ? "error" : ""}
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
            type="button"
            onClick={onSubmit}
            disabled={loading}
          >
            Prijavi se
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={onBack}
          >
            Nazad
          </button>
        </>
      )}

      {formError && <div className="error-text">{formError}</div>}
    </div>
  );
}

export default LoginForm;
