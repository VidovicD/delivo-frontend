import React, { useState } from "react";
import { COUNTRIES } from "../../utils/countries";
import { formatPhoneNumber, isValidPhoneNumber } from "../../utils/phoneUtils";

function RegisterForm({
  registerStep,
  registerName,
  registerEmail,
  registerPhoneCountry,
  registerPhone,
  registerPassword,
  registerPasswordConfirm,
  registerOtp,
  setRegisterName,
  setRegisterEmail,
  setRegisterPhoneCountry,
  setRegisterPhone,
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
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const [editedAfterSubmit, setEditedAfterSubmit] = React.useState({
    name: false,
    phone: false,
    password: false,
    passwordConfirm: false,
  });
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  
  React.useEffect(() => {
    if (!otpLocked || !otpLockoutUntil) return;
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpLocked, otpLockoutUntil]);

  React.useEffect(() => {
    if (registerStep !== "details") {
      setHasAttemptedSubmit(false);
      setEditedAfterSubmit({
        name: false,
        phone: false,
        password: false,
        passwordConfirm: false,
      });
    }
  }, [registerStep]);

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
  
  const registerNameError =
    hasAttemptedSubmit && !editedAfterSubmit.name && !registerName ? "Ime je obavezno." : "";
  const registerPasswordError = (hasAttemptedSubmit && !editedAfterSubmit.password && !registerPassword)
    ? "Lozinka je obavezna."
    : (hasAttemptedSubmit && !editedAfterSubmit.password && registerPassword && registerPassword.length < 8)
      ? "Lozinka mora sadržati najmanje 8 karaktera."
      : (hasAttemptedSubmit && !editedAfterSubmit.password && registerPassword && !/[a-zA-Z]/.test(registerPassword))
        ? "Lozinka mora sadržati bar jedno slovo."
        : (hasAttemptedSubmit && !editedAfterSubmit.password && registerPassword && !/[0-9]/.test(registerPassword))
          ? "Lozinka mora sadržati bar jedan broj."
          : "";
  const registerPasswordConfirmError = (hasAttemptedSubmit && !editedAfterSubmit.passwordConfirm && !registerPasswordConfirm)
    ? "Potvrda lozinke je obavezna."
    : (hasAttemptedSubmit && !editedAfterSubmit.passwordConfirm && registerPassword !== registerPasswordConfirm)
      ? "Lozinke se ne poklapaju."
      : "";
  const registerValidationMessages = [
    "Unesite email adresu.",
    "Email adresa nije validna.",
    "Unesite verifikacioni kod.",
    "Pogrešan kod.",
    "Kod je istekao. Zatražite novi kod.",
    "Previše neuspešnih pokušaja. Pokušajte ponovo za 5 minuta.",
    "Ime je obavezno.",
    "Broj telefona je obavezan.",
    "Broj telefona nije validan.",
    "Lozinka je obavezna.",
    "Lozinka mora sadržati najmanje 8 karaktera.",
    "Lozinka mora sadržati bar jedno slovo.",
    "Lozinka mora sadržati bar jedan broj.",
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
    !registerOtpFormErrors.includes(formError) &&
    !isLockoutMessage;

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
                if (formError) setFormError("");
                if (hasAttemptedSubmit) setEditedAfterSubmit(s => ({ ...s, name: true }));
              }}
              className={
                registerNameError ? "error" : ""
              }
            />
            {registerNameError && (
              <div className="field-error">{registerNameError}</div>
            )}
          </div>

          <div className="form-field">
            <label>Broj telefona</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className={`phone-country-wrapper ${countryDropdownOpen ? 'open' : ''}`} style={{ flexGrow: 0, flexShrink: 0, flexBasis: '90px' }}>
                <select
                  className="phone-country-input"
                  value={registerPhoneCountry}
                  onMouseDown={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  onBlur={() => {
                    setTimeout(() => setCountryDropdownOpen(false), 100);
                  }}
                  onChange={(e) => {
                    setRegisterPhoneCountry(e.target.value);
                    setRegisterPhone('');
                    setCountryDropdownOpen(false);
                    if (formError) setFormError("");
                    if (hasAttemptedSubmit) setEditedAfterSubmit(s => ({ ...s, phone: false }));
                  }}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      +{country.dialCode}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="tel"
                style={{ flex: 1 }}
                value={registerPhone}
                onChange={(e) => {
                  const input = e.target.value;
                  // Formatira broj telefona automatski
                  const formatted = formatPhoneNumber(input, registerPhoneCountry);
                  setRegisterPhone(formatted);
                  if (formError) setFormError("");
                  if (hasAttemptedSubmit) setEditedAfterSubmit(s => ({ ...s, phone: true }));
                }}
                className={
                  (hasAttemptedSubmit && !editedAfterSubmit.phone && (!registerPhone || !isValidPhoneNumber(registerPhone, registerPhoneCountry))) ? "error" : ""
                }
              />
            </div>
            {hasAttemptedSubmit && !editedAfterSubmit.phone && !registerPhone && (
              <div className="field-error">Broj telefona je obavezan.</div>
            )}
            {hasAttemptedSubmit && !editedAfterSubmit.phone && registerPhone && !isValidPhoneNumber(registerPhone, registerPhoneCountry) && (
              <div className="field-error">Broj telefona nije validan.</div>
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
                if (formError) setFormError("");
                if (hasAttemptedSubmit) setEditedAfterSubmit(s => ({ ...s, password: true }));
              }}
              className={
                registerPasswordError ? "error" : ""
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
                if (formError) setFormError("");
                if (hasAttemptedSubmit) setEditedAfterSubmit(s => ({ ...s, passwordConfirm: true }));
              }}
              className={
                registerPasswordConfirmError ? "error" : ""
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
              setHasAttemptedSubmit(true);
              setEditedAfterSubmit({
                name: false,
                phone: false,
                password: false,
                passwordConfirm: false,
              });
              setRegisterTouched((t) => ({
                ...t,
                name: true,
                phone: true,
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
            Verifikacioni kod je poslat na email adresu <strong>{registerEmail}</strong>
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
                      const input = e.target.value.replace(/\D/g, "");
                      if (input.length > 1) return; // Spreči višestruko kucanje
                      const newOtp = registerOtp.split("");
                      newOtp[index] = input;
                      setRegisterOtp(newOtp.join(""));
                      if (input && index < 5) document.getElementById(`otp-${index+1}`).focus();
                      if (formError && !otpLocked) setFormError("");
                      // Resetuj touched da se client validacija obriše
                      if (registerTouched.otp) setRegisterTouched((t) => ({ ...t, otp: false }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace") {
                        e.preventDefault();
                        if (registerOtp[index]) {
                          // Ako polje ima broj, obriši ga
                          const newOtp = registerOtp.split("");
                          newOtp[index] = "";
                          setRegisterOtp(newOtp.join(""));
                        } else if (index > 0) {
                          // Ako je polje prazno, idi na prethodno i obriši njegov broj
                          const newOtp = registerOtp.split("");
                          newOtp[index - 1] = "";
                          setRegisterOtp(newOtp.join(""));
                          document.getElementById(`otp-${index-1}`).focus();
                        }
                      } else if (e.key === "ArrowLeft" && index > 0) {
                        e.preventDefault();
                        document.getElementById(`otp-${index-1}`).focus();
                      } else if (e.key === "ArrowRight" && index < 5) {
                        e.preventDefault();
                        document.getElementById(`otp-${index+1}`).focus();
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
                {`Previše neuspešnih pokušaja. Pokušajte ponovo za ${formatLockoutTime()}.`}
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
