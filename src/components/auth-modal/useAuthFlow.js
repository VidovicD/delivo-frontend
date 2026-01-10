import { useEffect, useRef, useState } from "react";
import { isValidEmail, isValidPassword, getAuthErrorMessage } from "./authUtils";
import { loginWithPassword, googleOAuth, resetPassword } from "./authActions";
import { supabase } from "../../supabaseClient";
import { syncGuestAddressesToUser } from "../../utils/deliveryAddress";
import { getFullPhoneNumber, isValidPhoneNumber } from "../../utils/phoneUtils";

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
  const [registerPhoneCountry, setRegisterPhoneCountry] = useState("RS");
  const [registerPhone, setRegisterPhone] = useState("");
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
  const [resendNotice, setResendNotice] = useState("");

  const [loginTouched, setLoginTouched] = useState(false);
  const [registerTouched, setRegisterTouched] = useState({
    email: false,
    name: false,
    phone: false,
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
    setRegisterPhoneCountry("RS");
    setRegisterPhone("");
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
    
    // Resetuj samo ako se menja mode (sa login na register ili obrnuto)
    if (mode !== nextMode) {
      if (nextMode === "login") {
        resetLoginState();
      } else if (nextMode === "register") {
        resetRegisterState();
      }
    }
    
    onSwitch(nextMode);
  };

  const formatWaitTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.max(0, seconds % 60);
    if (mins <= 0) return `${secs} s`;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} s`;
  };

  const applyCooldownFromResponse = (resp, email) => {
    try {
      const data = resp?._serverData || resp || {};
      if (data?.code_sent_at) {
        const sentAt = new Date(data.code_sent_at).getTime();
        const cooldown = sentAt + (data?.resend_cooldown_seconds || data?.waitSeconds || 60) * 1000;
        setResendCooldownUntil(cooldown);
        return cooldown;
      }
      // fallback to localStorage
      const raw = localStorage.getItem(`pending_registration:${email}`);
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored?.code_sent_at) {
          const sentAt = new Date(stored.code_sent_at).getTime();
          const cooldown = sentAt + (data?.resend_cooldown_seconds || data?.waitSeconds || 60) * 1000;
          setResendCooldownUntil(cooldown);
          return cooldown;
        }
      }
      // last resort: use waitSeconds or default
      const wait = data?.waitSeconds !== undefined ? data.waitSeconds : 60;
      const fallback = Date.now() + wait * 1000;
      setResendCooldownUntil(fallback);
      return fallback;
    } catch (e) {
      const wait = resp?.waitSeconds !== undefined ? resp.waitSeconds : 60;
      const fallback = Date.now() + wait * 1000;
      setResendCooldownUntil(fallback);
      return fallback;
    }
  };

  // Kada korisnik unese email ili otvori email korak, pokušaj da prefetch-uješ
  // server timestamps tako da UI bude uvek sinhronizovan (fallback postoji).
  useEffect(() => {
    if (!registerEmail || registerStep !== "email") return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("pending-status", { body: { email: registerEmail } });
        if (!mounted) return;
        if (data && data.code_sent_at) {
          // Persist server timestamps to localStorage (but don't show cooldown yet)
          try {
            const store = {
              code_sent_at: data.code_sent_at,
              code_expires_at: data.code_expires_at,
            };
            localStorage.setItem(`pending_registration:${registerEmail}`, JSON.stringify(store));
          } catch (e) {}
        } else {
          // Server has no pending record — clear local fallback so UI won't show stale countdown
          try { localStorage.removeItem(`pending_registration:${registerEmail}`); } catch (e) {}
          setResendCooldownUntil(null);
          setCooldownMessage("");
        }
      } catch (e) {
        // Ne prikazujemo grešku korisniku; fallback logika ostaje
      }
    })();
    return () => { mounted = false; };
  }, [registerEmail, registerStep]);

  // Resetuj OTP i cooldown kada se korisnik vrati na email korak
  useEffect(() => {
    if (registerStep === "email") {
      setRegisterOtp("");
      setOtpLockoutUntil(null);
      setResendCooldownUntil(null);
      setCooldownMessage("");
      setFormError("");
    }
  }, [registerStep]);

  useEffect(() => {
    if (!otpLockoutUntil) {
      setFormError((prev) => {
        if (prev && prev.includes("Previše pokušaja")) {
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
        setRegisterOtp("");
        setFormError("Kod je istekao. Zatražite novi kod.");
        return;
      }

      const remainingSeconds = Math.ceil(remaining / 1000);
      const formattedTime = formatWaitTime(remainingSeconds);
      
      setFormError((prev) => {
        if (prev && prev.includes("Previše pokušaja")) {
          return `Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`;
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

    // Only update cooldown message if it's already set (user clicked during cooldown)
    if (!cooldownMessage) {
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
      
      setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
    };

    const interval = setInterval(updateCooldownMessage, 1000);

    return () => clearInterval(interval);
  }, [resendCooldownUntil, cooldownMessage]);

  // Resetuj sve kada korisnik bira "register" mode (npr. nakon što zatvori modal i ponovo otvori)
  useEffect(() => {
    if (mode === "register") {
      resetRegisterState();
    } else if (mode === "login") {
      resetLoginState();
    }
  }, [mode]);

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
      setFormError("Unesite lozinku.");
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
      // Attach server fields for debugging
      err._serverData = data;
      throw err;
    }

    setRegisterVerifyToken("");
    setOtpLockoutUntil(null);
    setResendCooldownUntil(null);
    // Persist server timestamps to localStorage so timers survive modal close/open
    try {
      const store = {
        code_sent_at: data?.code_sent_at || new Date().toISOString(),
        code_expires_at:
          data?.code_expires_at || new Date(Date.now() + (data?.expiresIn || 600) * 1000).toISOString(),
      };
      localStorage.setItem(`pending_registration:${email}`, JSON.stringify(store));
      setOtpExpiresAt(new Date(store.code_expires_at).getTime());
    } catch (e) {
      setOtpExpiresAt(Date.now() + (data.expiresIn || 600) * 1000);
    }
    setOtpAttemptsLeft(5);
  };

  const handleVerifyOtp = async () => {
    if (loading) return;
    
    setRegisterTouched((t) => ({ ...t, otp: true }));

    if (!registerOtp) {
      // Client-side validacija će prikazati "Unesite verifikacioni kod."
      // Samo postavi touched, ne postavljaj formError
      return;
    }

    setFormError("");

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
          setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
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
          setFormError("Pogrešan kod.");
        }
        return;
      }

      setRegisterVerifyToken(data.verifyToken || "");
      setOtpLockoutUntil(null);
      setRegisterOtp("");
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
        setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
      } else if (msg && (msg?.includes("Kod je vec poslat") || msg === "Kod je vec poslat.")) {
        applyCooldownFromResponse(e, registerEmail);
      } else if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Kod je vec poslat")) {
          applyCooldownFromResponse(e, registerEmail);
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
    
    // Check if cooldown is still active
    if (resendCooldownUntil && resendCooldownUntil > Date.now()) {
      const remaining = resendCooldownUntil - Date.now();
      const remainingSeconds = Math.ceil(remaining / 1000);
      const formattedTime = formatWaitTime(remainingSeconds);
      setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
      return;
    }
    
    // Cooldown has expired or doesn't exist - send new code
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
      
      // Set cooldown immediately after sending
      const cooldownUntil = Date.now() + 60 * 1000;
      setResendCooldownUntil(cooldownUntil);
      
      // Show confirmation message for 4 seconds
      setResendNotice("Novi verifikacioni kod je uspešno poslat.");
      setTimeout(() => {
        setResendNotice("");
      }, 4000);
    } catch (e) {
      const msg = e?.message;
      if (e?.lockoutSeconds) {
        const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
        setOtpLockoutUntil(lockoutUntil);
        const formattedTime = formatWaitTime(e.lockoutSeconds);
        setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
        setLoading(false);
        return;
      }
      if (msg && (msg === "Kod je vec poslat." || msg.includes("Kod je vec poslat"))) {
        // Prefer server-provided data if available
        const serverData = e?._serverData || null;
        if (serverData && serverData.code_sent_at) {
          const cooldownUntil = applyCooldownFromResponse(serverData, registerEmail);
          if (cooldownUntil) {
            const remainingSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
            const formattedTime = formatWaitTime(Math.max(0, remainingSeconds));
            setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
          }
          setLoading(false);
          return;
        }

        // Ako server nije poslao timestamps, primeni odmah klijentski fallback cooldown
        // i pokušaj da osvežiš tačne timestamps u pozadini bez blokiranja UI.
        {
          const immediateCooldown = applyCooldownFromResponse(e, registerEmail);
          if (immediateCooldown) {
            setResendCooldownUntil(immediateCooldown);
            const remainingSeconds = Math.ceil((immediateCooldown - Date.now()) / 1000);
            const formattedTime = formatWaitTime(Math.max(0, remainingSeconds));
            setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
          } else {
            const fallback = Date.now() + 30 * 1000;
            setResendCooldownUntil(fallback);
            setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ~30 s.`);
          }

          // Pokusaj da dohvatimo authoritative timestamps (ne-blokirajuće)
          try {
            const { data: pendingData } = await supabase.functions.invoke("pending-status", { body: { email: registerEmail } });
            if (pendingData && pendingData.code_sent_at) {
              const cooldownUntil = applyCooldownFromResponse(pendingData, registerEmail);
              try {
                const store = {
                  code_sent_at: pendingData.code_sent_at,
                  code_expires_at: pendingData.code_expires_at,
                };
                localStorage.setItem(`pending_registration:${registerEmail}`, JSON.stringify(store));
              } catch (e) {}
              if (cooldownUntil) {
                setResendCooldownUntil(cooldownUntil);
                const remainingSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
                const formattedTime = formatWaitTime(Math.max(0, remainingSeconds));
                setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
              }
            }
          } catch (err) {
            console.error("PENDING_STATUS_FETCH_ERROR", err);
            // Ne prikazuj dodatnu grešku korisniku; immediate fallback već postavljen
          }

          setLoading(false);
          return;
        }
      }
      if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Previse pokusaja") && e?.lockoutSeconds) {
          const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
          setOtpLockoutUntil(lockoutUntil);
          const formattedTime = formatWaitTime(e.lockoutSeconds);
          setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
        } else if (msg.includes("Kod je vec poslat")) {
          const cooldownUntil = applyCooldownFromResponse(e, registerEmail);
          if (cooldownUntil) {
            const remainingSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
            const formattedTime = formatWaitTime(Math.max(0, remainingSeconds));
            setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
          }
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

          // Ako kod je vec poslat (waitSeconds) ili backend vraća poruku da je kod poslat,
          // automatski prebaci na OTP korak bez slanja novog koda. Koristi timestamp sa servera
          if (
            !data?.ok && (
              data?.waitSeconds !== undefined ||
              (data?.error && (data.error.includes("Kod je vec poslat") || data.error.includes("Kod je poslat")))
            )
          ) {
            // Preferiraj server timestamp ako je dostavljen
            if (data?.code_sent_at) {
              const sentAt = new Date(data.code_sent_at).getTime();
              const cooldownUntil = sentAt + (data?.resend_cooldown_seconds || 60) * 1000;
              setResendCooldownUntil(cooldownUntil);
              // persist to localStorage
              try {
                const store = {
                  code_sent_at: data.code_sent_at,
                  code_expires_at: data.code_expires_at,
                };
                localStorage.setItem(`pending_registration:${registerEmail}`, JSON.stringify(store));
              } catch (e) {}
            } else {
              // fallback: try to read previously stored timestamp from localStorage
              try {
                const raw = localStorage.getItem(`pending_registration:${registerEmail}`);
                if (raw) {
                  const stored = JSON.parse(raw);
                  if (stored?.code_sent_at) {
                    const sentAt = new Date(stored.code_sent_at).getTime();
                    const cooldownUntil = sentAt + (data?.waitSeconds || 60) * 1000;
                    setResendCooldownUntil(cooldownUntil);
                  } else {
                    const wait = data?.waitSeconds !== undefined ? data.waitSeconds : 60;
                    const cooldownUntil = Date.now() + wait * 1000;
                    setResendCooldownUntil(cooldownUntil);
                  }
                } else {
                  const wait = data?.waitSeconds !== undefined ? data.waitSeconds : 60;
                  const cooldownUntil = Date.now() + wait * 1000;
                  setResendCooldownUntil(cooldownUntil);
                }
              } catch (e) {
                const wait = data?.waitSeconds !== undefined ? data.waitSeconds : 60;
                const cooldownUntil = Date.now() + wait * 1000;
                setResendCooldownUntil(cooldownUntil);
              }
            }

            setFormError(""); // Ne prikazuj grešku na email ekranu
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
            setFormError("Nalog sa tim emailom vec postoji. Molimo vas, ulogujte se.");
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
          // Koristi podatke iz prvog odgovora (prefer server timestamps)
          setRegisterVerifyToken("");
          setOtpLockoutUntil(null);
          const expiresIn = data?.expiresIn !== undefined ? data.expiresIn : 300;
          if (data?.code_expires_at) {
            setOtpExpiresAt(new Date(data.code_expires_at).getTime());
          } else {
            setOtpExpiresAt(Date.now() + expiresIn * 1000);
          }

          if (data?.code_sent_at) {
            const sentAt = new Date(data.code_sent_at).getTime();
            const cooldownUntil = sentAt + (data?.resend_cooldown_seconds || 60) * 1000;
            setResendCooldownUntil(cooldownUntil);
            try {
              const store = {
                code_sent_at: data.code_sent_at,
                code_expires_at: data.code_expires_at,
              };
              localStorage.setItem(`pending_registration:${registerEmail}`, JSON.stringify(store));
            } catch (e) {}
          } else {
            try {
              const raw = localStorage.getItem(`pending_registration:${registerEmail}`);
              if (raw) {
                const stored = JSON.parse(raw);
                if (stored?.code_sent_at) {
                  const sentAt = new Date(stored.code_sent_at).getTime();
                  const cooldownUntil = sentAt + (data?.resend_cooldown_seconds || 60) * 1000;
                  setResendCooldownUntil(cooldownUntil);
                } else {
                  const fallbackCooldown = Date.now() + (data?.resend_cooldown_seconds || 60) * 1000;
                  setResendCooldownUntil(fallbackCooldown);
                }
              } else {
                const fallbackCooldown = Date.now() + (data?.resend_cooldown_seconds || 60) * 1000;
                setResendCooldownUntil(fallbackCooldown);
              }
            } catch (e) {
              const fallbackCooldown = Date.now() + (data?.resend_cooldown_seconds || 60) * 1000;
              setResendCooldownUntil(fallbackCooldown);
            }
          }

          setOtpAttemptsLeft(5);
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
              // Compute cooldown from server or localStorage
              applyCooldownFromResponse(e, registerEmail);
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
        !registerPhone ||
        !registerPassword ||
        !registerPasswordConfirm
      ) {
        setFormError("Popunite sva polja.");
        return;
      }

      if (!isValidPhoneNumber(registerPhone, registerPhoneCountry)) {
        setFormError("Broj telefona nije validan.");
        return;
      }

      if (!isValidPassword(registerPassword)) {
        if (registerPassword.length < 8) {
          setFormError("Lozinka mora imati najmanje 8 karaktera.");
        } else if (!/[a-zA-Z]/.test(registerPassword)) {
          setFormError("Lozinka mora sadržati bar jedno slovo.");
        } else if (!/[0-9]/.test(registerPassword)) {
          setFormError("Lozinka mora sadržati bar jedan broj.");
        }
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
            phone: getFullPhoneNumber(registerPhone, registerPhoneCountry),
            password: registerPassword,
          },
        });

      if (completeError) throw completeError;
      if (!completeData?.ok) {
        setFormError(completeData?.error || "Doslo je do greske.");
        return;
      }

      // Registration complete: clear any stored pending registration info
      try {
        localStorage.removeItem(`pending_registration:${registerEmail}`);
      } catch (e) {}

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
        setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
        return;
      }
      if (msg && (msg === "Kod je vec poslat." || msg.includes("Kod je vec poslat"))) {
        const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
        const cooldownUntil = Date.now() + waitSeconds * 1000;
        setResendCooldownUntil(cooldownUntil);
        const formattedTime = formatWaitTime(waitSeconds);
        setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
        return;
      }
      if (msg && !msg.includes("Edge Function")) {
        if (msg.includes("Previse pokusaja") && e?.lockoutSeconds) {
          const lockoutUntil = Date.now() + e.lockoutSeconds * 1000;
          setOtpLockoutUntil(lockoutUntil);
          const formattedTime = formatWaitTime(e.lockoutSeconds);
          setFormError(`Previše pokušaja. Sačekajte još ${formattedTime} pa pokušajte ponovo.`);
        } else if (msg.includes("Kod je vec poslat")) {
          const waitSeconds = e?.waitSeconds !== undefined ? e.waitSeconds : 60;
          const cooldownUntil = Date.now() + waitSeconds * 1000;
          setResendCooldownUntil(cooldownUntil);
          const formattedTime = formatWaitTime(waitSeconds);
          setCooldownMessage(`Kod je već poslat. Pokušajte ponovo za ${formattedTime}.`);
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
      registerPhoneCountry,
      registerPhone,
      registerPassword,
      registerPasswordConfirm,
      registerOtp,
      otpExpiresAt,
      otpAttemptsLeft,
      otpLocked: Boolean(otpLockoutUntil && Date.now() < otpLockoutUntil),
      otpLockoutUntil,
      loading,
      formError,
      cooldownMessage,
      resendNotice,
    },
    setters: {
      setLoginValue,
      setLoginPassword,
      setLoginTouched,
      setRegisterName,
      setRegisterEmail,
      setRegisterPhoneCountry,
      setRegisterPhone,
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
