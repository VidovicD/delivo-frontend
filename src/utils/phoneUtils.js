import { COUNTRIES } from './countries';

// Uklanja vodečue nule i vraća samo brojeve
export const removeLeadingZeros = (phoneNumber) => {
  return phoneNumber.replace(/^0+/, '');
};

// Formatira broj telefona - samo uklanja vodečue nule, bez razmaka
export const formatPhoneNumber = (phoneNumber, countryCode) => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return phoneNumber;
  
  // Uklanja sve što nije broj
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Uklanja vodečue nule
  let cleanedNumber = removeLeadingZeros(digitsOnly);
  
  // Limitira dužinu zavisno od zemlje - default max 15 cifara (međunarodni standard)
  const maxLengths = {
    'RS': 9, 'HR': 9, 'BA': 8, 'ME': 8, 'MK': 8, 'SI': 9, 'HU': 9, 'RO': 9,
    'BG': 9, 'AT': 10, 'CH': 9, 'DE': 11, 'IT': 10, 'FR': 9, 'ES': 9, 'PT': 9,
    'GR': 10, 'TR': 10, 'UA': 9, 'PL': 9, 'CZ': 9, 'SK': 9, 'NL': 9, 'BE': 9,
    'LU': 9, 'IE': 9, 'GB': 10, 'SE': 9, 'NO': 8, 'DK': 8, 'FI': 9, 'LT': 9,
    'LV': 8, 'EE': 8, 'BY': 9, 'MD': 8, 'US': 10, 'CA': 10, 'AU': 9, 'NZ': 9,
    'JP': 10, 'KR': 10, 'TH': 9, 'SG': 8, 'HK': 8, 'IN': 10, 'PK': 10, 'IL': 9,
    'AE': 9, 'SA': 9, 'JO': 9, 'MX': 10, 'BR': 11, 'AR': 10, 'ZA': 9, 'EG': 10,
    'NG': 10
  };
  
  const maxLength = maxLengths[countryCode] || 15;
  
  if (cleanedNumber.length > maxLength) {
    cleanedNumber = cleanedNumber.slice(0, maxLength);
  }
  
  return cleanedNumber;
};

// Validira broj telefona
export const isValidPhoneNumber = (phoneNumber, countryCode) => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return false;
  
  // Uklanja sve što nije broj
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Uklanja vodečue nule
  const cleanedNumber = removeLeadingZeros(digitsOnly);
  
  // Minimalna dužina za većinu zemalja je 8 cifara
  return cleanedNumber.length >= 8 && cleanedNumber.length <= 15;
};

// Vraća broj telefona sa country dial code za slanje na backend
export const getFullPhoneNumber = (phoneNumber, countryCode) => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  if (!country) return '';
  
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const cleanedNumber = removeLeadingZeros(digitsOnly);
  
  return `+${country.dialCode}${cleanedNumber}`;
};
