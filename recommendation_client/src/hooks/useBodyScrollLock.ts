'use client';

import { useEffect } from 'react';

let activeScrollLocks = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let originalBodyOverscrollBehavior = '';
let originalHtmlOverflow = '';
let originalHtmlOverscrollBehavior = '';

const lockBodyScroll = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const { body, documentElement } = document;

  if (activeScrollLocks === 0) {
    originalBodyOverflow = body.style.overflow;
    originalBodyPaddingRight = body.style.paddingRight;
    originalBodyOverscrollBehavior = body.style.overscrollBehavior;
    originalHtmlOverflow = documentElement.style.overflow;
    originalHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
    documentElement.style.overflow = 'hidden';
    documentElement.style.overscrollBehavior = 'none';

    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  activeScrollLocks += 1;
};

const unlockBodyScroll = () => {
  if (typeof window === 'undefined' || activeScrollLocks === 0) {
    return;
  }

  activeScrollLocks -= 1;

  if (activeScrollLocks > 0) {
    return;
  }

  const { body, documentElement } = document;

  body.style.overflow = originalBodyOverflow;
  body.style.paddingRight = originalBodyPaddingRight;
  body.style.overscrollBehavior = originalBodyOverscrollBehavior;
  documentElement.style.overflow = originalHtmlOverflow;
  documentElement.style.overscrollBehavior = originalHtmlOverscrollBehavior;
};

export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) {
      return;
    }

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [locked]);
};
