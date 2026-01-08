import { useEffect, useRef, useState } from "react";
import { isValidEmail, getAuthErrorMessage } from "./authUtils";
import { loginWithPassword, googleOAuth, resetPassword } from "./authActions";
import { supabase } from "../../supabaseClient";
import { syncGuestAddressesToUser } from "../../utils/deliveryAddress";

export default function useAuthFlow({ mode, onSwitch, onSuccess, onClose }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth");
  const [successType, setSuccessType] = useState("auth");

  const [loginStep, setLoginStep] = useState("value");
  const [loginValue, setLoginValue] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerStep, setRegisterStep] = useState("email");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [registerVerifyToken, setRegisterVerifyToken] = useState("");
  const [otpLockoutUntil, setOtpLockoutUntil] = useState(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState({
    email: false,
    name: false,
    password: false,
    passwordConfirm: false,
    otp: false,
  });

  const resetLoginState = () => {
    setLoginStep("value");
    setLoginValue("");
    setLoginPassword("");
    setLoginTouched(false);
  };

  const resetRegisterState = () => {
    setRegisterStep("email");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterPasswordConfirm("");
    setRegisterOtp("");
    setRegisterVerifyToken("");
    setOtpLockoutUntil(null);
    setOtpExpiresAt(null);
    setOtpAttemptsLeft(5);
    setRegisterTouched({
      email: false,
      name: false,
      password: false,
      passwordConfirm: false,
      otp: false,
    });
  };

  const switchMode = (nextMode) => {
    setStep("auth");
    setSuccessType("auth");
    setFormError("");
    setLoading(false);
    resetLoginState();
    resetRegisterState();
    onSwitch(nextMode);
  };

  const formatWaitTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(0, seconds % 60);
    if (mins <= 0) return `${secs} s`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} s`;
  };

  useEffect(() => {
    if (!otpLockoutUntil) return;
    const remaining = otpLockoutUntil - Date.now();
    if (remaining <= 0) {
      setOtpLockoutUntil(null);
      if (
        formError ===
        "Previse pokusaja. Sacekajte 5 minuta pa pokusajte ponovo."
      ) {
        setFormError("");
      }
      return;
    }
    const timer = setTimeout(() => {
      setOtpLockoutUntil(null);
      if (
        formError ===
        "Previse pokusaja. Sacekajte 5 minuta pa pokusajte ponovo."
      ) {
        setFormError("");
      }
    }, remaining);
    return () => clearTimeout(timer);
  }, [otpLockoutUntil, formError]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleGoogleLogin = async () => {
    if (loading) return;
    try {
      setFormError("");
      setLoading(true);
      await googleOAuth();
    } catch (e) {
      console.error("GOOGLE LOGIN ERROR:", e);
      setFormError(getAuthErrorMessage(e));
      setLoading(false);
    }
  };

  const handleLoginBack = () => {
    if (loading) return;
    if (loginStep === "password") {
      setLoginPassword("");
      setLoginTouched(false);
      setFormError("");
      setLoginStep("value");
      return;
    }
    setLoginTouched(false);
    setFormError("");
    setLoginStep("value");
  };

  const handleLoginNext = async () => {
    if (loading) return;
    setLoginTouched(true);
    setFormError("");

    if (!loginValue || !isValidEmail(loginValue)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    setLoading(true);
    try {
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("check-email", {
          body: { email: loginValue },
        });

      if (emailError) throw emailError;

      const emailExists =
        emailData?.exists === true ||
        emailData?.exists === 1 ||
        emailData?.exists === "true";

      if (!emailExists) {
        setFormError("Nalog ne postoji. Registrujte se.");
        return;
      }

      setLoginTouched(false);
      setLoginStep("password");
      requestAnimationFrame(() => passwordRef.current?.focus());
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (loading) return;
    setLoginTouched(true);
    setFormError("");

    if (!loginPassword) {
      setFormError("Lozinka je obavezna.");
      return;
    }

    setLoading(true);
    try {
      await loginWithPassword(loginValue, loginPassword);
      setSuccessType("auth");
      setStep("success");
      setTimeout(() => onSuccess?.(), 600);
    } catch (e) {
      console.error("LOGIN EMAIL ERROR:", e);
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const sendRegisterOtp = async (email) => {
    const { data, error } = await supabase.functions.invoke(
      "register-send-code",
      { body: { email } }
    );

    if (error) throw error;
    if (!data?.ok) {
      const err = new Error(data?.error || "Doslo je do greske.");
      if (data?.lockoutSeconds) {
        err.lockoutSeconds = data.lockoutSeconds;
      }
      if (data?.waitSeconds) {
        err.waitSeconds = data.waitSeconds;
      }
      throw err;
    }

    setRegisterVerifyToken("");
    setOtpLockoutUntil(null);
    setOtpExpiresAt(Date.now() + (data.expiresIn || 600) * 1000);
    setOtpAttemptsLeft(5);
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    setRegisterTouched((t) => ({ ...t, otp: true }));
    setFormError("");

    if (!registerOtp) {
      setFormError("Unesite kod.");
      return;
    }

    if (otpExpiresAt && Date.now() > otpExpiresAt) {
      setFormError("Kod je istekao. Zatrazite novi kod.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "register-verify-code",
        { body: { email: registerEmail, code: registerOtp } }
      );

      if (error) throw error;
      if (!data?.ok) {
        if (typeof data?.attemptsLeft === "number") {
          setOtpAttemptsLeft(data.attemptsLeft);
        }
        if (data?.lockoutSeconds) {
          setOtpLockoutUntil(Date.now() + data.lockoutSeconds * 1000);
        }
        setFormError(data?.error || "Pogresan kod.");
        return;
      }

      setRegisterVerifyToken(data.verifyToken || "");
      setOtpLockoutUntil(null);
      setRegisterStep("details");
      setRegisterTouched({
        email: false,
        name: false,
        password: false,
        passwordConfirm: false,
        otp: false,
      });
      requestAnimationFrame(() => nameRef.current?.focus());
    } catch (e) {
      console.error("VERIFY OTP ERROR:", e);
      const msg = e?.message;
      if (e?.lockoutSeconds) {
        setOtpLockoutUntil(Date.now() + e.lockoutSeconds * 1000);
      }
      if (msg && !msg.includes("Edge Function")) {
        setFormError(msg);
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterResendOtp = async () => {
    if (loading) return;
    setFormError("");

    if (!isValidEmail(registerEmail)) {
      setFormError("Email adresa nije validna.");
      return;
    }

    setLoading(true);
    try {
      await sendRegisterOtp(registerEmail);
      setOtpAttemptsLeft(5);
    } catch (e) {
      const msg = e?.message;
      if (e?.lockoutSeconds) {
        setOtpLockoutUntil(Date.now() + e.lockoutSeconds * 1000);
      }
      if (e?.waitSeconds && msg === "Kod je vec poslat.") {
        setFormError(
          `Kod je vec poslat. Mozete ponovo za ${formatWaitTime(
            e.waitSeconds
          )}.`
        );
        return;
      }
      if (msg && !msg.includes("Edge Function")) {
        setFormError(msg);
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (loading) return;
    if (registerStep === "email") {
      setRegisterTouched((t) => ({ ...t, email: true }));
    }
    if (registerStep === "details") {
      setRegisterTouched((t) => ({
        ...t,
        name: true,
        password: true,
        passwordConfirm: true,
      }));
    }
    if (registerStep === "otp") {
      setRegisterTouched((t) => ({ ...t, otp: true }));
    }
    setFormError("");

    if (registerStep === "otp") {
      await handleVerifyOtp();
      return;
    }

    setLoading(true);
    try {
      if (registerStep === "email") {
        if (!registerEmail) {
          setFormError("Unesite email adresu.");
          return;
        }

        if (!isValidEmail(registerEmail)) {
          setFormError("Email adresa nije validna.");
          return;
        }

        try {
          await sendRegisterOtp(registerEmail);
        } catch (e) {
          if (
            e?.waitSeconds &&
            e?.message === "Kod je vec poslat."
          ) {
            setRegisterStep("otp");
            setRegisterTouched({
              email: false,
              name: false,
              password: false,
              passwordConfirm: false,
              otp: false,
            });
            setFormError("");
            return;
          }
          throw e;
        }
        setRegisterStep("otp");
        setRegisterTouched({
          email: false,
          name: false,
          password: false,
          passwordConfirm: false,
          otp: false,
        });
        return;
      }

      if (
        !registerName ||
        !registerPassword ||
        !registerPasswordConfirm
      ) {
        setFormError("Popunite sva polja.");
        return;
      }

      if (registerPassword.length < 6) {
        setFormError("Lozinka mora imati najmanje 6 karaktera.");
        return;
      }

      if (registerPassword !== registerPasswordConfirm) {
        setFormError("Lozinke se ne poklapaju.");
        return;
      }

      if (!registerVerifyToken) {
        setFormError("Potvrdite kod.");
        return;
      }

      const { data: completeData, error: completeError } =
        await supabase.functions.invoke("register-complete", {
          body: {
            email: registerEmail,
            verifyToken: registerVerifyToken,
            name: registerName,
            password: registerPassword,
          },
        });

      if (completeError) throw completeError;
      if (!completeData?.ok) {
        setFormError(completeData?.error || "Doslo je do greske.");
        return;
      }

      await loginWithPassword(registerEmail, registerPassword);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        await syncGuestAddressesToUser(supabase, userData.user.id);
      }

      setSuccessType("auth");
      setStep("success");
      setTimeout(() => onSuccess?.(), 600);
    } catch (e) {
      console.error("REGISTER SUBMIT ERROR:", e);
      const msg = e?.message;
      if (e?.lockoutSeconds) {
        setOtpLockoutUntil(Date.now() + e.lockoutSeconds * 1000);
      }
      if (e?.waitSeconds && msg === "Kod je vec poslat.") {
        setFormError(
          `Kod je vec poslat. Mozete ponovo za ${formatWaitTime(
            e.waitSeconds
          )}.`
        );
        return;
      }
      if (msg && !msg.includes("Edge Function")) {
        setFormError(msg);
        return;
      }
      const lowerMsg = (e?.message || "").toLowerCase();
      if (
        e?.status === 429 ||
        lowerMsg.includes("security purposes") ||
        lowerMsg.includes("too many")
      ) {
        setFormError("Previse zahteva. Sacekajte minut pa pokusajte ponovo.");
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading) return;
    setFormError("");

    if (!loginValue || !isValidEmail(loginValue)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(loginValue);
      setSuccessType("forgot");
      setStep("success");
    } catch (e) {
      console.error("FORGOT PASSWORD ERROR:", e);
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    refs: {
      modalRef,
      nameRef,
      emailRef,
      passwordRef,
    },
    state: {
      step,
      successType,
      loginStep,
      loginValue,
      loginPassword,
      loginTouched,
      registerTouched,
      registerStep,
      registerName,
      registerEmail,
      registerPassword,
      registerPasswordConfirm,
      registerOtp,
      otpExpiresAt,
      otpAttemptsLeft,
      otpLocked: Boolean(otpLockoutUntil && Date.now() < otpLockoutUntil),
      loading,
      formError,
    },
    setters: {
      setLoginValue,
      setLoginPassword,
      setLoginTouched,
      setRegisterName,
      setRegisterEmail,
      setRegisterPassword,
      setRegisterPasswordConfirm,
      setRegisterOtp,
      setRegisterTouched,
      setFormError,
      setStep,
    },
    handlers: {
      switchMode,
      handleLoginNext,
      handleLoginSubmit,
      handleLoginBack,
      handleRegisterResendOtp,
      handleSubmit: handleRegisterSubmit,
      handleForgotPassword,
      handleGoogleLogin,
    },
  };
}
