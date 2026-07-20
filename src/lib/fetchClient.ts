let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  // Kalau ada refresh yang lagi jalan, request lain numpang nunggu hasil yang sama
  // — bukan masing-masing manggil /api/auth/refresh sendiri-sendiri
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch('/api/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status !== 401) {
    return res;
  }

  // Access token kemungkinan expired — coba refresh sekali
  const refreshed = await refreshSession();

  if (!refreshed) {
    // Refresh token juga sudah invalid/revoked — beneran harus login ulang
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return res;
  }

  // Refresh berhasil, ulangi request asli SEKALI (jangan retry berkali-kali)
  return fetch(input, init);
}