import { headers } from 'next/headers'

export type SessionData = {
  userId: string | null;
  userRole: string | null;
  kampusId: string | null;
  subdomain: string | null;
}

export async function getSession(): Promise<SessionData> {
  const headersList = await headers();
  
  return {
    userId: headersList.get('x-user-id'),
    userRole: headersList.get('x-user-role'),
    kampusId: headersList.get('x-kampus-id'),
    subdomain: headersList.get('x-subdomain')
  };
}
