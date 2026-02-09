"use client";

import React from "react";

export const HeaderIcons = {
  Hamburger: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="24" height="24" fill="currentColor" className={className}>
      <path d="M 3 9 A 1.0001 1.0001 0 1 0 3 11 L 47 11 A 1.0001 1.0001 0 1 0 47 9 L 3 9 z M 3 24 A 1.0001 1.0001 0 1 0 3 26 L 47 26 A 1.0001 1.0001 0 1 0 47 24 L 3 24 z M 3 39 A 1.0001 1.0001 0 1 0 3 41 L 47 41 A 1.0001 1.0001 0 1 0 47 39 L 3 39 z" />
    </svg>
  ),
  Search: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Cart: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7.5 7.67001V6.70001C7.5 4.45001 9.31 2.24001 11.56 2.03001C14.24 1.77001 16.5 3.88001 16.5 6.51001V7.89001" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.00001 22H15C19.02 22 19.74 20.39 19.95 18.43L20.7 12.43C20.97 9.99 20.27 8 16 8H8.00001C3.73001 8 3.03001 9.99 3.30001 12.43L4.05001 18.43C4.26001 20.39 4.98001 22 9.00001 22Z" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Compare: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3.58008 5.15991H17.4201C19.0801 5.15991 20.4201 6.49991 20.4201 8.15991V11.4799" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.74008 2L3.58008 5.15997L6.74008 8.32001" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.4201 18.84H6.58008C4.92008 18.84 3.58008 17.5 3.58008 15.84V12.52" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.26 21.9999L20.42 18.84L17.26 15.6799" stroke="currentColor" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Heart: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.68998C2 5.59998 4.49 3.09998 7.56 3.09998C9.38 3.09998 10.99 3.97998 12 5.33998C13.01 3.97998 14.63 3.09998 16.44 3.09998C19.51 3.09998 22 5.59998 22 8.68998C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Chat: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 10H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Phone: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 16.92V20.02C22 20.57 21.54 21.03 20.99 20.98C18.5 20.72 16.11 19.91 14 18.64C12.03 17.47 10.21 15.8 8.64 13.76C7.36 11.66 6.55 9.27 6.29 6.78C6.24 6.23 6.7 5.77 7.25 5.77H10.35C10.86 5.77 11.29 6.14 11.35 6.64C11.47 7.59 11.72 8.51 12.09 9.38C12.23 9.71 12.15 10.1 11.89 10.36L10.64 11.61C12.09 14.18 14.21 16.3 16.78 17.75L18.03 16.5C18.29 16.24 18.68 16.16 19.01 16.3C19.88 16.67 20.8 16.92 21.75 17.04C22.25 17.1 22.62 17.53 22.62 18.04" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Box: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 8L12 13L3 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 16L12 21L3 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 8V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M3 8V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 3L21 8L12 13L3 8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  WhatsApp: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 11.6C20 16.19 16.42 19.9 12 19.9C10.65 19.9 9.38 19.55 8.27 18.94L4 20L5.12 16.02C4.4 14.89 4 13.55 4 12.1C4 7.51 7.58 3.8 12 3.8C16.42 3.8 20 7.01 20 11.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10.3 9.2C10.1 9 9.8 9 9.6 9.1C9.3 9.3 8.9 9.8 8.9 10.5C8.9 11.8 10 13.6 11.8 15C13.3 16.2 14.8 16.6 15.7 16.3C16 16.2 16.2 15.9 16.3 15.6L16.4 15.1C16.4 14.9 16.3 14.7 16.1 14.6L14.9 14C14.7 13.9 14.5 13.9 14.3 14L13.9 14.2C13.7 14.3 13.5 14.3 13.3 14.2C12.6 13.8 12 13.3 11.4 12.7C10.9 12.1 10.5 11.4 10.2 10.7C10.1 10.5 10.1 10.3 10.2 10.1L10.4 9.7C10.5 9.5 10.5 9.3 10.3 9.2Z" fill="currentColor" />
    </svg>
  ),
  User: ({ className = "" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20C4.8 16.8 8 14.5 12 14.5C16 14.5 19.2 16.8 20 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};
