import React from "react";

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
  setFormError,
  isValidEmail,
  passwordRef,
  onNext,
  onSubmit,
  onBack,
}) {
  const loginEmailError =
    loginTouched && (!loginValue || !isValidEmail(loginValue))
      ? "Unesite ispravnu email adresu."
      : "";
  const loginEmailServerError =
    formError === "Nalog ne postoji. Registrujte se.";
  const loginPasswordServerError = formError === "Pogresna lozinka.";
  const showLoginPasswordRequired =
    !loginPasswordServerError && loginTouched && !loginPassword;
  const loginPasswordError = showLoginPasswordRequired
    ? "Lozinka je obavezna."
    : "";
  const loginValidationMessages = [
    "Unesite ispravnu email adresu.",
    "Lozinka je obavezna.",
    "Pogresna lozinka.",
  ];
  const showFormError =
    formError && !loginValidationMessages.includes(formError);

  return (
    <div className="auth-form">
      {loginStep === "value" && (
        <>
          <div className="form-field">
            <label>Email adresa</label>
            <input
              type="email"
              value={loginValue}
              onChange={(e) => {
                setLoginValue(e.target.value);
                if (formError) setFormError("");
              }}
              className={
                (loginTouched &&
                  (!loginValue || !isValidEmail(loginValue))) ||
                loginEmailServerError
                  ? "error"
                  : ""
              }
            />
            {loginEmailError && (
              <div className="field-error">{loginEmailError}</div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
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
          <div className="form-field">
            <label>Lozinka</label>

            <input
              ref={passwordRef}
              type="password"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
              }}
              className={
                showLoginPasswordRequired ||
                loginPasswordServerError
                  ? "error"
                  : ""
              }
            />
            {loginPasswordError && (
              <div className="field-error">{loginPasswordError}</div>
            )}
            {loginPasswordServerError && (
              <div className="field-error">{formError}</div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
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
            className="auth-link auth-link--no-spacing"
            onClick={onBack}
            disabled={loading}
          >
            Nazad
          </button>
        </>
      )}
    </div>
  );
}

export default LoginForm;
