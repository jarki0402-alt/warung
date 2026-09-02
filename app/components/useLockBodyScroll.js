'use client';

import { useEffect } from 'react';

// Mengunci scroll halaman di belakang selagi sheet/modal terbuka. Tanpa ini, di HP
// (khususnya Safari/Chrome mobile) halaman belakang tetap bisa ikut discroll walau
// ketutup overlay — itu yang bikin address bar browser muncul/hilang saat scroll dan
// sheet-nya kelihatan "melayang"/tidak nempel sempurna ke bawah layar. Posisi scroll
// disimpan & dikembalikan persis begitu sheet ditutup.
export default function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}
