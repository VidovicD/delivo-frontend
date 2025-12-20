export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getAuthErrorMessage = (err) => {
  if (!err) return "";
  const msg = (err.message || "").toLowerCase();

  if (msg.includes("invalid login credentials"))
    return "Pogrešan email ili lozinka.";

  if (msg.includes("already") && msg.includes("registered"))
    return "Nalog sa ovom email adresom već postoji.";

  if (msg.includes("password"))
    return "Lozinka mora imati najmanje 6 karaktera.";

  if (msg.includes("email") && msg.includes("invalid"))
    return "Email adresa nije validna.";

  if (msg.includes("rate limit"))
    return "Došlo je do privremene greške. Pokušajte ponovo za minut.";

  return "Došlo je do greške. Pokušajte ponovo.";
};
