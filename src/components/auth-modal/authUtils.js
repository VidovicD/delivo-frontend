export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const normalizePhone = (rawPhone, dialCode) => {
  if (!rawPhone) return "";

  let phone = rawPhone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
    phone = phone.slice(1);
  }

  return `+${dialCode}${phone}`;
};

export const isValidPhone = (phone) =>
  /^\+[1-9]\d{7,14}$/.test(phone);

export const getAuthErrorMessage = (err) => {
  if (!err) return "";

  const msg = (err.message || "").toLowerCase();

  if (err.status === 429 || msg.includes("too many"))
    return "Previše pokušaja. Sačekajte minut i pokušajte ponovo.";

  if (msg.includes("invalid login credentials"))
    return "Pogrešan email ili lozinka.";

  if (msg.includes("already") && msg.includes("registered"))
    return "Nalog sa ovom email adresom već postoji.";

  if (msg.includes("password"))
    return "Lozinka mora imati najmanje 6 karaktera.";

  if (msg.includes("email") && msg.includes("invalid"))
    return "Email adresa nije validna.";

  return "Došlo je do greške. Pokušajte ponovo.";
};
