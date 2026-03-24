import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createLeadInApi, type CreateLeadInput } from '@/lib/leads-api';
import type { LeadPreferredContact } from '@/types/lead';

function createVisitSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(2, t('leadForm.validation.fullName')),
    phone: z.string().min(8, t('leadForm.validation.phone')),
    email: z.string().email(t('leadForm.validation.email')).optional().or(z.literal('')),
    preferredContact: z.enum(['phone', 'whatsapp', 'email']),
    preferredDate: z.string().min(1, t('showroom.visitForm.validation.preferredDate')),
    message: z.string().min(10, t('leadForm.validation.message')),
  });
}

type VisitFormValues = z.infer<ReturnType<typeof createVisitSchema>>;

function buildGoogleCalendarUrl(input: {
  fullName?: string;
  preferredDate?: string;
  preferredContact?: LeadPreferredContact;
  phone?: string;
  email?: string;
  message?: string;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  if (!input.preferredDate) {
    return '';
  }

  const startDate = new Date(`${input.preferredDate}T10:00:00`);
  const endDate = new Date(`${input.preferredDate}T11:00:00`);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };

  const details = [
    input.t('showroom.visitForm.calendarIntro'),
    input.fullName ? `${input.t('leadForm.fullName')}: ${input.fullName}` : null,
    input.phone ? `${input.t('leadForm.phone')}: ${input.phone}` : null,
    input.email ? `${input.t('leadForm.email')}: ${input.email}` : null,
    input.preferredContact ? `${input.t('leadForm.preferredContact')}: ${input.t(`leadForm.contactOptions.${input.preferredContact}`)}` : null,
    input.message ? `${input.t('leadForm.message')}: ${input.message}` : null,
    input.t('showroom.visitForm.calendarNote'),
  ]
    .filter(Boolean)
    .join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.t('showroom.visitForm.calendarTitle'),
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    ctz: 'Africa/Casablanca',
    details,
    location: input.t('showroom.addressLine'),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function VisitRequestDialog() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const visitSchema = useMemo(() => createVisitSchema(t), [t]);
  const defaultMessage = t('showroom.visitForm.defaultMessage');

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      preferredContact: 'phone',
      preferredDate: '',
      message: defaultMessage,
    },
  });

  const errors = form.formState.errors;
  const isSubmitting = form.formState.isSubmitting;
  const watchedValues = form.watch();
  const googleCalendarUrl = buildGoogleCalendarUrl({
    fullName: watchedValues.fullName,
    preferredDate: watchedValues.preferredDate,
    preferredContact: watchedValues.preferredContact as LeadPreferredContact | undefined,
    phone: watchedValues.phone,
    email: watchedValues.email,
    message: watchedValues.message,
    t,
  });

  const onSubmit = async (values: VisitFormValues) => {
    const lead: CreateLeadInput = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email || undefined,
      preferredContact: values.preferredContact as LeadPreferredContact,
      message: `${t('showroom.visitForm.dateLabel')}: ${values.preferredDate}\n\n${values.message}`,
      language: i18n.language,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    try {
      await createLeadInApi(lead);
      toast.success(t('showroom.visitForm.success'));
      form.reset({
        fullName: '',
        phone: '',
        email: '',
        preferredContact: 'phone',
        preferredDate: '',
        message: defaultMessage,
      });
      setOpen(false);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'leads_create_failed';
      toast.error(errorCode === 'invalid_lead_payload' ? t('leadForm.validation.generic') : t('showroom.visitForm.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-brand-gold font-bold text-brand-blue hover:bg-brand-gold-light">
          <Calendar className="mr-2 h-5 w-5" />
          {t('showroom.schedule')}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-3xl border-0 p-0 shadow-2xl">
        <div className="rounded-3xl bg-white p-6 sm:p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl text-slate-950">{t('showroom.visitForm.title')}</DialogTitle>
            <DialogDescription className="text-slate-600">
              {t('showroom.visitForm.description')}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visit-full-name">{t('leadForm.fullName')}</Label>
                <Input id="visit-full-name" {...form.register('fullName')} />
                {errors.fullName ? <p className="text-sm text-red-500">{errors.fullName.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visit-phone">{t('leadForm.phone')}</Label>
                <Input id="visit-phone" {...form.register('phone')} />
                {errors.phone ? <p className="text-sm text-red-500">{errors.phone.message}</p> : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="visit-email">{t('leadForm.email')}</Label>
                <Input id="visit-email" type="email" {...form.register('email')} />
                {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>{t('leadForm.preferredContact')}</Label>
                <Select value={form.watch('preferredContact')} onValueChange={(value) => form.setValue('preferredContact', value as LeadPreferredContact)}>
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
              <Label htmlFor="visit-date">{t('showroom.visitForm.dateLabel')}</Label>
              <Input id="visit-date" type="date" {...form.register('preferredDate')} />
              {errors.preferredDate ? <p className="text-sm text-red-500">{errors.preferredDate.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-message">{t('leadForm.message')}</Label>
              <Textarea id="visit-message" rows={5} {...form.register('message')} />
              {errors.message ? <p className="text-sm text-red-500">{errors.message.message}</p> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-blue text-white hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? t('showroom.visitForm.submitting') : t('showroom.visitForm.submit')}
              </Button>
              <Button asChild type="button" variant="outline" className="w-full" disabled={!googleCalendarUrl}>
                <a href={googleCalendarUrl || '#'} target="_blank" rel="noreferrer" aria-disabled={!googleCalendarUrl}>
                  {t('showroom.visitForm.googleCalendar')}
                </a>
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
