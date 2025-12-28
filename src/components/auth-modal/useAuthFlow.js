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
  const [loginOtp, setLoginOtp] = useState("");
  const [loginOtpExpiresAt, setLoginOtpExpiresAt] = useState(null);
  const [loginOtpAttemptsLeft, setLoginOtpAttemptsLeft] = useState(5);
  const [loginVerifiedPhone, setLoginVerifiedPhone] = useState(null);

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
  const [registerTouched, setRegisterTouched] = useState(false);

  const getDeviceId = () => {
    const key = "delivo_device_id";
    let id = localStorage.getItem(key);
    if (!id) {
      if (crypto?.randomUUID) id = crypto.randomUUID();
      else id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(key, id);
    }
    return id;
  };

  const getTrustToken = () => {
    return localStorage.getItem("delivo_trust_token") || "";
  };

  const setTrustToken = (token) => {
    if (!token) return;
    localStorage.setItem("delivo_trust_token", token);
  };

  const resetLoginState = () => {
    setLoginMethod("phone");
    setLoginStep("value");
    setLoginValue("");
    setLoginPassword("");
    setLoginOtp("");
    setLoginOtpExpiresAt(null);
    setLoginOtpAttemptsLeft(5);
    setLoginVerifiedPhone(null);
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

    if (loginStep === "otp") {
      setLoginOtp("");
      setLoginOtpExpiresAt(null);
      setLoginOtpAttemptsLeft(5);
      setLoginVerifiedPhone(null);
      setLoginTouched(false);
      setFormError("");
      setLoginStep("value");
      return;
    }

    setLoginTouched(false);
    setFormError("");
    setLoginStep("value");
  };

  const tryTrustedLogin = async (phone) => {
    const deviceId = getDeviceId();
    const trustToken = getTrustToken();

    if (!deviceId || !trustToken) return null;

    const { data, error } = await supabase.functions.invoke("login-with-phone", {
      body: {
        phone,
        device_id: deviceId,
        trust_token: trustToken,
      },
    });

    if (error) return null;

    if (data?.action_link) return data.action_link;

    return null;
  };

  const handleLoginNext = async () => {
    if (loading) return;
    setLoginTouched(true);
    setFormError("");

    if (loginMethod === "email") {
      if (!loginValue || !isValidEmail(loginValue)) {
        setFormError("Unesite ispravnu email adresu.");
        return;
      }

      setLoginTouched(false);
      setLoginStep("password");
      requestAnimationFrame(() => passwordRef.current?.focus());
      return;
    }

    const normalizedPhone = normalizePhone(
      loginValue,
      selectedCountry.dialCode
    );

    if (!isValidPhone(normalizedPhone)) {
      setFormError("Unesite ispravan broj telefona.");
      return;
    }

    setLoading(true);
    try {
      const trustedLink = await tryTrustedLogin(normalizedPhone);
      if (trustedLink) {
        window.location.assign(trustedLink);
        return;
      }

      const { data: existsData, error: existsError } =
        await supabase.functions.invoke("check-phone", {
          body: { phone: normalizedPhone },
        });

      if (existsError) throw existsError;

      if (!existsData?.exists) {
        setFormError("Ne postoji nalog sa ovim brojem telefona.");
        return;
      }

      const { error: sendError } = await supabase.functions.invoke(
        "send-phone-otp",
        {
          body: { phone: normalizedPhone },
        }
      );

      if (sendError) throw sendError;

      setLoginVerifiedPhone(normalizedPhone);
      setLoginOtp("");
      setLoginOtpExpiresAt(Date.now() + 5 * 60 * 1000);
      setLoginOtpAttemptsLeft(5);
      setLoginTouched(false);
      setLoginStep("otp");
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (
        e?.status === 429 ||
        msg.includes("otp already sent") ||
        msg.includes("too many")
      ) {
        setFormError(
          "Kod je već poslat. Sačekajte malo ili pokušajte ponovo kasnije."
        );
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (loading) return;
    setLoginTouched(true);
    setFormError("");

    if (loginMethod === "email") {
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
      return;
    }

    if (!loginVerifiedPhone) {
      setFormError("Unesite broj telefona ponovo.");
      setLoginStep("value");
      return;
    }

    if (!loginOtp) {
      setFormError("Unesite kod.");
      return;
    }

    if (loginOtpExpiresAt && Date.now() > loginOtpExpiresAt) {
      setFormError("Kod je istekao. Zatražite novi kod.");
      return;
    }

    setLoading(true);
    try {
      const { data: verifyData, error: verifyError } =
        await supabase.functions.invoke("verify-phone-otp", {
          body: { phone: loginVerifiedPhone, code: loginOtp },
        });

      if (verifyError) throw verifyError;

      if (!verifyData?.verified) {
        setLoginOtpAttemptsLeft((a) => Math.max(0, a - 1));
        setFormError("Pogrešan kod.");
        return;
      }

      const deviceId = getDeviceId();

      const { data: loginData, error: loginError } =
        await supabase.functions.invoke("login-with-phone", {
          body: {
            phone: loginVerifiedPhone,
            device_id: deviceId,
            trust_token: getTrustToken(),
            issue_trust: true,
          },
        });

      if (loginError) throw loginError;

      if (loginData?.trust_token) {
        setTrustToken(loginData.trust_token);
      }

      if (!loginData?.action_link) {
        setFormError("Došlo je do greške. Pokušajte ponovo.");
        return;
      }

      window.location.assign(loginData.action_link);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();

      if (e?.status === 429 || msg.includes("too many")) {
        setFormError("Previše pokušaja. Sačekajte minut i pokušajte ponovo.");
      } else if (msg.includes("expired")) {
        setFormError("Kod je istekao. Zatražite novi kod.");
      } else if (e?.status === 401) {
        // ✅ FIX: 401 iz login-with-phone NIJE "pogrešan kod"
        setFormError(
          "Prijava nije uspela. Pokušajte ponovo ili zatražite novi kod."
        );
      } else if (
        // ✅ "Pogrešan kod" samo ako se stvarno radi o OTP grešci
        msg.includes("invalid code") ||
        msg.includes("invalid otp") ||
        msg.includes("otp") ||
        msg.includes("code")
      ) {
        setLoginOtpAttemptsLeft((a) => Math.max(0, a - 1));
        setFormError("Pogrešan kod.");
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (phone) => {
    const { error } = await supabase.functions.invoke("send-phone-otp", {
      body: { phone },
    });
    if (error) throw error;

    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    setOtpAttemptsLeft(5);
  };

  const handleRegisterNextStep = async () => {
    if (loading) return;
    setRegisterTouched(true);
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
      const { data, error } = await supabase.functions.invoke("check-phone", {
        body: { phone: normalizedPhone },
      });

      if (error) throw error;

      if (data?.exists) {
        setFormError("Već postoji nalog sa ovim brojem telefona.");
        return;
      }

      await sendOtp(normalizedPhone);
      setVerifiedPhone(normalizedPhone);
      setRegisterStep("otp");
      setRegisterTouched(false);
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (
        e?.status === 429 ||
        msg.includes("otp already sent") ||
        msg.includes("too many")
      ) {
        setFormError(
          "Kod je već poslat. Sačekajte malo ili pokušajte ponovo kasnije."
        );
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
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
      setFormError("Kod je istekao. Zatražite novi kod.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-phone-otp",
        {
          body: { phone: verifiedPhone, code: registerOtp },
        }
      );

      if (error) throw error;

      if (data?.verified) {
        setRegisterStep("details");
        setRegisterTouched(false);
        requestAnimationFrame(() => nameRef.current?.focus());
        return;
      }

      setOtpAttemptsLeft((a) => Math.max(0, a - 1));
      setFormError("Pogrešan kod.");
    } catch (e) {
      const msg = (e?.message || "").toLowerCase();
      if (e?.status === 429 || msg.includes("too many")) {
        setFormError("Previše pokušaja. Sačekajte minut i pokušajte ponovo.");
      } else if (msg.includes("expired")) {
        setFormError("Kod je istekao. Zatražite novi kod.");
      } else {
        setOtpAttemptsLeft((a) => Math.max(0, a - 1));
        setFormError("Pogrešan kod.");
      }
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
      const data = await registerWithPassword(registerEmail, registerPassword, {
        full_name: registerName,
        phone: verifiedPhone,
        phone_verified: true,
      });

      if (data?.user?.id) {
        await syncGuestAddressesToUser(supabase, data.user.id);

        await supabase.from("profiles").insert({
          id: data.user.id,
          full_name: registerName,
          phone: verifiedPhone,
          phone_verified: true,
        });
      }

      setSuccessType("verify_or_login");
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
      loginOtp,
      loginOtpExpiresAt,
      loginOtpAttemptsLeft,
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
    },
    setters: {
      setLoginMethod,
      setLoginValue,
      setLoginPassword,
      setLoginOtp,
      setLoginTouched,
      setRegisterPhone,
      setRegisterName,
      setRegisterEmail,
      setRegisterPassword,
      setRegisterOtp,
      setRegisterTouched,
      setSelectedCountry,
      setShowPassword,
      setFormError,
      setStep,
    },
    handlers: {
      switchMode,
      handleLoginNext,
      handleLoginSubmit,
      handleLoginBack,
      handleRegisterNextStep,
      handleVerifyOtp,
      handleSubmit: handleRegisterSubmit,
      handleForgotPassword,
      handleGoogleLogin,
    },
  };
}
