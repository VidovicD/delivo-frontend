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

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState(false);

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
    setRegisterTouched(false);
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

  useEffect(() => {
    if (step !== "auth") return;

    if (mode === "login") {
      if (loginStep === "value") emailRef.current?.focus();
      if (loginStep === "password") passwordRef.current?.focus();
    }

    if (mode === "register") {
      if (registerStep === "phone") phoneRef.current?.focus();
      if (registerStep === "details") nameRef.current?.focus();
    }
  }, [mode, step, loginStep, registerStep]);

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

    if (!loginValue) {
      setFormError("Email je obavezan.");
      return;
    }

    if (!isValidEmail(loginValue)) {
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

  const handleRegisterNextStep = async () => {
    if (loading) return;

    setRegisterTouched(true);
    setFormError("");

    if (!registerPhone) {
      setFormError("Broj telefona je obavezan.");
      return;
    }

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
      const { data, error } = await supabase.functions.invoke("check-phone", {
        body: { phone: normalizedPhone },
      });

      if (error) throw error;

      if (data?.exists) {
        setFormError("Već postoji nalog sa ovim brojem telefona. Prijavite se.");
        return;
      }

      setRegisterTouched(false);
      setRegisterStep("details");
      requestAnimationFrame(() => nameRef.current?.focus());
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (loading) return;

    setRegisterTouched(true);
    setFormError("");

    if (registerStep === "phone") {
      await handleRegisterNextStep();
      return;
    }

    if (!registerName || !registerEmail || !registerPassword) {
      setFormError("Popunite sva obavezna polja.");
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
      const data = await registerWithPassword(
        registerEmail,
        registerPassword,
        {
          full_name: registerName,
          phone: normalizedPhone,
          phone_verified: false,
        }
      );

      if (data?.user?.id) {
        await syncGuestAddressesToUser(supabase, data.user.id);

        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: registerName,
          phone: normalizedPhone,
          phone_verified: false,
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

    if (!loginValue) {
      setFormError("Email je obavezan.");
      return;
    }

    if (!isValidEmail(loginValue)) {
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

  const handleSubmit = async () => {
    if (mode === "login") {
      await handleLoginSubmit();
      return;
    }

    if (mode === "register") {
      await handleRegisterSubmit();
      return;
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
      registerTouched,

      selectedCountry,

      loading,
      showPassword,
      formError,
    },
    setters: {
      setStep,
      setSuccessType,

      setLoginMethod,
      setLoginStep,
      setLoginValue,
      setLoginPassword,
      setLoginTouched,

      setRegisterStep,
      setRegisterName,
      setRegisterPhone,
      setRegisterEmail,
      setRegisterPassword,
      setRegisterTouched,

      setSelectedCountry,

      setLoading,
      setShowPassword,
      setFormError,
    },
    handlers: {
      switchMode,
      handleLoginNext,
      handleSubmit,
      handleRegisterNextStep,
      handleForgotPassword,
      handleGoogleLogin,
    },
  };
}
