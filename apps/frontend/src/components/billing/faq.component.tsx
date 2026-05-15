'use client';

import { FC, useCallback, useState } from 'react';
import clsx from 'clsx';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
const useFaqList = () => {
  const { isGeneral } = useVariables();
  const user = useUser();
  const t = useT();
  return [
    ...(user?.allowTrial
      ? [
          {
            title: t(
              'faq_am_i_going_to_be_charged_by_acadepost',
              'Vais-je être facturé par AcadéPost ?'
            ),
            description: t(
              'faq_to_confirm_credit_card_information_acadepost_will_hold',
              'Pour confirmer la carte bancaire, AcadéPost peut réserver 2 $ puis les libérer immédiatement. Vous pouvez annuler depuis les paramètres.'
            ),
          },
        ]
      : []),
    {
      title: t(
        'faq_can_i_trust_acadepost',
        `Puis-je faire confiance à ${isGeneral ? 'AcadéPost' : 'AcadéPost'} ?`
      ),
      description: t(
        'faq_acadepost_is_proudly_open_source',
        `${
          isGeneral ? 'AcadéPost' : 'AcadéPost'
        } est basé sur une culture ouverte et transparente. ${
          isGeneral ? 'AcadéPost' : 'AcadéPost'
        } peut être audité et adapté pour les besoins du projet. Pour voir le dépôt, <a href="https://github.com/foogoolin/AcadePost" target="_blank" style="text-decoration: underline;">cliquez ici</a>.`
      ),
    },
    {
      title: t('faq_what_are_channels', 'Que sont les canaux ?'),
      description: t(
        'faq_acadepost_allows_you_to_schedule_posts',
        `${
          isGeneral ? 'AcadéPost' : 'AcadéPost'
        } permet de planifier vos publications sur plusieurs canaux.
Un canal est une plateforme de publication reliée à votre projet.
Par exemple : X, Facebook, Instagram, TikTok, YouTube, Reddit, LinkedIn, Dribbble, Threads ou Pinterest.`
      ),
    },
    {
      title: t('faq_what_are_team_members', 'Que sont les membres d’équipe ?'),
      description: t(
        'faq_if_you_have_a_team_with_multiple_members',
        'Vous pouvez inviter plusieurs membres dans un projet pour collaborer sur les publications et gérer les canaux autorisés.'
      ),
    },
  ];
};
export const FAQSection: FC<{
  title: string;
  description: string;
}> = (props) => {
  const { title, description } = props;
  const [show, setShow] = useState(false);
  const changeShow = useCallback(() => {
    setShow(!show);
  }, [show]);
  return (
    <div
      className="bg-sixth p-[24px] border border-tableBorder rounded-[8px] flex flex-col"
      onClick={changeShow}
    >
      <div className={`text-[20px] cursor-pointer flex justify-center`}>
        <div className="flex-1">{title}</div>
        <div className="flex items-center justify-center w-[32px]">
          {!show ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M18 12.75H6C5.59 12.75 5.25 12.41 5.25 12C5.25 11.59 5.59 11.25 6 11.25H18C18.41 11.25 18.75 11.59 18.75 12C18.75 12.41 18.41 12.75 18 12.75Z"
                fill="white"
              />
              <path
                d="M12 18.75C11.59 18.75 11.25 18.41 11.25 18V6C11.25 5.59 11.59 5.25 12 5.25C12.41 5.25 12.75 5.59 12.75 6V18C12.75 18.41 12.41 18.75 12 18.75Z"
                fill="white"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M24 17H8C7.45333 17 7 16.5467 7 16C7 15.4533 7.45333 15 8 15H24C24.5467 15 25 15.4533 25 16C25 16.5467 24.5467 17 24 17Z"
                fill="#ECECEC"
              />
            </svg>
          )}
        </div>
      </div>
      <div
        className={clsx(
          'transition-all duration-500 overflow-hidden',
          !show ? 'max-h-[0]' : 'max-h-[500px]'
        )}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={`mt-[16px] w-full text-wrap font-[400] text-[16px] text-customColor17 select-text max-w-[450px]`}
          dangerouslySetInnerHTML={{
            __html: description,
          }}
        />
      </div>
    </div>
  );
};
export const FAQComponent: FC = () => {
  const t = useT();
  const list = useFaqList();
  return (
    <div>
      {/*<h3 className="text-[24px] mt-[48px] mb-[40px] tablet:mt-[80px]">*/}
      {/*  {t('frequently_asked_questions', 'Frequently Asked Questions')}*/}
      {/*</h3>*/}
      <div className="gap-[24px] flex-col flex select-none  mt-[48px] mb-[40px] tablet:mt-[80px]">
        {list.map((item, index) => (
          <FAQSection key={index} {...item} />
        ))}
      </div>
    </div>
  );
};
