/**
 * Menghitung jarak antara dua koordinat menggunakan formula Haversine.
 * Hasilnya dalam satuan meter.
 *
 * @param lat1 Latitude titik 1 (misal: Mahasiswa)
 * @param lon1 Longitude titik 1
 * @param lat2 Latitude titik 2 (misal: Kampus)
 * @param lon2 Longitude titik 2
 * @returns Jarak dalam meter
 */
export function hitungJarakMeter(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Jarak dalam meter
}
