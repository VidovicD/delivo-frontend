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
