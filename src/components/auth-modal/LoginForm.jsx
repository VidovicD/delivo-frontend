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
  const loginEmailServerError =
    formError === "Nalog sa ovom email adresom ne postoji." ||
    formError === "Unesite ispravnu email adresu." || // backend šalje staru poruku
    formError === "Nalog ne postoji. Registrujte se."; // backend šalje staru poruku
  
  const emailError = loginEmailServerError
    ? formError === "Unesite ispravnu email adresu." 
      ? !loginValue 
        ? "Unesite email adresu." // prazan email
        : "Email adresa nije u ispravnom formatu." // loš format
      : formError === "Nalog ne postoji. Registrujte se."
        ? "Nalog sa ovom email adresom ne postoji." // mapiramo staru na novu poruku
        : formError
    : loginTouched
      ? !loginValue
        ? "Unesite email adresu."
        : loginValue && !isValidEmail(loginValue)
          ? "Email adresa nije u ispravnom formatu."
          : ""
      : "";
  
  const hasEmailError = !!emailError;
  const loginPasswordServerError = formError === "Pogrešna lozinka.";
  const showLoginPasswordRequired =
    !loginPasswordServerError && loginTouched && !loginPassword;
  const loginPasswordError = loginPasswordServerError
    ? "Pogrešna lozinka."
    : showLoginPasswordRequired
      ? "Unesite lozinku."
      : "";
  const loginValidationMessages = [
    "Unesite email adresu.",
    "Email adresa nije u ispravnom formatu.",
    "Unesite lozinku.",
    "Pogrešna lozinka.",
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
                // Resetuj touched da se client validacija obriše
                if (loginTouched) setLoginTouched(false);
              }}
              className={
                hasEmailError
                  ? "error"
                  : ""
              }
            />
            {emailError && (
              <div className="field-error">{emailError}</div>
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
                if (formError) setFormError("");
                // Resetuj touched da se client validacija obriše
                if (loginTouched) setLoginTouched(false);
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
