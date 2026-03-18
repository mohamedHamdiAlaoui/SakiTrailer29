import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSeo } from '@/hooks/use-seo';
import { sendPasswordResetEmailFirebase } from '@/lib/firebase-client';
import { getAbsoluteSiteUrl } from '@/lib/site';

const resetSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [isSuccess, setIsSuccess] = useState(false);

  useSeo('Forgot password | SakiTrailer29', 'Reset your password to recover access to your SakiTrailer29 account.', {
    canonical: getAbsoluteSiteUrl('/forgot-password'),
    noIndex: true,
  });

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ResetFormValues) => {
    try {
      await sendPasswordResetEmailFirebase(values.email);
      setIsSuccess(true);
      toast.success(t('auth.resetPassword.successToast', 'Password reset email sent.'));
    } catch {
      toast.error(t('auth.resetPassword.errorToast', 'There was a problem sending the reset email.'));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border-0 shadow-2xl">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-brand-blue/10">
            <Mail className="size-7 text-brand-blue" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight text-brand-blue">
              {t('auth.resetPassword.title', 'Forgot your password?')}
            </CardTitle>
            <CardDescription className="text-base">
              {t(
                'auth.resetPassword.description',
                'Enter your email address and we will send you a password reset link.'
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isSuccess ? (
            <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/10 p-4 text-center">
              <p className="font-medium text-brand-blue">
                {t(
                  'auth.resetPassword.successMessage',
                  'Check your inbox and spam folder. A reset email has been sent.'
                )}
              </p>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('auth.login.fields.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-12 rounded-xl"
                  {...form.register('email')}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm font-medium text-red-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-brand-blue text-base font-medium text-white hover:bg-brand-blue/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? t('auth.resetPassword.submitting', 'Sending...')
                  : t('auth.resetPassword.submit', 'Send reset link')}
              </Button>
            </form>
          )}

          <div className="flex justify-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-blue"
            >
              <ArrowLeft className="size-4" />
              {t('auth.resetPassword.backToLogin', 'Back to login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
