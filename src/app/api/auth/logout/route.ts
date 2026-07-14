import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, data: null });
  response.cookies.delete('session_token');
  return response;
}
