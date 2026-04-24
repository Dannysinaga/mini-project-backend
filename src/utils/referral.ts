export const generateReferralCode = (fullName: string) => {
  const cleanName = fullName.replace(/\s+/g, "").toUpperCase().slice(0, 5);
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${cleanName}${random}`;
};