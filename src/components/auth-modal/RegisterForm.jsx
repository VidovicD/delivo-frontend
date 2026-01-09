import React from "react";
function RegisterForm({
  registerStep,
  registerName,
  registerEmail,
  registerPassword,
  registerPasswordConfirm,
  registerOtp,
  setRegisterName,
  setRegisterEmail,
  setRegisterPassword,
  setRegisterPasswordConfirm,
  setRegisterOtp,
  registerTouched,
  setRegisterTouched,
  loading,
  formError,
  setFormError,
  cooldownMessage,
  isValidEmail,
  nameRef,
  emailRef,
  onSubmit,
  otpExpiresAt,
  otpAttemptsLeft,
  otpLocked,
  onResendOtp,
}) {
  const registerEmailError = registerTouched.email
    ? !registerEmail
      ? "Unesite email adresu."
      : !isValidEmail(registerEmail)
        ? "Email adresa nije validna."
        : ""
    : "";
  const registerOtpError =
    registerTouched.otp && !registerOtp ? "Unesite kod." : "";
  const registerOtpServerErrors = [
    "Pogresan kod.",
    "Pogrešan kod.",
    "Kod je istekao. Zatrazite novi kod.",
    "Previse pokusaja. Sacekajte 5 minuta pa pokusajte ponovo.",
    "Email adresa nije validna.",
    "Doslo je do greske. Pokusajte ponovo.",
  ];
  const isLockoutMessage = formError && formError.includes("Previse pokusaja") && formError.includes("Sacekajte");
  const registerOtpServerError = (registerOtpServerErrors.includes(formError) || isLockoutMessage);
  const registerEmailServerError =
    formError ===
    "Nalog sa tim emailom vec postoji. Molimo vas, ulogujte se.";
  const showRegisterEmailRequired =
    !registerEmailServerError && registerEmailError;
  const registerNameError =
    registerTouched.name && !registerName ? "Ime je obavezno." : "";
  const registerPasswordError = registerTouched.password
    ? !registerPassword
      ? "Lozinka je obavezna."
      : registerPassword.length < 6
        ? "Lozinka mora imati najmanje 6 karaktera."
        : ""
    : "";
  const registerPasswordConfirmError = registerTouched.passwordConfirm
    ? !registerPasswordConfirm
      ? "Potvrda lozinke je obavezna."
      : registerPassword !== registerPasswordConfirm
        ? "Lozinke se ne poklapaju."
        : ""
    : "";
  const registerValidationMessages = [
    "Unesite email adresu.",
    "Email adresa nije validna.",
    "Unesite kod.",
    "Ime je obavezno.",
    "Lozinka je obavezna.",
    "Lozinka mora imati najmanje 6 karaktera.",
    "Potvrda lozinke je obavezna.",
    "Lozinke se ne poklapaju.",
    "Popunite sva polja.",
  ];
  
  // Ne prikazuj greške koje se odnose na kod kada je korisnik na email ekranu
  const isCodeRelatedError = formError && (
    formError.includes("Kod je vec poslat") ||
    formError.includes("Kod je poslat") ||
    formError.includes("Kod je istekao") ||
    formError.includes("Previse pokusaja") ||
    formError.includes("Previše pokušaja") ||
    formError.includes("Sacekajte") ||
    formError.includes("Sačekajte")
  );
  
  const showFormError =
    formError && 
    !registerValidationMessages.includes(formError) &&
    !(registerStep === "email" && isCodeRelatedError);

  return (
    <div className="auth-form">
      {registerStep === "email" && (
        <>
          <div className="form-field">
            <label>Email adresa</label>
            <input
              ref={emailRef}
              type="email"
              value={registerEmail}
              onChange={(e) => {
                setRegisterEmail(e.target.value);
              }}
              className={
                (registerTouched.email &&
                  (!registerEmail || !isValidEmail(registerEmail))) ||
                registerEmailServerError
                  ? "error"
                  : ""
              }
            />
            {showRegisterEmailRequired && (
              <div className="field-error">{registerEmailError}</div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setRegisterTouched((t) => ({ ...t, email: true }));
              onSubmit();
            }}
            disabled={loading}
          >
            Nastavi
          </button>

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
              }}
              className={
                registerTouched.name && !registerName ? "error" : ""
              }
            />
            {registerNameError && (
              <div className="field-error">{registerNameError}</div>
            )}
          </div>

          <div className="form-field">
            <label>Lozinka</label>
            <input
              type="password"
              value={registerPassword}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setRegisterPassword(e.target.value);
              }}
              className={
                registerTouched.password &&
                (!registerPassword || registerPassword.length < 6)
                  ? "error"
                  : ""
              }
            />
            {registerPasswordError && (
              <div className="field-error">{registerPasswordError}</div>
            )}
          </div>

          <div className="form-field">
            <label>Potvrdi lozinku</label>
            <input
              type="password"
              value={registerPasswordConfirm}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setRegisterPasswordConfirm(e.target.value);
              }}
              className={
                registerTouched.passwordConfirm &&
                (!registerPasswordConfirm ||
                  registerPassword !== registerPasswordConfirm)
                  ? "error"
                  : ""
              }
            />
            {registerPasswordConfirmError && (
              <div className="field-error">
                {registerPasswordConfirmError}
              </div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setRegisterTouched((t) => ({
                ...t,
                name: true,
                password: true,
                passwordConfirm: true,
              }));
              onSubmit();
            }}
            disabled={loading}
          >
            Registruj se
          </button>

        </>
      )}

      {registerStep === "otp" && (
        <>
          <p className="auth-helper-text">
            Poslat je kod na email <strong>{registerEmail}</strong>
          </p>

          <div className="form-field">
            <label>Verifikacioni kod</label>
            <input
              type="text"
              inputMode="numeric"
              value={registerOtp}
              onChange={(e) => {
                setRegisterOtp(e.target.value);
                if (formError && !otpLocked) setFormError("");
              }}
              className={
                (registerTouched.otp && !registerOtp) ||
                registerOtpServerError
                  ? "error"
                  : ""
              }
            />
            {registerOtpError && !registerOtpServerError && (
              <div className="field-error">{registerOtpError}</div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
          </div>

          <button
            className="auth-submit"
            type="button"
            onClick={() => {
              setRegisterTouched((t) => ({ ...t, otp: true }));
              onSubmit();
            }}
            disabled={loading || otpLocked}
          >
            Potvrdi kod
          </button>

          {cooldownMessage ? (
            <div className="cooldown-message">{cooldownMessage}</div>
          ) : (
            <button
              type="button"
              className="auth-link auth-link--compact"
              onClick={onResendOtp}
              disabled={loading || otpLocked}
            >
              Kliknite ovde da posaljete novi kod
            </button>
          )}

        </>
      )}
    </div>
  );
}

export default RegisterForm;
