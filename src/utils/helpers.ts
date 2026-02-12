export const generateId = () => Math.random().toString(36).substring(2, 9);

export const formatTanggalIndo = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

// --- FUNGSI BARU UNTUK TANGGAL INGGRIS ---
export const formatTanggalEnglish = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Format: "Saturday, January 31, 2026"
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const formatDesimal = (num: number) => {
  return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};