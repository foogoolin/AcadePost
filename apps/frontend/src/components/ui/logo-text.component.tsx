import React from 'react';

export const LogoTextComponent = () => {
  return (
    <div className="acadepost-wordmark flex items-center gap-3 text-[20px] font-semibold leading-none text-textColor">
      <img
        src="/brand/acadepost-logo.png"
        alt="AcadéPost"
        className="h-8 w-8 object-contain"
      />
      <span>AcadéPost</span>
    </div>
  );
};
