export const dynamic = 'force-dynamic';

import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { TestimonialComponent } from '@gitroom/frontend/components/auth/testimonial.component';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';

const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="acadepost-auth-shell flex min-h-screen w-screen flex-1 gap-[12px] p-[12px]">
      <ReturnUrlComponent />
      <div className="acadepost-auth-panel flex flex-1 flex-col rounded-[12px] px-[22px] py-[40px] lg:w-[600px] lg:flex-none">
        <div className="mx-auto flex h-full w-full max-w-[440px] flex-col justify-center gap-[28px]">
          <LogoTextComponent />
          <div className="flex">{children}</div>
        </div>
      </div>
      <div className="acadepost-auth-hero hidden flex-1 flex-col justify-between overflow-hidden rounded-[12px] p-[44px] lg:flex">
        <div className="flex max-w-[760px] flex-col gap-5">
          <div className="acadepost-auth-kicker">AcadéNice x AcadéPost</div>
          <h2 className="max-w-[720px] text-[44px] font-[800] leading-tight">
            Préparez, routez et planifiez vos contenus sociaux depuis un seul
            espace.
          </h2>
          <p className="max-w-[620px] text-[16px] leading-7 text-white/70">
            Chaque équipe garde son projet, ses médias et son calendrier. Les
            accès restent séparés, même quand plusieurs groupes travaillent dans
            le même service.
          </p>
          <div className="grid max-w-[560px] grid-cols-3 gap-3 pt-3">
            <div className="acadepost-auth-stat p-4">
              <div className="text-[24px] font-[800] text-white">3</div>
              <div className="text-xs font-[700] uppercase">formats</div>
            </div>
            <div className="acadepost-auth-stat p-4">
              <div className="text-[24px] font-[800] text-white">8+</div>
              <div className="text-xs font-[700] uppercase">canaux</div>
            </div>
            <div className="acadepost-auth-stat p-4">
              <div className="text-[24px] font-[800] text-white">1</div>
              <div className="text-xs font-[700] uppercase">calendrier</div>
            </div>
          </div>
        </div>
        <TestimonialComponent />
      </div>
    </div>
  );
}
