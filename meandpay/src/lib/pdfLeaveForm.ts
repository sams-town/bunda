import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface LeaveFormData {
  tanggal_pengajuan: string;
  nama: string;
  nik: string;
  departemen: string;
  tanggal_mulai_kerja: string;
  dari_tanggal: string;
  sampai_tanggal: string;
  jumlah_hari: string;
  alasan_cuti: string;
  jenis_cuti: string; // "Cuti Tahunan", "Cuti Melahirkan", dsb
  sisa_cuti?: {
    tahun: string;
    jumlah_sisa: string;
    jumlah_diambil: string;
    jumlah_setelah: string;
  }[];
  logo_url?: string;
}

export const generateLeaveFormPDF = async (data: LeaveFormData) => {
  // A4 Landscape is 297 x 210 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth(); // 297
  const marginX = 10;
  let y = 10;

  // -- 1. HEADER SECTIONS --
  if (data.logo_url) {
    try {
      const imgData = await fetchImageAsBase64(data.logo_url);
      if (imgData) {
        doc.addImage(imgData, 'PNG', marginX + 5, y + 2, 25, 25);
      }
    } catch (err) {
      console.error("Failed to load logo", err);
    }
  }

  // Hospital Name Texts
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('RUMAH SAKIT', 45, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('HJ. BUNDA HALIMAH', 45, y + 20);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(12);
  doc.setTextColor(200, 50, 50);
  doc.text('Our Best for Your Health', 45, y + 26);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('| BATAM', 103, y + 26);

  // Box Title "PENGAJUAN CUTI KARYAWAN"
  const boxTitleWidth = 140;
  const boxTitleX = width - marginX - boxTitleWidth;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(boxTitleX, y, boxTitleWidth, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PENGAJUAN CUTI KARYAWAN', boxTitleX + boxTitleWidth / 2, y + 9.5, { align: 'center' });

  // Box "TANGGAL PENGAJUAN"
  doc.setFillColor(0, 0, 0);
  doc.rect(boxTitleX, y + 14, 55, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('TANGGAL PENGAJUAN', boxTitleX + 27.5, y + 19.5, { align: 'center' });

  // Input Box for Date
  doc.setTextColor(0, 0, 0);
  doc.rect(boxTitleX + 55, y + 14, boxTitleWidth - 55, 8);
  doc.setFont('helvetica', 'normal');
  doc.text(`             ${data.tanggal_pengajuan}             `, boxTitleX + 60, y + 19.5);

  y += 35; // Move down below header

  // -- 2. DATA KARYAWAN --
  doc.setFillColor(0, 0, 0);
  doc.rect(marginX, y, width - marginX * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('DATA KARYAWAN', width / 2, y + 5.5, { align: 'center' });
  
  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Left Column
  doc.text('Nama', marginX + 2, y + 5);
  doc.text(':', marginX + 25, y + 5);
  doc.text(data.nama, marginX + 28, y + 5);
  (doc as any).setLineDash([1, 1], 0);
  doc.setLineWidth(0.2);
  doc.line(marginX + 28, y + 6, width / 2 - 5, y + 6);

  doc.text('NIK', marginX + 2, y + 13);
  doc.text(':', marginX + 25, y + 13);
  doc.text(data.nik || '', marginX + 28, y + 13);
  doc.line(marginX + 28, y + 14, width / 2 - 5, y + 14);

  // Right Column
  const rightColX = width / 2 + 5;
  doc.text('Departemen / Unit', rightColX, y + 5);
  doc.text(':', rightColX + 40, y + 5);
  doc.text(data.departemen || '', rightColX + 43, y + 5);
  doc.line(rightColX + 43, y + 6, width - marginX - 2, y + 6);

  doc.text('Tanggal Mulai Kerja Awal', rightColX, y + 13);
  doc.text(':', rightColX + 40, y + 13);
  doc.text(data.tanggal_mulai_kerja || '', rightColX + 43, y + 13);
  doc.line(rightColX + 43, y + 14, width - marginX - 2, y + 14);

  y += 20;

  // -- 3. DETAIL CUTI --
  (doc as any).setLineDash([], 0); // solid line
  doc.setFillColor(0, 0, 0);
  doc.rect(marginX, y, width - marginX * 2, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAIL CUTI', width / 2, y + 5.5, { align: 'center' });

  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Jangka Waktu Box
  doc.setLineWidth(0.5);
  doc.rect(marginX, y + 2, width - marginX * 2, 10);
  
  doc.text('Jangka waktu   :   Dari', marginX + 2, y + 8);
  doc.text(data.dari_tanggal, marginX + 40, y + 8);
  (doc as any).setLineDash([1, 1], 0);
  doc.setLineWidth(0.2);
  doc.line(marginX + 38, y + 9, marginX + 70, y + 9);
  
  (doc as any).setLineDash([], 0);
  doc.text('s/d', marginX + 75, y + 8);
  doc.text(data.sampai_tanggal, marginX + 85, y + 8);
  (doc as any).setLineDash([1, 1], 0);
  doc.line(marginX + 83, y + 9, marginX + 115, y + 9);

  (doc as any).setLineDash([], 0);
  doc.text('Jumlah Hari   :', marginX + 125, y + 8);
  doc.text(`${data.jumlah_hari}`, marginX + 155, y + 8);
  (doc as any).setLineDash([1, 1], 0);
  doc.line(marginX + 150, y + 9, marginX + 165, y + 9);
  
  (doc as any).setLineDash([], 0);
  doc.text('Hari', marginX + 167, y + 8);

  doc.text('Alasan Cuti   :', marginX + 185, y + 8);
  doc.text(data.alasan_cuti, marginX + 210, y + 8);
  (doc as any).setLineDash([1, 1], 0);
  doc.line(marginX + 208, y + 9, width - marginX - 2, y + 9);

  y += 18;

  // -- Checkboxes --
  (doc as any).setLineDash([], 0);
  doc.setLineWidth(0.3);

  const drawCheckbox = (x: number, yPos: number, label: string, isChecked: boolean) => {
    doc.rect(x, yPos - 4, 6, 6); // box
    if (isChecked) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('X', x + 1.5, yPos + 0.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }
    doc.text(label, x + 10, yPos + 0.5);
    doc.text(':', x + 45, yPos + 0.5);
    
    // Fill value if checked
    if (isChecked) {
        doc.text(data.jumlah_hari, x + 50, yPos + 0.5);
    }
    
    (doc as any).setLineDash([1, 1], 0);
    doc.line(x + 48, yPos + 1.5, x + 65, yPos + 1.5);
    (doc as any).setLineDash([], 0);
    doc.text('Hari', x + 68, yPos + 0.5);
  };

  const colWidth = (width - marginX * 2) / 3;
  const cX1 = marginX + 5;
  const cX2 = marginX + 5 + colWidth;
  const cX3 = marginX + 5 + colWidth * 2;

  const isTahunan = data.jenis_cuti.toLowerCase().includes('tahunan');
  const isMelahirkan = data.jenis_cuti.toLowerCase().includes('melahirkan') && !data.jenis_cuti.toLowerCase().includes('istri');
  const isLiburUmum = data.jenis_cuti.toLowerCase().includes('umum');
  
  const isTidakDibayar = data.jenis_cuti.toLowerCase().includes('tidak dibayar') || data.jenis_cuti.toLowerCase().includes('unpaid');
  const isIstriMelahirkan = data.jenis_cuti.toLowerCase().includes('istri melahirkan');
  const isMingguan = data.jenis_cuti.toLowerCase().includes('mingguan');

  const isKematian = data.jenis_cuti.toLowerCase().includes('kematian');
  const isMenikah = data.jenis_cuti.toLowerCase().includes('menikah');
  const isKhusus = !isTahunan && !isMelahirkan && !isLiburUmum && !isTidakDibayar && !isIstriMelahirkan && !isMingguan && !isKematian && !isMenikah;

  drawCheckbox(cX1, y, 'Cuti Tahunan', isTahunan);
  drawCheckbox(cX2, y, 'Cuti Tidak Dibayar', isTidakDibayar);
  drawCheckbox(cX3, y, 'Cuti Kematian', isKematian);
  y += 10;
  
  drawCheckbox(cX1, y, 'Cuti Melahirkan', isMelahirkan);
  drawCheckbox(cX2, y, 'Cuti Istri Melahirkan', isIstriMelahirkan);
  drawCheckbox(cX3, y, 'Cuti Menikah', isMenikah);
  y += 10;
  
  drawCheckbox(cX1, y, 'Hari Libur Umum', isLiburUmum);
  drawCheckbox(cX2, y, 'Hari Libur mingguan', isMingguan);
  drawCheckbox(cX3, y, 'Cuti Khusus', isKhusus);

  y += 15;

  // -- 4. TABLES (SISA CUTI & TANDA TANGAN) --
  const tableY = y;
  const tableHeight = 40;
  
  const sisaWidth = 85;
  const signWidth = width - marginX * 2 - sisaWidth - 5; // 5mm gap
  
  const sisaX = marginX;
  const signX = marginX + sisaWidth + 5;

  // Headers bg
  doc.setFillColor(0, 0, 0);
  doc.rect(sisaX, tableY, sisaWidth, 8, 'F');
  doc.rect(signX, tableY, signWidth, 8, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('SISA CUTI TAHUNAN', sisaX + sisaWidth / 2, tableY + 5.5, { align: 'center' });
  doc.text('TANDA TANGAN', signX + signWidth / 2, tableY + 5.5, { align: 'center' });

  // Sisa Cuti Table Borders
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(sisaX, tableY + 8, sisaWidth, tableHeight);
  
  // Sisa Cols
  const s1 = 12; // Tahun
  const s2 = 22; // Sisa
  const s3 = 22; // Diambil
  const s4 = 29; // Setelah
  doc.line(sisaX + s1, tableY + 8, sisaX + s1, tableY + 8 + tableHeight - 8);
  doc.line(sisaX + s1 + s2, tableY + 8, sisaX + s1 + s2, tableY + 8 + tableHeight - 8);
  doc.line(sisaX + s1 + s2 + s3, tableY + 8, sisaX + s1 + s2 + s3, tableY + 8 + tableHeight - 8);
  
  // Sisa Header Text
  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.text('Tahun', sisaX + s1 / 2, tableY + 13, { align: 'center' });
  doc.text('Jumlah\nSisa Cuti', sisaX + s1 + s2 / 2, tableY + 12, { align: 'center' });
  doc.text('Jumlah\nYang Diambil', sisaX + s1 + s2 + s3 / 2, tableY + 12, { align: 'center' });
  doc.text('Jumlah Setelah\nDiambil', sisaX + s1 + s2 + s3 + s4 / 2, tableY + 12, { align: 'center' });
  
  // Sisa Horizontal lines
  doc.line(sisaX, tableY + 18, sisaX + sisaWidth, tableY + 18);
  doc.line(sisaX, tableY + 25, sisaX + sisaWidth, tableY + 25);
  doc.line(sisaX, tableY + 32, sisaX + sisaWidth, tableY + 32);
  doc.line(sisaX, tableY + 32, sisaX + sisaWidth, tableY + 32); // Footer Line
  
  // Note footer for Sisa Cuti
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Note : Wajib melampirkan data pendukung', sisaX + sisaWidth / 2, tableY + 37, { align: 'center' });

  // Sign Table Borders
  doc.rect(signX, tableY + 8, signWidth, tableHeight);
  
  const cols = 5;
  const scW = signWidth / cols;
  for (let i = 1; i < cols; i++) {
    doc.line(signX + scW * i, tableY + 8, signX + scW * i, tableY + 8 + tableHeight);
  }
  
  // Sign Headers
  doc.line(signX, tableY + 16, signX + signWidth, tableY + 16); // sub header text
  doc.line(signX, tableY + 22, signX + signWidth, tableY + 22); // date text
  
  const roles = ['Karyawan', 'Koordinator', 'Manager', 'Human Capital', 'Direktur'];
  doc.setFontSize(9);
  for (let i = 0; i < cols; i++) {
    doc.text(roles[i], signX + scW * i + scW / 2, tableY + 13, { align: 'center' });
    doc.text('...... / ...... / 20......', signX + scW * i + scW / 2, tableY + 20, { align: 'center' });
  }

  // Draw an outer border around everything
  const outerBoxY = 8;
  const outerBoxHeight = tableY + tableHeight + 5 - outerBoxY;
  doc.setLineWidth(0.8);
  doc.rect(6, outerBoxY, width - 12, outerBoxHeight);
  doc.rect(5, outerBoxY - 1, width - 10, outerBoxHeight + 2); // Double line effect

  // Save PDF
  doc.save(`Form_Cuti_${data.nama.replace(/\s+/g, '_')}_${data.tanggal_pengajuan.replace(/\//g, '')}.pdf`);
};

// Helper to fetch image and return Base64 Data URL so jsPDF can embed it
function fetchImageAsBase64(url: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}
