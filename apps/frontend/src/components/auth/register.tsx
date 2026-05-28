'use client';

import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { CreateOrgUserDto } from '@gitroom/nestjs-libraries/dtos/auth/create.org.user.dto';
import { GithubProvider } from '@gitroom/frontend/components/auth/providers/github.provider';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import clsx from 'clsx';
import { OauthProvider } from '@gitroom/frontend/components/auth/providers/oauth.provider';
import { useFireEvents } from '@gitroom/helpers/utils/use.fire.events';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useTrack } from '@gitroom/react/helpers/use.track';
import { TrackEnum } from '@gitroom/nestjs-libraries/user/track.enum';
import { FarcasterProvider } from '@gitroom/frontend/components/auth/providers/farcaster.provider';
import dynamic from 'next/dynamic';
import { WalletUiProvider } from '@gitroom/frontend/components/auth/providers/placeholder/wallet.ui.provider';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import useCookie from 'react-use-cookie';
const WalletProvider = dynamic(
  () => import('@gitroom/frontend/components/auth/providers/wallet.provider'),
  {
    ssr: false,
    loading: () => <WalletUiProvider />,
  }
);
type Inputs = {
  email: string;
  password: string;
  providerToken: string;
  provider: string;
};
export function Register() {
  const getQuery = useSearchParams();
  const fetch = useFetch();
  const [provider] = useState(getQuery?.get('provider')?.toUpperCase());
  const [code, setCode] = useState(getQuery?.get('code') || '');
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (provider && code) {
      load();
    }
  }, []);
  const load = useCallback(async () => {
    const { token } = await (
      await fetch(`/auth/oauth/${provider?.toUpperCase() || 'LOCAL'}/exists`, {
        method: 'POST',
        body: JSON.stringify({
          code,
        }),
      })
    ).json();
    if (token) {
      setCode(token);
      setShow(true);
    }
  }, [provider, code]);
  if (!code && !provider) {
    return <RegisterAfter token="" provider="LOCAL" />;
  }
  if (!show) {
    return <LoadingComponent />;
  }
  return (
    <RegisterAfter token={code} provider={provider?.toUpperCase() || 'LOCAL'} />
  );
}
function getHelpfulReasonForRegistrationFailure(httpCode: number) {
  switch (httpCode) {
    case 400:
      return 'Cet email existe déjà';
    case 404:
      return "Votre navigateur a reçu une erreur 404 en contactant l'API. Vérifiez NEXT_PUBLIC_BACKEND_URL et le backend.";
  }
  return 'Erreur non gérée : ' + httpCode;
}
export function RegisterAfter({
  token,
  provider,
}: {
  token: string;
  provider: string;
}) {
  const t = useT();
  const { isGeneral, genericOauth, neynarClientId, billingEnabled } =
    useVariables();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const fireEvents = useFireEvents();
  const track = useTrack();
  const [datafast_visitor_id] = useCookie('datafast_visitor_id');
  const isAfterProvider = useMemo(() => {
    return !!token && !!provider;
  }, [token, provider]);
  const resolver = useMemo(() => {
    return classValidatorResolver(CreateOrgUserDto);
  }, []);
  const showGenericOauth = !isAfterProvider && isGeneral && genericOauth;
  const showGithubOauth = !isAfterProvider && !isGeneral;
  const showFarcaster = !isAfterProvider && isGeneral && !!neynarClientId;
  const showWallet = !isAfterProvider && isGeneral && billingEnabled;
  const hasSocialRegistration =
    showGenericOauth || showGithubOauth || showFarcaster || showWallet;
  const form = useForm<Inputs>({
    resolver,
    defaultValues: {
      providerToken: token,
      provider: provider,
    },
  });
  const fetchData = useFetch();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    await fetchData('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        datafast_visitor_id,
      }),
    })
      .then(async (response) => {
        setLoading(false);
        if (response.status === 200) {
          fireEvents('register');
          return track(TrackEnum.CompleteRegistration).then(() => {
            if (response.headers.get('activate') === 'true') {
              router.push('/auth/activate');
            } else {
              router.push('/auth/login');
            }
          });
        } else {
          form.setError('email', {
            message: await response.text(),
          });
        }
      })
      .catch((e) => {
        form.setError('email', {
          message:
            'Erreur générale : ' +
            e.toString() +
            '. Vérifiez la console du navigateur.',
        });
      });
  };
  return (
    <FormProvider {...form}>
      <form className="flex-1 flex" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col flex-1">
          <div>
            <h1 className="acadepost-auth-heading text-[40px] text-start cursor-pointer">
              {t('sign_up', 'Créer un compte')}
            </h1>
          </div>
          <div className="flex flex-col">
            {hasSocialRegistration && (
              <>
                <div className="text-[14px] mt-[32px] mb-[12px] font-[700]">
                  {t('continue_with', 'Continuer avec')}
                </div>
                {showGithubOauth ? (
                  <GithubProvider />
                ) : showGenericOauth ? (
                  <OauthProvider />
                ) : (
                  <div className="gap-[8px] flex">
                    {showFarcaster && <FarcasterProvider />}
                    {showWallet && <WalletProvider />}
                  </div>
                )}
                <div className="h-[20px] mb-[24px] mt-[24px] relative">
                  <div className="absolute w-full h-[1px] bg-fifth top-[50%] -translate-y-[50%]" />
                  <div
                    className={`absolute z-[1] justify-center items-center w-full start-0 -top-[4px] flex`}
                  >
                    <div className="acadepost-auth-divider px-[16px]">
                      {t('or', 'ou')}
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="flex flex-col gap-[12px]">
              <div className="text-textColor">
                {!isAfterProvider && (
                  <>
                    <Input
                      label="Email"
                      translationKey="label_email"
                      {...form.register('email')}
                      type="email"
                      placeholder={t('email_address', 'Adresse email')}
                    />
                    <Input
                      label="Password"
                      translationKey="label_password"
                      {...form.register('password')}
                      autoComplete="off"
                      type="password"
                      placeholder={t('label_password', 'Mot de passe')}
                    />
                  </>
                )}
              </div>
              <div className={clsx('text-[12px]')}>
                {t(
                  'by_registering_you_agree_to_our',
                  'En créant un compte, vous acceptez nos'
                )}
                &nbsp;
                <a
                  href={`https://acadepost.com/terms`}
                  className="acadepost-auth-link"
                  rel="nofollow"
                >
                  {t('terms_of_service', "conditions d'utilisation")}
                </a>
                &nbsp;
                {t('and', 'et')}&nbsp;
                <a
                  href={`https://acadepost.com/privacy`}
                  rel="nofollow"
                  className="acadepost-auth-link"
                >
                  {t('privacy_policy', 'politique de confidentialité')}
                </a>
                &nbsp;
              </div>
              <div className="text-center mt-6">
                <div className="w-full flex">
                  <Button
                    type="submit"
                    className="flex-1 rounded-[10px] !h-[52px]"
                    loading={loading}
                  >
                    {t('create_account', 'Créer le compte')}
                  </Button>
                </div>
                <p className="mt-4 text-sm">
                  {t('already_have_an_account', 'Vous avez déjà un compte ?')}
                  &nbsp;
                  <Link
                    href="/auth/login"
                    className="acadepost-auth-link cursor-pointer"
                  >
                    {t('sign_in', 'Se connecter')}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
