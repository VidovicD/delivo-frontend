import React from "react";
import { isValidEmail } from "./authUtils";

function ForgotPasswordForm({
  email,
  setEmail,
  emailRef,
  loading,
  loginTouched,
  setLoginTouched,
  formError,
  setFormError,
  onSubmit,
  onBack,
}) {
  return (
    <>
      <div className="auth-hero auth-hero--forgot">
        <h2>Zaboravljena lozinka</h2>
      </div>

      <div className="auth-form">
        <div className="form-field">
          <label>Email adresa</label>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError("");
              setLoginTouched(false);
            }}
            className={
              loginTouched && (!email || !isValidEmail(email))
                ? "error"
                : ""
            }
          />
        </div>

        {formError && (
          <div className="error-text">{formError}</div>
        )}

        <button
          className="auth-submit"
          type="button"
          onClick={async () => {
            setLoginTouched(true);
            if (!email || !isValidEmail(email)) return;
            await onSubmit();
          }}
          disabled={loading}
        >
          Pošalji link za reset lozinke
        </button>

        <div className="auth-forgot-footer">
          <button
            type="button"
            className="auth-link"
            onClick={onBack}
          >
            Nazad
          </button>
        </div>
      </div>
    </>
  );
}

export default ForgotPasswordForm;
