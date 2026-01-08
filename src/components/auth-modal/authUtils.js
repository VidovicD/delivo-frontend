export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getAuthErrorMessage = (err) => {
  if (!err) return "";

  const msg = (err.message || "").toLowerCase();

  if (err.status === 429 || msg.includes("too many"))
    return "Previse pokusaja. Sacekajte minut i pokusajte ponovo.";

  if (msg.includes("invalid login credentials"))
    return "Pogresna lozinka.";

  if (msg.includes("already") && msg.includes("registered"))
    return "Nalog sa ovom email adresom vec postoji.";

  if (msg.includes("password"))
    return "Lozinka mora imati najmanje 6 karaktera.";

  if (msg.includes("email") && msg.includes("invalid"))
    return "Email adresa nije validna.";

  return "Doslo je do greske. Pokusajte ponovo.";
};
