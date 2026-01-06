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

  const [registerStep, setRegisterStep] = useState("details");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState(false);

  const resetLoginState = () => {
    setLoginStep("value");
    setLoginValue("");
    setLoginPassword("");
    setLoginTouched(false);
  };

  const resetRegisterState = () => {
    setRegisterStep("details");
    setRegisterName("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterOtp("");
    setOtpExpiresAt(null);
    setOtpAttemptsLeft(5);
    setRegisterTouched(false);
  };

  const switchMode = (nextMode) => {
    setStep("auth");
    setSuccessType("auth");
    setFormError("");
    setShowPassword(false);
    setLoading(false);
    resetLoginState();
    resetRegisterState();
    onSwitch(nextMode);
  };

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
      setShowPassword(false);
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

    setLoginTouched(false);
    setLoginStep("password");
    requestAnimationFrame(() => passwordRef.current?.focus());
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
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;

    setOtpExpiresAt(Date.now() + 10 * 60 * 1000);
    setOtpAttemptsLeft(5);
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    setRegisterTouched(true);
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
      const { data, error } = await supabase.auth.verifyOtp({
        email: registerEmail,
        token: registerOtp,
        type: "email",
      });

      if (error) throw error;

      if (data?.session || data?.user) {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData?.user) {
          setFormError("Potvrdite email.");
          return;
        }

        const { error: updateError } = await supabase.auth.updateUser({
          password: registerPassword,
          data: {
            full_name: registerName,
            password_set: true,
          },
        });

        if (updateError) throw updateError;

        await syncGuestAddressesToUser(supabase, userData.user.id);

        await supabase.from("profiles").upsert({
          id: userData.user.id,
          full_name: registerName,
        });

        setSuccessType("auth");
        setStep("success");
        setTimeout(() => onSuccess?.(), 600);
        return;
      }

      setOtpAttemptsLeft((a) => Math.max(0, a - 1));
      setFormError("Pogresan kod.");
    } catch (e) {
      console.error("VERIFY OTP ERROR:", e);
      const msg = (e?.message || "").toLowerCase();
      if (e?.status === 429 || msg.includes("too many")) {
        setFormError("Previse pokusaja. Sacekajte minut i pokusajte ponovo.");
      } else if (msg.includes("expired")) {
        setFormError("Kod je istekao. Zatrazite novi kod.");
      } else {
        setOtpAttemptsLeft((a) => Math.max(0, a - 1));
        setFormError("Pogresan kod.");
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
      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("otp already sent")) {
        setFormError("Kod je vec poslat. Sacekajte malo ili pokusajte ponovo.");
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (loading) return;
    setRegisterTouched(true);
    setFormError("");

    if (registerStep === "otp") {
      await handleVerifyOtp();
      return;
    }

    if (!registerName || !registerEmail || !registerPassword) {
      setFormError("Popunite sva polja.");
      return;
    }

    if (!isValidEmail(registerEmail)) {
      setFormError("Email adresa nije validna.");
      return;
    }

    if (registerPassword.length < 6) {
      setFormError("Lozinka mora imati najmanje 6 karaktera.");
      return;
    }

    setLoading(true);
    try {
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("check-email", {
          body: { email: registerEmail },
        });

      if (emailError) throw emailError;

      if (emailData?.exists) {
        setFormError("Vec postoji nalog sa ovom email adresom.");
        return;
      }

      await sendRegisterOtp(registerEmail);
      setRegisterStep("otp");
      setRegisterTouched(false);
      return;
    } catch (e) {
      console.error("REGISTER SUBMIT ERROR:", e);
      setFormError(getAuthErrorMessage(e));
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
      registerOtp,
      otpExpiresAt,
      otpAttemptsLeft,
      loading,
      showPassword,
      formError,
    },
    setters: {
      setLoginValue,
      setLoginPassword,
      setLoginTouched,
      setRegisterName,
      setRegisterEmail,
      setRegisterPassword,
      setRegisterOtp,
      setRegisterTouched,
      setShowPassword,
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
