import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";

function LoginForm({
  loginMethod,
  setLoginMethod,
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
  const isPhone = loginMethod === "phone";
  const isEmail = loginMethod === "email";

  return (
    <div className="auth-form">
      {loginStep === "value" && (
        <>
          <div className="form-field">
            <label>{isPhone ? "Broj telefona" : "Email adresa"}</label>

            <input
              type="text"
              value={loginValue}
              disabled={isPhone}
              placeholder={
                isPhone ? "Uskoro dostupno" : "email@primer.com"
              }
              onChange={(e) => {
                setLoginValue(e.target.value);
                setLoginTouched(false);
              }}
              className={
                isPhone
                  ? "disabled"
                  : loginTouched &&
                    (!loginValue ||
                      (isEmail && !isValidEmail(loginValue)))
                  ? "error"
                  : ""
              }
            />
          </div>

          {isPhone && (
            <div className="auth-helper-text">
              Prijava preko broja telefona uskoro će biti dostupna.
            </div>
          )}

          <button
            className="auth-submit"
            type="button"
            onClick={isEmail ? onNext : undefined}
            disabled={loading || isPhone}
          >
            Nastavi
          </button>

          <button
            type="button"
            className="auth-link"
            onClick={() => {
              setLoginMethod(isPhone ? "email" : "phone");
              setLoginValue("");
              setLoginTouched(false);
            }}
          >
            {isPhone
              ? "Ili se prijavi preko emaila"
              : "Prijavi se preko broja telefona"}
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
                className={
                  loginTouched && !loginPassword ? "error" : ""
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
