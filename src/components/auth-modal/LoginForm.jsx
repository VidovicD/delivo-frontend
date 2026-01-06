import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";

function LoginForm({
  loginStep,
  loginValue,
  loginPassword,
  setLoginValue,
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
      {loginStep === "value" && (
        <>
          <div className="form-field">
            <label>Email adresa</label>
            <input
              type="email"
              value={loginValue}
              placeholder="email@primer.com"
              onChange={(e) => {
                setLoginValue(e.target.value);
                setLoginTouched(false);
              }}
              className={
                loginTouched &&
                (!loginValue || !isValidEmail(loginValue))
                  ? "error"
                  : ""
              }
            />
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setLoginTouched(true);
              onNext();
            }}
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
                tabIndex={-1}
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
            disabled={loading}
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
