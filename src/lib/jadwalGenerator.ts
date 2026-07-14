import prisma from "@/lib/prisma";

const daysMap = {
  "MINGGU": 0,
  "SENIN": 1,
  "SELASA": 2,
  "RABU": 3,
  "KAMIS": 4,
  "JUMAT": 5,
  "SABTU": 6
};

export async function generateJadwalSesi(templateId: string) {
  const template = await prisma.jadwalTemplate.findUnique({
    where: { id: templateId }
  });
  
  if (!template) throw new Error("Template not found");

  const targetDay = daysMap[template.hari as keyof typeof daysMap];
  
  // Set ke jam 00:00:00 untuk hindari masalah zona waktu saat komparasi tanggal
  let currentDate = new Date(template.berlakuMulai);
  currentDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(template.berlakuSampai);
  endDate.setHours(23, 59, 59, 999);
  
  // Cari kemunculan pertama hari yang sesuai dalam rentang tanggal
  while (currentDate.getDay() !== targetDay) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let pertemuanKe = 1;
  let countGenerated = 0;

  while (currentDate <= endDate) {
    // Cek idempotency: apakah sesi ini sudah ada?
    const existing = await prisma.jadwalSesi.findFirst({
      where: {
        jadwalTemplateId: template.id,
        pertemuanKe: pertemuanKe
      }
    });

    if (!existing) {
      await prisma.jadwalSesi.create({
        data: {
          jadwalTemplateId: template.id,
          pertemuanKe: pertemuanKe,
          tanggal: new Date(currentDate), // clone
          jamMulai: template.jamMulai,
          jamSelesai: template.jamSelesai,
          status: "SCHEDULED"
        }
      });
      countGenerated++;
    }
    
    // Lompat 7 hari untuk pertemuan berikutnya
    currentDate.setDate(currentDate.getDate() + 7);
    pertemuanKe++;
  }
  
  return countGenerated;
}
