import React from "react";
import { EyeOpen, EyeClosed } from "../auth-icons/EyeIcons";

function RegisterForm({
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
  onSubmit,
}) {
  return (
    <div className="auth-form">
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
        <label>Broj telefona</label>
        <input
          ref={phoneRef}
          type="tel"
          value={registerPhone}
          onChange={(e) => {
            setRegisterPhone(e.target.value);
            setRegisterTouched(false);
          }}
          className={registerTouched && !registerPhone ? "error" : ""}
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
            className={registerTouched && !registerPassword ? "error" : ""}
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
        Registruj se
      </button>

      {formError && <div className="error-text">{formError}</div>}
    </div>
  );
}

export default RegisterForm;
