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
  const [resendCooldownUntil, setResendCooldownUntil] = useState(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState(null);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [cooldownMessage, setCooldownMessage] = useState("");

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
    setResendCooldownUntil(null);
    setOtpExpiresAt(null);
    setOtpAttemptsLeft(5);
    setFormError(""); // Očisti grešku kada se resetuje stanje
    setCooldownMessage(""); // Očisti cooldown poruku
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
    if (!otpLockoutUntil) {
      setFormError((prev) => {
        if (prev && prev.includes("Previse pokusaja")) {
          return "";
        }
        return prev;
      });
      return;
    }

    const updateLockoutMessage = () => {
      const remaining = otpLockoutUntil - Date.now();
      if (remaining <= 0) {
        setOtpLockoutUntil(null);
        setFormError((prev) => {
          if (prev && prev.includes("Previse pokusaja")) {
            return "";
          }
          return prev;
        });
        return;
      }

      const remainingSeconds = Math.ceil(remaining / 1000);
      const formattedTime = formatWaitTime(remainingSeconds);
      
      setFormError((prev) => {
        if (prev && prev.includes("Previse pokusaja")) {
          return `Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`;
        }
        return prev;
      });
    };

    updateLockoutMessage();

    const interval = setInterval(updateLockoutMessage, 1000);

    return () => clearInterval(interval);
  }, [otpLockoutUntil]);

  useEffect(() => {
    if (!resendCooldownUntil) {
      setCooldownMessage("");
      return;
    }

    const updateCooldownMessage = () => {
      const remaining = resendCooldownUntil - Date.now();
      if (remaining <= 0) {
        setResendCooldownUntil(null);
        setCooldownMessage("");
        return;
      }

      const remainingSeconds = Math.ceil(remaining / 1000);
      const formattedTime = formatWaitTime(remainingSeconds);
      
      setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
    };

    // Odmah postavi poruku
    updateCooldownMessage();

    const interval = setInterval(updateCooldownMessage, 1000);

    return () => clearInterval(interval);
  }, [resendCooldownUntil]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Uklonjen checkLockoutStatus - provera se radi pri slanju koda, ne ovde

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

  // Uklonjena checkLockoutStatus funkcija - nije potrebna

  const sendRegisterOtp = async (email) => {
    const { data, error } = await supabase.functions.invoke(
      "register-send-code",
      { body: { email } }
    );

    if (error) throw error;
    if (!data?.ok) {
      const errorMsg = data?.error || "Doslo je do greske.";
      const err = new Error(errorMsg);
      if (data?.lockoutSeconds) {
        err.lockoutSeconds = data.lockoutSeconds;
      }
      if (data?.waitSeconds !== undefined) {
        err.waitSeconds = data.waitSeconds;
      }
      throw err;
    }

    setRegisterVerifyToken("");
    setOtpLockoutUntil(null);
    setResendCooldownUntil(null);
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
          const lockoutUntil = Date.now() + data.lockoutSeconds * 1000;
          setOtpLockoutUntil(lockoutUntil);
          const formattedTime = formatWaitTime(data.lockoutSeconds);
          setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
          return;
        }
        if (data?.waitSeconds) {
          const cooldownUntil = Date.now() + data.waitSeconds * 1000;
          setResendCooldownUntil(cooldownUntil);
          return;
        }
        if (data?.error && !data.error.includes("Kod je vec poslat")) {
          setFormError(data.error);
        } else {
          setFormError("Pogresan kod.");
        }
        return;
      }

      setRegisterVerifyToken(data.verifyToken || "");
      setOtpLockoutUntil(null);
      setCooldownMessage("");
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
        const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
        setOtpLockoutUntil(lockoutUntil);
        const formattedTime = formatWaitTime(e.lockoutSeconds);
        setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
      } else if (msg && (msg?.includes("Kod je vec poslat") || msg === "Kod je vec poslat.")) {
        const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
        const cooldownUntil = Date.now() + waitSeconds * 1000;
        setResendCooldownUntil(cooldownUntil);
      } else if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Kod je vec poslat")) {
          const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
          const cooldownUntil = Date.now() + waitSeconds * 1000;
          setResendCooldownUntil(cooldownUntil);
        } else {
          setFormError(msg);
        }
      } else {
        setFormError(getAuthErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterResendOtp = async () => {
    if (loading) return;
    if (resendCooldownUntil && resendCooldownUntil > Date.now()) {
      const remaining = resendCooldownUntil - Date.now();
      const remainingSeconds = Math.ceil(remaining / 1000);
      const formattedTime = formatWaitTime(remainingSeconds);
      setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
      return;
    }
    setCooldownMessage("");
    setFormError("");

    if (!isValidEmail(registerEmail)) {
      setFormError("Email adresa nije validna.");
      return;
    }

    setLoading(true);
    try {
      await sendRegisterOtp(registerEmail);
      setOtpAttemptsLeft(5);
      const cooldownUntil = Date.now() + 60 * 1000;
      setResendCooldownUntil(cooldownUntil);
      const formattedTime = formatWaitTime(60);
      setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
    } catch (e) {
      const msg = e?.message;
      if (e?.lockoutSeconds) {
        const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
        setOtpLockoutUntil(lockoutUntil);
        const formattedTime = formatWaitTime(e.lockoutSeconds);
        setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
        setLoading(false);
        return;
      }
      if (msg && (msg === "Kod je vec poslat." || msg.includes("Kod je vec poslat"))) {
        const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
        const cooldownUntil = Date.now() + waitSeconds * 1000;
        setResendCooldownUntil(cooldownUntil);
        const formattedTime = formatWaitTime(waitSeconds);
        setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
        setLoading(false);
        return;
      }
      if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Previse pokusaja") && e?.lockoutSeconds) {
          const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
          setOtpLockoutUntil(lockoutUntil);
          const formattedTime = formatWaitTime(e.lockoutSeconds);
          setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
        } else if (msg.includes("Kod je vec poslat")) {
          const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
          const cooldownUntil = Date.now() + waitSeconds * 1000;
          setResendCooldownUntil(cooldownUntil);
          const formattedTime = formatWaitTime(waitSeconds);
          setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
        } else {
          setFormError(msg);
        }
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
          setLoading(false);
          return;
        }

        if (!isValidEmail(registerEmail)) {
          setFormError("Email adresa nije validna.");
          setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase.functions.invoke(
            "register-send-code",
            { body: { email: registerEmail } }
          );

          if (error) throw error;

          // Ako kod je vec poslat (waitSeconds), automatski prebaci na OTP korak bez slanja novog koda
          if (!data?.ok && data?.waitSeconds !== undefined) {
            // Backend vraća koliko sekundi je ostalo do mogućnosti ponovnog slanja
            const cooldownUntil = Date.now() + data.waitSeconds * 1000;
            setResendCooldownUntil(cooldownUntil);
            setFormError(""); // Ne prikazuj grešku na email ekranu
            // NE pozivaj sendRegisterOtp - kod je već poslat i još je pod limitom
            setRegisterStep("otp");
            setRegisterTouched({
              email: false,
              name: false,
              password: false,
              passwordConfirm: false,
              otp: false,
            });
            setLoading(false);
            return;
          }

          // Ako je lockout, prebaci na OTP korak ali ne prikazuj grešku na email ekranu - prikazaće se na OTP ekranu
          if (!data?.ok && data?.lockoutSeconds) {
            const lockoutUntil = Date.now() + data.lockoutSeconds * 1000;
            setOtpLockoutUntil(lockoutUntil);
            setFormError(""); // Ne prikazuj grešku na email ekranu
            // NE pozivaj sendRegisterOtp - korisnik je u lockout-u
            setRegisterStep("otp");
            setRegisterTouched({
              email: false,
              name: false,
              password: false,
              passwordConfirm: false,
              otp: false,
            });
            setLoading(false);
            return;
          }

          // Ako je email već registrovan, prikaži grešku
          if (!data?.ok && data?.error?.includes("vec postoji")) {
            setFormError(data.error || "Nalog sa tim emailom vec postoji. Molimo vas, ulogujte se.");
            setLoading(false);
            return;
          }

          // Ako je neka druga greška, prikaži je
          if (!data?.ok) {
            setFormError(data?.error || "Doslo je do greske. Pokusajte ponovo.");
            setLoading(false);
            return;
          }

          // Uspešno poslat kod - prebaci na OTP korak
          await sendRegisterOtp(registerEmail);
          const cooldownUntil = Date.now() + 60 * 1000;
          setResendCooldownUntil(cooldownUntil);
          setFormError(""); // Očisti grešku
          setRegisterStep("otp");
          setRegisterTouched({
            email: false,
            name: false,
            password: false,
            passwordConfirm: false,
            otp: false,
          });
          setLoading(false);
          return;
        } catch (e) {
          const msg = e?.message || "";
          // Ako je kod vec poslat, prebaci na OTP korak bez slanja novog koda
          if (e?.waitSeconds !== undefined || msg.includes("Kod je vec poslat") || msg.includes("Kod je poslat")) {
            // Koristi waitSeconds ako je dostupan, inače koristi default 60 sekundi
            const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
            const cooldownUntil = Date.now() + waitSeconds * 1000;
            setResendCooldownUntil(cooldownUntil);
            setFormError(""); // Ne prikazuj grešku na email ekranu
            // NE pozivaj sendRegisterOtp - kod je već poslat i još je pod limitom
            setRegisterStep("otp");
            setRegisterTouched({
              email: false,
              name: false,
              password: false,
              passwordConfirm: false,
              otp: false,
            });
            setLoading(false);
            return;
          }
          // Za ostale greške, prikaži ih
          setFormError(getAuthErrorMessage(e));
          setLoading(false);
          return;
        }
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
        const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
        setOtpLockoutUntil(lockoutUntil);
        const formattedTime = formatWaitTime(e.lockoutSeconds);
        setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
        return;
      }
      if (msg && (msg === "Kod je vec poslat." || msg.includes("Kod je vec poslat"))) {
        const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
        const cooldownUntil = Date.now() + waitSeconds * 1000;
        setResendCooldownUntil(cooldownUntil);
        const formattedTime = formatWaitTime(waitSeconds);
        setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
        return;
      }
      if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Previse pokusaja") && e?.lockoutSeconds) {
          const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
          setOtpLockoutUntil(lockoutUntil);
          const formattedTime = formatWaitTime(e.lockoutSeconds);
          setFormError(`Previse pokusaja. Sacekajte još ${formattedTime} pa pokusajte ponovo.`);
        } else if (msg.includes("Kod je vec poslat")) {
          const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
          const cooldownUntil = Date.now() + waitSeconds * 1000;
          setResendCooldownUntil(cooldownUntil);
          const formattedTime = formatWaitTime(waitSeconds);
          setCooldownMessage(`Kod je poslat. Možete ponovo za ${formattedTime}.`);
        } else {
          setFormError(msg);
        }
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
      cooldownMessage,
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
