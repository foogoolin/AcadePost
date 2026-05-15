'use client';
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import Link from 'next/link';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import { useMemo, useState } from 'react';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { ForgotReturnPasswordDto } from '@gitroom/nestjs-libraries/dtos/auth/forgot-return.password.dto';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
type Inputs = {
  password: string;
  repeatPassword: string;
  token: string;
};
export function ForgotReturn({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const t = useT();
  const [state, setState] = useState(false);
  const resolver = useMemo(() => {
    return classValidatorResolver(ForgotReturnPasswordDto);
  }, []);
  const form = useForm<Inputs>({
    resolver,
    mode: 'onChange',
    defaultValues: {
      token,
    },
  });
  const fetchData = useFetch();
  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setLoading(true);
    const { reset } = await (
      await fetchData('/auth/forgot-return', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
        }),
      })
    ).json();
    setState(true);
    if (!reset) {
      form.setError('password', {
        type: 'manual',
        message: t(
          'password_reset_link_expired',
          'Votre lien de réinitialisation a expiré. Veuillez réessayer.'
        ),
      });
      return false;
    }
    setLoading(false);
  };
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <h1 className="acadepost-auth-heading text-3xl text-start mb-4 cursor-pointer">
            {t('forgot_password_1', 'Mot de passe oublié')}
          </h1>
        </div>
        {!state ? (
          <>
            <div className="space-y-4 text-textColor">
              <Input
                label="Nouveau mot de passe"
                translationKey="label_new_password"
                {...form.register('password')}
                type="password"
                placeholder={t('label_password', 'Mot de passe')}
              />
              <Input
                label="Répéter le mot de passe"
                translationKey="label_repeat_password"
                {...form.register('repeatPassword')}
                type="password"
                placeholder={t(
                  'label_repeat_password',
                  'Répéter le mot de passe'
                )}
              />
            </div>
            <div className="text-center mt-6">
              <div className="w-full flex">
                <Button type="submit" className="flex-1" loading={loading}>
                  {t('change_password', 'Changer le mot de passe')}
                </Button>
              </div>
              <p className="mt-4 text-sm">
                <Link
                  href="/auth/login"
                  className="acadepost-auth-link cursor-pointer"
                >
                  {t('go_back_to_login', 'Retour à la connexion')}
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="text-start mt-6">
              {t(
                'we_successfully_reset_your_password_you_can_now_login_with_your',
                'Votre mot de passe a bien été réinitialisé. Vous pouvez maintenant vous connecter.'
              )}
            </div>
            <p className="mt-4 text-sm">
              <Link
                href="/auth/login"
                className="acadepost-auth-link cursor-pointer"
              >
                {t('go_back_to_login', 'Retour à la connexion')}
              </Link>
            </p>
          </>
        )}
      </form>
    </FormProvider>
  );
}
