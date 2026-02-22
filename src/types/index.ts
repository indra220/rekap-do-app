export interface PenyaluranData { 
  id: string; 
  tglSalur: string; 
  pengecer: string; 
  penyaluran: number; 
}

export interface SOData { 
  id: string; 
  tanggalSO: string; 
  noSO: string; 
  kecamatan: string; 
  stokAwal: number; 
  pengadaan: number; 
  penyaluranList: PenyaluranData[]; 
}

export interface TemplateData {
  kepada: string; 
  penerima_1: string; 
  penerima_2: string;
  alamat_penerima_1: string; 
  alamat_penerima_2: string;
  code: string; 
  provinsi: string; 
  nama_perusahaan: string;
  alamat_perusahaan: string; 
  telp: string; 
  email: string;
  kabupaten: string; 
  jenis_pupuk: string;
  direktur: string; 
  jabatan: string;
  tembusan: string[];
  phonska_a1?: string;
  phonska_a2?: string;
  phonska_a3?: string;
  phonska_a4?: string;
  no_so_prefix?: string;
}