import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useSeo } from '@/hooks/use-seo';
import { getAbsoluteSiteUrl } from '@/lib/site';

function createLoginSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('auth.login.validation.email')),
    password: z.string().min(6, t('auth.login.validation.password')),
  });
}

type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export default function Login() {
  const { t } = useTranslation();
  const [authError, setAuthError] = useState('');
  const isGoogleAuthDebugEnabled = import.meta.env.DEV;

  useSeo(t('auth.login.seoTitle'), t('auth.login.seoDescription'), {
    keywords: 'login trailer dealership morocco, account access, saki trailer',
    canonical: getAbsoluteSiteUrl('/login'),
    noIndex: true,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();
  const loginSchema = createLoginSchema(t);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError('');
    const result = await login(values);

    if (!result.success) {
      if (result.error === 'email_not_verified') {
        const msg = "Please verify your email address before logging in.";
        setAuthError(msg);
        toast.error(msg, { duration: 10000 });
        return;
      }
      const message = result.error === 'invalid_credentials' ? t('auth.login.invalidCredentials') : t('auth.login.failed');
      setAuthError(message);
      toast.error(message);
      return;
    }

    toast.success(t('auth.login.success'));
    navigate(redirectTo, { replace: true });
  };

  const onGoogleLogin = async () => {
    if (isGoogleAuthDebugEnabled) {
      console.info('[auth][google][login] button clicked');
    }

    const result = await loginWithGoogle();
    if (!result.success) {
      if (isGoogleAuthDebugEnabled) {
        console.info('[auth][google][login] flow finished with error', {
          error: result.error,
        });
      }

      let message = t('auth.login.failed');

      if (result.error === 'firebase_not_configured') {
        message = t('auth.common.googleNotConfigured');
      } else if (result.error === 'auth/popup-closed-by-user' || result.error === 'auth/cancelled-popup-request') {
        message = t('auth.common.googleCancelled');
      } else if (result.error === 'auth/popup-blocked') {
        message = t('auth.common.googlePopupBlocked');
      } else if (result.error === 'auth/unauthorized-domain') {
        message = t('auth.common.googleUnauthorizedDomain');
      } else if (result.error === 'firebase_admin_not_configured' || result.error === 'firebase_admin_init_failed') {
        message = t('auth.common.googleBackendNotConfigured');
      } else if (result.error === 'invalid_id_token') {
        message = t('auth.common.googleTokenInvalid');
      }

      setAuthError(message);
      toast.error(message);
      return;
    }

    if (isGoogleAuthDebugEnabled) {
      console.info('[auth][google][login] flow completed successfully');
    }

    setAuthError('');
    toast.success(t('auth.common.googleSuccess'));
    navigate(redirectTo, { replace: true });
  };

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto px-4 pb-20">
        <div className="mx-auto max-w-md">
          <h1 className="sr-only">{t('auth.login.title')}</h1>
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">{t('auth.login.title')}</CardTitle>
              <CardDescription>{t('auth.login.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input id="email" type="email" {...form.register('email')} />
                  {form.formState.errors.email ? <p className="text-sm text-red-500">{form.formState.errors.email.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.common.password')}</Label>
                  <Input id="password" type="password" {...form.register('password')} />
                  {form.formState.errors.password ? <p className="text-sm text-red-500">{form.formState.errors.password.message}</p> : null}
                </div>

                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-brand-blue underline-offset-4 hover:underline"
                >
                  {t('auth.login.forgotPassword')}
                </Link>

                {authError ? <p className="text-sm text-red-500">{authError}</p> : null}

                <Button type="submit" className="w-full bg-brand-blue text-white hover:bg-brand-blue/90" disabled={form.formState.isSubmitting}>
                  {t('auth.login.submit')}
                </Button>
              </form>

              <div className="space-y-3">
                <p className="text-center text-sm text-slate-500">{t('auth.common.socialDivider')}</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button type="button" variant="outline" className="relative" onClick={onGoogleLogin}>
                    <svg className="absolute left-4 h-5 w-5" viewBox="0 0 24 24">
                      <title>Google</title>
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {t('auth.common.continueWithGoogle')}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                {t('auth.login.noAccount')}{' '}
                <Link to="/signup" className="font-semibold text-brand-blue">
                  {t('auth.login.createAccount')}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
