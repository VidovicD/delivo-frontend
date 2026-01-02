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

    console.log("TRY TRUSTED LOGIN:", { phone, deviceId, trustToken: !!trustToken });

    const { data, error } = await supabase.functions.invoke("login-with-phone", {
      body: {
        phone,
        device_id: deviceId,
        trust_token: trustToken,
      },
    });

    if (error) {
      console.error("TRUSTED LOGIN ERROR:", error);
      return null;
    }

    const payload = data?.data;

    if (payload?.action_link) {
      console.log("TRUSTED LOGIN ACTION LINK RECEIVED");
      return payload.action_link;
    }

    return null;
  };

  const loginPhoneDirect = async (normalizedPhone) => {
    const deviceId = getDeviceId();

    console.log("LOGIN PHONE DIRECT:", {
      phone: normalizedPhone,
      device_id: deviceId,
      issue_trust: true,
    });

    const { data: loginData, error: loginError } =
      await supabase.functions.invoke("login-with-phone", {
        body: {
          phone: normalizedPhone,
          device_id: deviceId,
          trust_token: getTrustToken(),
          issue_trust: true,
        },
      });

    if (loginError) {
      console.error("LOGIN DIRECT ERROR:", loginError);
      throw loginError;
    }

    console.log("LOGIN DIRECT RESPONSE:", {
      has_action_link: !!loginData?.action_link,
      has_trust_token: !!loginData?.trust_token,
    });

    const payload = loginData?.data;

    if (payload?.trust_token) {
      setTrustToken(payload.trust_token);
    }

    if (!payload?.action_link) {
      throw new Error("Missing action_link");
    }

    window.location.href = payload.action_link;
    return;
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

    console.log("LOGIN NEXT NORMALIZED PHONE:", normalizedPhone);

    if (!isValidPhone(normalizedPhone)) {
      setFormError("Unesite ispravan broj telefona.");
      return;
    }

    setLoading(true);
    try {
      const trustedLink = await tryTrustedLogin(normalizedPhone);
      if (trustedLink) {
        console.log("REDIRECT TRUSTED LINK");
        window.location.href = trustedLink;
        return;
      }

      const { data: existsData, error: existsError } =
        await supabase.functions.invoke("check-phone", {
          body: { phone: normalizedPhone },
        });

      if (existsError) {
        console.error("CHECK PHONE ERROR:", existsError);
        throw existsError;
      }

      if (!existsData?.exists) {
        setFormError("Ne postoji nalog sa ovim brojem telefona.");
        return;
      }

      setLoginVerifiedPhone(normalizedPhone);
      setLoginOtp("");
      setLoginOtpExpiresAt(null);
      setLoginOtpAttemptsLeft(5);
      setLoginTouched(false);
      setLoginStep("value");

      await loginPhoneDirect(normalizedPhone);
      return;
    } catch (e) {
      console.error("LOGIN NEXT ERROR:", e);
      const msg = (e?.message || "").toLowerCase();

      if (e?.status === 429 || msg.includes("too many")) {
        setFormError("Previše pokušaja. Sačekajte minut i pokušajte ponovo.");
      } else if (e?.status === 401) {
        setFormError("Prijava nije uspela. Pokušajte ponovo.");
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
        console.error("LOGIN EMAIL ERROR:", e);
        setFormError(getAuthErrorMessage(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    const normalizedPhone = normalizePhone(
      loginValue,
      selectedCountry.dialCode
    );

    console.log("LOGIN SUBMIT NORMALIZED PHONE:", normalizedPhone);

    if (!isValidPhone(normalizedPhone)) {
      setFormError("Unesite ispravan broj telefona.");
      return;
    }

    setLoading(true);
    try {
      const trustedLink = await tryTrustedLogin(normalizedPhone);
      if (trustedLink) {
        console.log("REDIRECT TRUSTED LINK");
        window.location.href = trustedLink;
        return;
      }

      const { data: existsData, error: existsError } =
        await supabase.functions.invoke("check-phone", {
          body: { phone: normalizedPhone },
        });

      if (existsError) {
        console.error("CHECK PHONE ERROR:", existsError);
        throw existsError;
      }

      if (!existsData?.exists) {
        setFormError("Ne postoji nalog sa ovim brojem telefona.");
        return;
      }

      await loginPhoneDirect(normalizedPhone);
      return;
    } catch (e) {
      console.error("LOGIN SUBMIT ERROR:", e);
      const msg = (e?.message || "").toLowerCase();

      if (e?.status === 429 || msg.includes("too many")) {
        setFormError("Previše pokušaja. Sačekajte minut i pokušajte ponovo.");
      } else if (e?.status === 401) {
        setFormError("Prijava nije uspela. Pokušajte ponovo.");
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
      console.error("REGISTER NEXT STEP ERROR:", e);
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
      console.error("VERIFY OTP ERROR:", e);
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
