export function getDeviceId(): string {
  const KEY = 'device_id';
  let deviceId = localStorage.getItem(KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(KEY, deviceId);
  }

  return deviceId;
}