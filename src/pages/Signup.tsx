import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
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

function createSignupSchema(t: TFunction) {
  return z
    .object({
      fullName: z.string().min(2, t('auth.signup.validation.fullName')),
      companyName: z.string().optional(),
      email: z.string().email(t('auth.signup.validation.email')),
      password: z.string().min(6, t('auth.signup.validation.password')),
      confirmPassword: z.string().min(6, t('auth.signup.validation.confirmPassword')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('auth.signup.validation.passwordMatch'),
    });
}

type SignupFormValues = z.infer<ReturnType<typeof createSignupSchema>>;

export default function Signup() {
  const { t } = useTranslation();
  const [authError, setAuthError] = useState('');
  const isGoogleAuthDebugEnabled = import.meta.env.DEV;

  useSeo(t('auth.signup.seoTitle'), t('auth.signup.seoDescription'), {
    keywords: 'signup trailer dealership morocco, create account, used vehicles',
    canonical: getAbsoluteSiteUrl('/signup'),
    noIndex: true,
  });

  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const signupSchema = createSignupSchema(t);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setAuthError('');
    const result = await signup({
      fullName: values.fullName,
      companyName: values.companyName || undefined,
      email: values.email,
      password: values.password,
    });

    if (!result.success) {
      const message = result.error === 'email_exists' ? t('auth.signup.emailExists') : t('auth.signup.failed');
      setAuthError(message);
      toast.error(message);
      return;
    }

    toast.success("Account created! Please check your email to verify your account before logging in.", { duration: 10000 });
    navigate('/login', { replace: true });
  };

  const onGoogleSignup = async () => {
    if (isGoogleAuthDebugEnabled) {
      console.info('[auth][google][signup] button clicked');
    }

    const result = await loginWithGoogle();
    if (!result.success) {
      if (isGoogleAuthDebugEnabled) {
        console.info('[auth][google][signup] flow finished with error', {
          error: result.error,
        });
      }

      let message = t('auth.signup.failed');

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
      console.info('[auth][google][signup] flow completed successfully');
    }

    setAuthError('');
    toast.success(t('auth.common.googleSuccess'));
    navigate('/', { replace: true });
  };

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto px-4 pb-20">
        <div className="mx-auto max-w-md">
          <h1 className="sr-only">{t('auth.signup.title')}</h1>
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl">{t('auth.signup.title')}</CardTitle>
              <CardDescription>{t('auth.signup.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('leadForm.fullName')}</Label>
                  <Input id="fullName" {...form.register('fullName')} />
                  {form.formState.errors.fullName ? <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name (Optional)</Label>
                  <Input id="companyName" {...form.register('companyName')} />
                  {form.formState.errors.companyName ? <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p> : null}
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.signup.confirmPassword')}</Label>
                  <Input id="confirmPassword" type="password" {...form.register('confirmPassword')} />
                  {form.formState.errors.confirmPassword ? (
                    <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                  ) : null}
                </div>

                {authError ? <p className="text-sm text-red-500">{authError}</p> : null}

                <Button type="submit" className="w-full bg-brand-blue text-white hover:bg-brand-blue/90" disabled={form.formState.isSubmitting}>
                  {t('auth.signup.submit')}
                </Button>
              </form>

              <div className="space-y-3">
                <p className="text-center text-sm text-slate-500">{t('auth.common.socialDivider')}</p>
                <div className="grid grid-cols-1 gap-3">
                  <Button type="button" variant="outline" className="relative" onClick={onGoogleSignup}>
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
                {t('auth.signup.haveAccount')}{' '}
                <Link to="/login" className="font-semibold text-brand-blue">
                  {t('auth.signup.login')}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
