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
    loginStep,
    loginEmail,
    loginPassword,
    registerName,
    registerPhone,
    registerEmail,
    registerPassword,
    loginTouched,
    registerTouched,
    loading,
    showPassword,
    formError,
  } = state;

  return (
    <div
      className="auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
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
              onSwitch("login");
            }}
          />
        )}

        {step === "forgot" && (
          <ForgotPasswordForm
            email={loginEmail}
            setEmail={setters.setLoginEmail}
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
              <h2>
                {mode === "login" ? "Prijava" : "Registracija"}
              </h2>
            </div>

            <div className="auth-tabs">
              <div
                className={`auth-tab ${
                  mode === "login" ? "active" : ""
                }`}
                onClick={() => handlers.switchMode("login")}
              >
                Prijava
              </div>

              <div
                className={`auth-tab ${
                  mode === "register" ? "active" : ""
                }`}
                onClick={() => handlers.switchMode("register")}
              >
                Registracija
              </div>

              <div className={`auth-indicator ${mode}`} />
            </div>

            {mode === "login" && (
              <LoginForm
                loginStep={loginStep}
                loginEmail={loginEmail}
                loginPassword={loginPassword}
                setLoginEmail={setters.setLoginEmail}
                setLoginPassword={setters.setLoginPassword}
                loginTouched={loginTouched}
                setLoginTouched={setters.setLoginTouched}
                loading={loading}
                formError={formError}
                isValidEmail={isValidEmail}
                passwordRef={refs.passwordRef}
                onNext={handlers.handleLoginNext}
                onSubmit={handlers.handleSubmit}
                onBack={() => {
                  setters.setLoginPassword("");
                  setters.setStep("auth");
                }}
                showPassword={showPassword}
                setShowPassword={setters.setShowPassword}
              />
            )}

            {mode === "register" && (
              <RegisterForm
                registerName={registerName}
                registerPhone={registerPhone}
                registerEmail={registerEmail}
                registerPassword={registerPassword}
                setRegisterName={setters.setRegisterName}
                setRegisterPhone={setters.setRegisterPhone}
                setRegisterEmail={setters.setRegisterEmail}
                setRegisterPassword={setters.setRegisterPassword}
                registerTouched={registerTouched}
                setRegisterTouched={setters.setRegisterTouched}
                loading={loading}
                formError={formError}
                isValidEmail={isValidEmail}
                nameRef={refs.nameRef}
                phoneRef={refs.phoneRef}
                emailRef={refs.emailRef}
                onSubmit={handlers.handleSubmit}
                showPassword={showPassword}
                setShowPassword={setters.setShowPassword}
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
              <button
                type="button"
                className="auth-forgot"
                onClick={() => setters.setStep("forgot")}
                disabled={loading}
              >
                Zaboravili ste lozinku?
              </button>
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
