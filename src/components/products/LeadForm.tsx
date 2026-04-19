import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createLeadInApi, type CreateLeadInput } from '@/lib/leads-api';
import type { Product } from '@/types/product';
import type { LeadPreferredContact } from '@/types/lead';
import { getLocalizedProductTitle } from '@/utils/localization';

function createLeadSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(2, t('leadForm.validation.fullName')),
    phone: z.string().min(8, t('leadForm.validation.phone')),
    email: z.string().email(t('leadForm.validation.email')).optional().or(z.literal('')),
    message: z.string().min(10, t('leadForm.validation.message')),
    preferredContact: z.enum(['phone', 'whatsapp', 'email']),
  });
}

type LeadFormValues = z.infer<ReturnType<typeof createLeadSchema>>;

export default function LeadForm({ product }: { product: Product }) {
  const { i18n, t } = useTranslation();
  const localizedTitle = getLocalizedProductTitle(product, i18n.language);
  const leadSchema = useMemo(() => createLeadSchema(t), [t]);
  const defaultMessage = t('product.quoteDefaultMessage', { title: localizedTitle, id: product.id });

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      message: defaultMessage,
      preferredContact: 'phone',
    },
  });
  const preferredContact = useWatch({ control: form.control, name: 'preferredContact' }) ?? 'phone';

  const onSubmit = async (values: LeadFormValues) => {
    const lead: CreateLeadInput = {
      productId: product.id,
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      message: values.message,
      preferredContact: values.preferredContact as LeadPreferredContact,
      language: i18n.language,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    try {
      await createLeadInApi(lead);
      toast.success(t('leadForm.success'));
      form.reset({
        fullName: '',
        phone: '',
        email: '',
        message: defaultMessage,
        preferredContact: 'phone',
      });
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'leads_create_failed';
      toast.error(errorCode === 'invalid_lead_payload' ? t('leadForm.validation.generic') : t('leadForm.error'));
    }
  };

  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('leadForm.fullName')}</Label>
          <Input id="fullName" {...form.register('fullName')} />
          {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('leadForm.phone')}</Label>
          <Input id="phone" {...form.register('phone')} />
          {errors.phone ? <p className="text-sm text-red-500">{errors.phone.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">{t('leadForm.email')}</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>{t('leadForm.preferredContact')}</Label>
          <Select value={preferredContact} onValueChange={(value) => form.setValue('preferredContact', value as LeadPreferredContact)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('leadForm.preferredContactPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">{t('leadForm.contactOptions.phone')}</SelectItem>
              <SelectItem value="whatsapp">{t('leadForm.contactOptions.whatsapp')}</SelectItem>
              <SelectItem value="email">{t('leadForm.contactOptions.email')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.preferredContact ? <p className="text-sm text-red-500">{errors.preferredContact.message}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t('leadForm.message')}</Label>
        <Textarea id="message" rows={5} {...form.register('message')} />
        {errors.message ? <p className="text-sm text-red-500">{errors.message.message}</p> : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-70">
        {isSubmitting ? t('leadForm.submitting') : t('leadForm.submit')}
      </Button>
    </form>
  );
}
