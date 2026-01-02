import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";
import { COUNTRIES } from "../../utils/countries";

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
  selectedCountry,
  setSelectedCountry,
}) {
  const isPhone = loginMethod === "phone";
  const isEmail = loginMethod === "email";

  return (
    <div className="auth-form">
      {loginStep === "value" && (
        <>
          {isPhone && (
            <div className="form-field">
              <label>Broj telefona</label>

              <div className="phone-field">
                <div className="phone-country-wrapper">
                  <select
                    className="phone-country"
                    value={selectedCountry.code}
                    onMouseDown={(e) => {
                      if (document.activeElement === e.target) {
                        e.preventDefault();
                        e.target.blur();
                      }
                    }}
                    onChange={(e) => {
                      const country = COUNTRIES.find(
                        (c) => c.code === e.target.value
                      );
                      if (country) setSelectedCountry(country);
                      e.target.blur();
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} +{c.dialCode}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className="phone-input"
                  type="tel"
                  value={loginValue}
                  placeholder={selectedCountry.placeholder}
                  onChange={(e) => {
                    setLoginValue(e.target.value);
                    setLoginTouched(false);
                  }}
                />
              </div>
            </div>
          )}

          {isEmail && (
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
          )}

          <button
            className="auth-submit"
            type="button"
            onClick={onNext}
            disabled={loading}
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
              ? "Prijavi se preko emaila"
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
