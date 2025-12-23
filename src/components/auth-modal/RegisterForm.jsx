import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";
import { COUNTRIES } from "../../utils/countries";

function RegisterForm({
  registerStep,
  registerName,
  registerPhone,
  registerEmail,
  registerPassword,
  setRegisterName,
  setRegisterPhone,
  setRegisterEmail,
  setRegisterPassword,
  registerTouched,
  setRegisterTouched,
  loading,
  formError,
  isValidEmail,
  nameRef,
  phoneRef,
  emailRef,
  showPassword,
  setShowPassword,
  onNextStep,
  onSubmit,
  selectedCountry,
  setSelectedCountry,
}) {
  const country = selectedCountry || COUNTRIES[0];

  return (
    <div className="auth-form">
      {registerStep === "phone" && (
        <>
          <div className="form-field">
            <label>Broj telefona</label>

            <div className="phone-field">
              <select
                className="phone-country"
                value={country.code}
                onChange={(e) => {
                  const c = COUNTRIES.find(
                    (x) => x.code === e.target.value
                  );
                  setSelectedCountry(c);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} +{c.dialCode}
                  </option>
                ))}
              </select>

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
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={onNextStep}
            disabled={loading}
          >
            Nastavi
          </button>

          {formError && <div className="error-text">{formError}</div>}
        </>
      )}

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
              className={
                registerTouched && !registerName ? "error" : ""
              }
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
            onClick={onSubmit}
            disabled={loading}
          >
            Registruj se
          </button>

          {formError && <div className="error-text">{formError}</div>}
        </>
      )}
    </div>
  );
}

export default RegisterForm;
