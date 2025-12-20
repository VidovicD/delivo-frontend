import { useEffect, useRef, useState } from "react";
import { isValidEmail, getAuthErrorMessage } from "./authUtils";
import {
  checkEmailExists,
  loginWithPassword,
  registerWithPassword,
  googleOAuth,
  resetPassword,
  resendVerificationEmail,
} from "./authActions";
import { supabase } from "../../supabaseClient";
import { syncGuestAddressesToUser } from "../../utils/deliveryAddress";

export default function useAuthFlow({ mode, onSwitch, onSuccess, onClose }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth");
  const [successType, setSuccessType] = useState("auth");

  const [loginStep, setLoginStep] = useState("email");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const email = mode === "login" ? loginEmail : registerEmail;

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState("");
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  const resendKey = email ? `resendUntil:${email}` : null;

  const switchMode = (nextMode) => {
    setStep("auth");
    setLoginTouched(false);
    setRegisterTouched(false);
    setFormError("");

    setLoginEmail("");
    setLoginPassword("");
    setRegisterName("");
    setRegisterPhone("");
    setRegisterEmail("");
    setRegisterPassword("");

    if (nextMode === "login") {
      setLoginStep("email");
    }

    onSwitch(nextMode);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const i = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(i);
  }, [resendCooldown]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    modalRef.current?.focus();
    setLoading(false);

    if (step !== "auth") return;

    if (mode === "register") nameRef.current?.focus();
    else emailRef.current?.focus();
  }, [mode, step]);

  useEffect(() => {
    setShowPassword(false);
  }, [mode]);

  useEffect(() => {
    if (!resendKey) return;
    const until = Number(localStorage.getItem(resendKey) || 0);
    const now = Date.now();
    if (until > now) {
      setResendCooldown(Math.ceil((until - now) / 1000));
    }
  }, [resendKey]);

  useEffect(() => {
    setResendSuccess("");
    setNeedsEmailVerification(false);
  }, [email]);

  const handleGoogleLogin = async () => {
    if (loading) return;
    await googleOAuth();
  };

  const handleLoginNext = async () => {
    setLoginTouched(true);
    setFormError("");
    setNeedsEmailVerification(false);

    if (!loginEmail) {
      setFormError("Email je obavezan.");
      return;
    }

    if (!isValidEmail(loginEmail)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    setLoading(true);

    try {
      const data = await checkEmailExists(loginEmail);
      setLoading(false);

      if (!data?.exists) {
        setFormError("Ne postoji nalog sa ovom email adresom.");
        return;
      }

      if (data.exists && !data.confirmed) {
        setNeedsEmailVerification(true);
        setFormError("Email adresa nije potvrđena. Proverite inbox.");
        return;
      }

      setLoginTouched(false);
      setLoginStep("password");
      requestAnimationFrame(() => passwordRef.current?.focus());
    } catch {
      setLoading(false);
      setFormError("Došlo je do greške. Pokušajte ponovo.");
    }
  };

  const handleSubmit = async () => {
    setFormError("");

    if (mode === "login") setLoginTouched(true);
    else setRegisterTouched(true);

    /* ---------------- LOGIN ---------------- */
    if (mode === "login") {
      if (!loginEmail) {
        setFormError("Email je obavezan.");
        return;
      }

      if (loginStep !== "password") {
        setLoginStep("password");
        requestAnimationFrame(() => passwordRef.current?.focus());
        return;
      }

      if (!loginPassword) {
        setFormError("Lozinka je obavezna.");
        return;
      }

      setLoading(true);

      try {
        await loginWithPassword(loginEmail, loginPassword);
        setLoading(false);
        setSuccessType("auth");
        setStep("success");
        setTimeout(() => onSuccess?.(), 600);
      } catch (e) {
        setLoading(false);

        if (e.message?.toLowerCase().includes("confirm")) {
          setNeedsEmailVerification(true);
          setResendSuccess("");
          setFormError(
            "Email adresa nije potvrđena. Proverite inbox i kliknite na link za potvrdu."
          );
          return;
        }

        setFormError(getAuthErrorMessage(e));
      }

      return;
    }

    /* ---------------- REGISTER ---------------- */
    if (
      !registerName ||
      !registerPhone ||
      !registerEmail ||
      !registerPassword
    ) {
      setFormError("Popunite sva obavezna polja.");
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setFormError("Unesite ispravnu email adresu.");
      return;
    }

    if (registerPassword.length < 6) {
      setFormError("Lozinka mora sadržati najmanje 6 karaktera.");
      return;
    }

    setLoading(true);

    try {
      const data = await checkEmailExists(registerEmail);

      if (data?.exists && data?.confirmed) {
        setLoading(false);
        onSwitch("login");
        requestAnimationFrame(() =>
          setFormError("Nalog sa ovom email adresom već postoji. Prijavite se.")
        );
        return;
      }

      if (data?.exists && !data?.confirmed) {
        setLoading(false);
        setNeedsEmailVerification(true);
        setResendSuccess("");
        setFormError(
          "Nalog već postoji, ali email nije potvrđen. Proverite inbox."
        );
        return;
      }

      const { data: signUpData, error } = await registerWithPassword(
        registerEmail,
        registerPassword,
        {
          full_name: registerName,
          phone: registerPhone,
        }
      );

      if (error) throw error;

      if (signUpData?.user?.id) {
        await syncGuestAddressesToUser(supabase, signUpData.user.id);
      }

      setLoading(false);
      setSuccessType("verify_or_login");
      setStep("success");
    } catch (e) {
      setLoading(false);
      setFormError(getAuthErrorMessage(e));
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      setFormError("Email je obavezan.");
      return;
    }

    setFormError("");
    setLoading(true);
    setSuccessType("forgot");
    setStep("success");

    try {
      await resetPassword(loginEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (loading || resendCooldown > 0 || !email) return;

    const until = Number(localStorage.getItem(resendKey) || 0);
    if (until > Date.now()) {
      setResendCooldown(Math.ceil((until - Date.now()) / 1000));
      return;
    }

    setLoading(true);

    try {
      await resendVerificationEmail(email);
      const next = Date.now() + 60000;
      localStorage.setItem(resendKey, next.toString());
      setResendCooldown(60);
      setFormError("");
      setResendSuccess(
        "Email za potvrdu je ponovo poslat. Proverite inbox (i spam)."
      );
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    refs: {
      modalRef,
      nameRef,
      phoneRef,
      emailRef,
      passwordRef,
    },
    state: {
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
      resendCooldown,
      resendSuccess,
      needsEmailVerification,
    },
    setters: {
      setLoginEmail,
      setLoginPassword,
      setRegisterName,
      setRegisterPhone,
      setRegisterEmail,
      setRegisterPassword,
      setLoginTouched,
      setRegisterTouched,
      setShowPassword,
      setStep,
    },
    handlers: {
      switchMode,
      handleLoginNext,
      handleSubmit,
      handleForgotPassword,
      handleResendVerification,
      handleGoogleLogin,
    },
  };
}
