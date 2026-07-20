import React from 'react';

type StatusType = 
  | 'HADIR' | 'DISETUJUI' | 'APPROVED' | 'SUCCESS' | 'AKTIF' | 'ACTIVE' // Positive
  | 'ALPHA' | 'DITOLAK' | 'REJECTED' | 'ERROR' | 'NONAKTIF' | 'INACTIVE' // Negative
  | 'IZIN' | 'PENDING' | 'INCOMPLETE' | 'WARNING' // Warning/Attention
  | 'SAKIT' // Sick/Orange
  | 'DEFAULT';

interface StatusBadgeProps {
  status: string;
  type?: StatusType | string;
  className?: string;
}

export default function StatusBadge({ status, type, className = '' }: StatusBadgeProps) {
  let variant = 'default';
  
  const normalizedStatus = (type || status).toUpperCase();
  
  if (['HADIR', 'DISETUJUI', 'APPROVED', 'SUCCESS', 'AKTIF', 'ACTIVE'].includes(normalizedStatus)) {
    variant = 'positive';
  } else if (['ALPHA', 'DITOLAK', 'REJECTED', 'ERROR', 'NONAKTIF', 'INACTIVE'].includes(normalizedStatus)) {
    variant = 'negative';
  } else if (['IZIN', 'PENDING', 'INCOMPLETE', 'WARNING'].includes(normalizedStatus)) {
    variant = 'warning';
  } else if (['SAKIT'].includes(normalizedStatus)) {
    variant = 'orange';
  }

  let styleClasses = '';
  switch (variant) {
    case 'positive':
      styleClasses = 'bg-green-50 text-green-700 border-green-200';
      break;
    case 'negative':
      styleClasses = 'bg-red-50 text-red-700 border-red-200';
      break;
    case 'warning':
      // Brand Gold (#EFC94B) accent with Navy (#394887) text for warning/attention
      styleClasses = 'bg-[#FDF8E7] text-[#394887] border-[#EFC94B]';
      break;
    case 'orange':
      // Orange specifically for SAKIT
      styleClasses = 'bg-orange-50 text-orange-700 border-orange-200';
      break;
    default:
      // Navy default for other generic statuses
      styleClasses = 'bg-[#F4F6FB] text-[#394887] border-[#D1D9F0]';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${styleClasses} ${className}`}>
      {status}
    </span>
  );
}
