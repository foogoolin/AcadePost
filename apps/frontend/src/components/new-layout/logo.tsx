'use client';

import Link from 'next/link';

export const Logo = () => {
  return (
    <Link
      href="/launches"
      aria-label="Retour au calendrier"
      className="inline-flex"
    >
      <img
        src="/brand/acadepost-logo.png"
        alt="AcadéPost"
        className="acadepost-sidebar-logo mt-[8px] h-[52px] w-[52px] min-w-[52px] object-contain"
      />
    </Link>
  );
};
