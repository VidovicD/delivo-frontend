import { useEffect, useRef, useState } from "react";
import {
  isValidEmail,
  normalizePhone,
  isValidPhone,
  getAuthErrorMessage,
} from "./authUtils";
import {
  loginWithPassword,
  registerWithPassword,
  googleOAuth,
  resetPassword,
} from "./authActions";
import { supabase } from "../../supabaseClient";
import { syncGuestAddressesToUser } from "../../utils/deliveryAddress";
import { COUNTRIES } from "../../utils/countries";

export default function useAuthFlow({ mode, onSwitch, onSuccess, onClose }) {
  const modalRef = useRef(null);
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [step, setStep] = useState("auth");
  const [successType, setSuccessType] = useState("auth");

  const [loginMethod, setLoginMethod] = useState("phone");
  const [loginStep, setLoginStep] = useState("value");
  const [loginValue, setLoginValue] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerStep, setRegisterStep] = useState("phone");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);
  const [verifiedPhone, setVerifiedPhone] = useState(null);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);

  const resetLoginState = () => {
    setLoginMethod("phone");
    setLoginStep("value");
    setLoginValue("");
    setLoginPassword("");
    setLoginTouched(false);
  };

  const resetRegisterState = () => {
    setRegisterStep("phone");
    setRegisterName("");
    setRegisterPhone("");
    setRegisterEmail("");
    setRegisterPassword("");
    setRegisterOtp("");
    setVerifiedPhone(null);
    setOtpExpiresAt(null);
    setOtpAttemptsLeft(5);
    setSelectedCountry(COUNTRIES[0]);
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
      setFormError(getAuthErrorMessage(e));
      setLoading(false);
    }
  };

  const handleLoginNext = async () => {
    if (loading) return;
    setLoginTouched(true);
    setFormError("");

    if (loginMethod === "phone") {
      setFormError("Prijava preko broja telefona uskoro će biti dostupna.");
      return;
    }

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
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (phone) => {
    await supabase.functions.invoke("send-phone-otp", {
      body: { phone },
    });
    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    setOtpAttemptsLeft(5);
  };

  const handleRegisterNextStep = async () => {
    if (loading) return;
    setFormError("");

    const normalizedPhone = normalizePhone(
      registerPhone,
      selectedCountry.dialCode
    );

    if (!isValidPhone(normalizedPhone)) {
      setFormError("Unesite ispravan broj telefona.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("check-phone", {
        body: { phone: normalizedPhone },
      });

      if (data?.exists) {
        setFormError("Već postoji nalog sa ovim brojem telefona.");
        return;
      }

      await sendOtp(normalizedPhone);
      setVerifiedPhone(normalizedPhone);
      setRegisterStep("otp");
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    setFormError("");

    if (!registerOtp) {
      setFormError("Unesite kod.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("verify-phone-otp", {
        body: { phone: verifiedPhone, code: registerOtp },
      });

      if (data?.verified) {
        setRegisterStep("details");
        requestAnimationFrame(() => nameRef.current?.focus());
      }
    } catch {
      setOtpAttemptsLeft((a) => a - 1);
      setFormError("Pogrešan kod.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (loading) return;
    setFormError("");

    if (registerStep === "phone") {
      await handleRegisterNextStep();
      return;
    }

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

    setLoading(true);
    try {
      const data = await registerWithPassword(
        registerEmail,
        registerPassword,
        {
          full_name: registerName,
          phone: verifiedPhone,
          phone_verified: true,
        }
      );

      if (data?.user?.id) {
        await syncGuestAddressesToUser(supabase, data.user.id);
        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: registerName,
          phone: verifiedPhone,
          phone_verified: true,
        });
      }

      setSuccessType("auth");
      setStep("success");
    } catch (e) {
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
      loginMethod,
      loginStep,
      loginValue,
      loginPassword,
      loginTouched,
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
    },
    setters: {
      setLoginMethod,
      setLoginValue,
      setLoginPassword,
      setLoginTouched,
      setRegisterPhone,
      setRegisterName,
      setRegisterEmail,
      setRegisterPassword,
      setRegisterOtp,
      setSelectedCountry,
      setShowPassword,
      setFormError,
      setStep,
    },
    handlers: {
      switchMode,
      handleLoginNext,
      handleLoginSubmit,
      handleRegisterNextStep,
      handleVerifyOtp,
      handleSubmit: handleRegisterSubmit,
      handleForgotPassword,
      handleGoogleLogin,
    },
  };
}
