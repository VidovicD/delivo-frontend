import "./AuthModal.css";

import AuthSuccess from "./AuthSuccess";
import OAuthButtons from "./OAuthButtons";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import useAuthFlow from "./useAuthFlow";
import { isValidEmail } from "./authUtils";

function AuthModal({ mode, onClose, onSwitch, onSuccess }) {
  const { refs, state, setters, handlers } = useAuthFlow({
    mode,
    onSwitch,
    onSuccess,
    onClose,
  });

  const {
    step,
    successType,

    loginMethod,
    loginStep,
    loginValue,
    loginPassword,
    loginOtp,
    loginTouched,

    registerTouched,
    registerStep,
    registerName,
    registerPhone,
    registerEmail,
    registerPassword,
    registerOtp,
    otpExpiresAt,
    otpAttemptsLeft,

    selectedCountry,

    loading,
    showPassword,
    formError,
  } = state;

  return (
    <div
      className="auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="auth-modal"
        ref={refs.modalRef}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-close"
          type="button"
          disabled={loading}
          onClick={onClose}
        >
          ✕
        </button>

        {step === "success" && (
          <AuthSuccess
            successType={successType}
            onLogin={() => {
              setters.setStep("auth");
              handlers.switchMode("login");
            }}
          />
        )}

        {step === "forgot" && (
          <ForgotPasswordForm
            email={loginValue}
            setEmail={setters.setLoginValue}
            emailRef={refs.emailRef}
            loading={loading}
            loginTouched={loginTouched}
            setLoginTouched={setters.setLoginTouched}
            formError={formError}
            setFormError={setters.setFormError}
            onSubmit={handlers.handleForgotPassword}
            onBack={() => {
              setters.setLoginTouched(false);
              setters.setStep("auth");
            }}
          />
        )}

        {step === "auth" && (
          <>
            <div className="auth-hero">
              <h2>{mode === "login" ? "Prijava" : "Registracija"}</h2>
            </div>

            <div className="auth-tabs">
              <div
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                onClick={() => handlers.switchMode("login")}
              >
                Prijava
              </div>

              <div
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                onClick={() => handlers.switchMode("register")}
              >
                Registracija
              </div>

              <div className={`auth-indicator ${mode}`} />
            </div>

            {mode === "login" && (
              <LoginForm
                loginMethod={loginMethod}
                setLoginMethod={setters.setLoginMethod}
                loginStep={loginStep}
                loginValue={loginValue}
                loginPassword={loginPassword}
                loginOtp={loginOtp}
                setLoginValue={setters.setLoginValue}
                setLoginPassword={setters.setLoginPassword}
                setLoginOtp={setters.setLoginOtp}
                loginTouched={loginTouched}
                setLoginTouched={setters.setLoginTouched}
                loading={loading}
                formError={formError}
                isValidEmail={isValidEmail}
                passwordRef={refs.passwordRef}
                onNext={handlers.handleLoginNext}
                onSubmit={handlers.handleLoginSubmit}
                onBack={handlers.handleLoginBack}
                showPassword={showPassword}
                setShowPassword={setters.setShowPassword}
                selectedCountry={selectedCountry}
                setSelectedCountry={setters.setSelectedCountry}
              />
            )}

            {mode === "register" && (
              <RegisterForm
                registerStep={registerStep}
                registerName={registerName}
                registerPhone={registerPhone}
                registerEmail={registerEmail}
                registerPassword={registerPassword}
                registerOtp={registerOtp}
                otpExpiresAt={otpExpiresAt}
                otpAttemptsLeft={otpAttemptsLeft}
                registerTouched={registerTouched}
                setRegisterTouched={setters.setRegisterTouched}
                setRegisterName={setters.setRegisterName}
                setRegisterPhone={setters.setRegisterPhone}
                setRegisterEmail={setters.setRegisterEmail}
                setRegisterPassword={setters.setRegisterPassword}
                setRegisterOtp={setters.setRegisterOtp}
                loading={loading}
                formError={formError}
                isValidEmail={isValidEmail}
                nameRef={refs.nameRef}
                phoneRef={refs.phoneRef}
                emailRef={refs.emailRef}
                onNextStep={handlers.handleRegisterNextStep}
                onSubmit={handlers.handleSubmit}
                showPassword={showPassword}
                setShowPassword={setters.setShowPassword}
                selectedCountry={selectedCountry}
                setSelectedCountry={setters.setSelectedCountry}
              />
            )}

            <div className="auth-divider">
              <span>ili</span>
            </div>

            <OAuthButtons
              onGoogle={handlers.handleGoogleLogin}
              onApple={() => {}}
              loading={loading}
            />

            {mode === "login" && (
              <div className="auth-login-actions">
                {loginStep === "value" && (
                  <button
                    type="button"
                    className="auth-forgot"
                    disabled={loading}
                    onClick={() => {
                      setters.setLoginMethod(
                        loginMethod === "phone" ? "email" : "phone"
                      );
                      setters.setLoginValue("");
                      setters.setLoginTouched(false);
                    }}
                  >
                    {loginMethod === "phone"
                      ? "Prijava putem email adrese"
                      : "Prijava putem broja telefona"}
                  </button>
                )}

                <button
                  type="button"
                  className="auth-forgot"
                  disabled={loading}
                  onClick={() => setters.setStep("forgot")}
                >
                  Zaboravili ste lozinku?
                </button>
              </div>
            )}

            {mode === "register" && (
              <button
                type="button"
                className="auth-forgot"
                onClick={() => handlers.switchMode("login")}
              >
                Imate nalog? Ulogujte se
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
