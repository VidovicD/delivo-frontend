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
  resendNotice,
  isValidEmail,
  nameRef,
  emailRef,
  onSubmit,
  otpExpiresAt,
  otpAttemptsLeft,
  otpLocked,
  otpLockoutUntil,
  onResendOtp,
}) {
  const [, setUpdateTrigger] = React.useState(0);
  
  React.useEffect(() => {
    if (!otpLocked || !otpLockoutUntil) return;
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpLocked, otpLockoutUntil]);
  const registerEmailError = registerTouched.email
    ? !registerEmail
      ? "Unesite email adresu."
      : !isValidEmail(registerEmail)
        ? "Email adresa nije u ispravnom formatu."
        : ""
    : "";
  const registerOtpFieldErrors = [
    "Pogrešan kod.",
    "Kod je istekao. Zatražite novi kod.",
  ];
  const registerOtpFormErrors = [
    "Email adresa nije u ispravnom formatu.",
    "Došlo je do greške. Molimo vas da pokušate ponovo.",
  ];
  const isLockoutMessage = formError && formError.includes("Previše pokušaja") && formError.includes("Sačekajte");
  // Lockout je FORM ERROR, ne field error - zato !isLockoutMessage
  const registerOtpServerError = registerOtpFieldErrors.includes(formError) && !isLockoutMessage;
  
  // OTP field error sa prioritetom (server > client)
  const otpFieldError = registerOtpServerError
    ? formError
    : registerTouched.otp && !registerOtp
      ? "Unesite verifikacioni kod."
      : "";
  const registerEmailServerError =
    formError === "Nalog sa tim emailom vec postoji. Molimo vas, ulogujte se." ||
    formError === "Email adresa nije validna."; // backend šalje ove poruke
  
  const emailError = registerEmailServerError
    ? formError === "Email adresa nije validna."
      ? !registerEmail
        ? "Unesite email adresu."
        : "Email adresa nije u ispravnom formatu."
      : "Nalog sa ovom email adresom već postoji."
    : registerTouched.email
      ? !registerEmail
        ? "Unesite email adresu."
        : !isValidEmail(registerEmail)
          ? "Email adresa nije u ispravnom formatu."
          : ""
      : "";
  
  const hasEmailError = !!emailError;
  
  // Funkcija za formatiranje vremena čekanja
  const formatLockoutTime = () => {
    if (!otpLockoutUntil) return "";
    const remaining = otpLockoutUntil - Date.now();
    if (remaining <= 0) return "";
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${seconds} s`;
    }
    return `${seconds} s`;
  };
  
  const showRegisterEmailRequired =
    !registerEmailServerError && emailError;
  const registerNameError =
    registerTouched.name && !registerName ? "Ime je obavezno." : "";
  const registerPasswordError = registerTouched.password
    ? !registerPassword
      ? "Lozinka je obavezna."
      : registerPassword.length < 6
        ? "Lozinka mora sadržati najmanje 6 karaktera."
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
    "Unesite verifikacioni kod.",
    "Pogrešan kod.",
    "Kod je istekao. Zatražite novi kod.",
    "Previše neuspešnih pokušaja. Pokušajte ponovo za 5 minuta.",
    "Ime je obavezno.",
    "Lozinka je obavezna.",
    "Lozinka mora sadržati najmanje 6 karaktera.",
    "Potvrda lozinke je obavezna.",
    "Lozinke se ne poklapaju.",
    "Popunite sva polja.",
  ];
  
  // Ne prikazuj greške koje se odnose na kod kada je korisnik na email ekranu
  const isCodeRelatedError = formError && (
    formError.includes("Verifikacioni kod je već poslat") ||
    formError.includes("Verifikacioni kod je uspešno poslat") ||
    formError.includes("Verifikacioni kod je istekao") ||
    formError.includes("Previše neuspešnih pokušaja") ||
    formError.includes("Pokušajte ponovo za")
  );
  
  const showFormError =
    formError && 
    !registerValidationMessages.includes(formError) &&
    !(registerStep === "email" && isCodeRelatedError) &&
    !registerOtpFieldErrors.includes(formError) &&
    !registerOtpFormErrors.includes(formError);

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
                if (formError) setFormError("");
                // Resetuj touched da se client validacija obriše
                if (registerTouched.email) setRegisterTouched((t) => ({ ...t, email: false }));
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
            <div className="otp-inputs">
              {[0,1,2,3,4,5].map((index) => (
                <div key={`otp-group-${index}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    autoFocus={index === 0}
                    autoComplete="off"
                    value={registerOtp[index] || ""}
                    onChange={(e) => {
                      const newOtp = registerOtp.split("");
                      newOtp[index] = e.target.value.replace(/\D/g, "");
                      setRegisterOtp(newOtp.join(""));
                      if (newOtp[index] && index < 5) document.getElementById(`otp-${index+1}`).focus();
                      if (formError && !otpLocked) setFormError("");
                      // Resetuj touched da se client validacija obriše
                      if (registerTouched.otp) setRegisterTouched((t) => ({ ...t, otp: false }));
                      if (newOtp.join("").length === 6) onSubmit();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !registerOtp[index] && index > 0) {
                        document.getElementById(`otp-${index-1}`).focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                      setRegisterOtp(paste);
                      if (paste.length === 6) onSubmit();
                    }}
                    id={`otp-${index}`}
                    className=""
                    aria-label={`Kod polje ${index + 1} od 6`}
                  />
                  {index < 5 && <span className="otp-separator">-</span>}
                </div>
              ))}
            </div>
            {otpFieldError && (
              <div className="field-error">{otpFieldError}</div>
            )}
            {showFormError && (
              <div className="field-error">{formError}</div>
            )}
            {otpLocked && (
              <div className="field-error">
                {formError && formError.includes("Previše pokušaja") 
                  ? formError 
                  : `Previše neuspešnih pokušaja. Pokušajte ponovo za ${formatLockoutTime()}.`}
              </div>
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

          {resendNotice ? (
            <div className="resend-notice">{resendNotice}</div>
          ) : (
            <button
              type="button"
              className={`auth-link auth-link--compact ${cooldownMessage ? 'auth-link--warning' : ''}`}
              onClick={onResendOtp}
              disabled={loading || otpLocked || !!cooldownMessage}
            >
              {cooldownMessage || "Kliknite ovde da pošaljete novi kod"}
            </button>
          )}

        </>
      )}
    </div>
  );
}

export default RegisterForm;
