import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { useOrderStore } from '@/context/OrderContext';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { getAbsoluteSiteUrl } from '@/lib/site';
import { getLocalizedProductTitle } from '@/utils/localization';
import { getProductCategoryLabel } from '@/utils/product-category';
import { updateProfileInApi } from '@/lib/auth-api';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/format';

const orderStatusClass: Record<Order['status'], string> = {
  created: 'bg-slate-200 text-slate-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  ready: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
};

function formatDate(date: string, language: string) {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-MA' : language === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

function createProfileSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(2, t('auth.signup.validation.fullName')),
    companyName: z.string().optional(),
  });
}

function createPasswordSchema(t: TFunction) {
  return z.object({
    newPassword: z.string().min(6, t('dashboard.passwordValidation')),
    confirmPassword: z.string()
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('dashboard.passwordMatch'),
    path: ["confirmPassword"],
  });
}

type ProfileFormValues = z.infer<ReturnType<typeof createProfileSchema>>;
type PasswordFormValues = z.infer<ReturnType<typeof createPasswordSchema>>;

export default function Dashboard() {
  const { i18n, t } = useTranslation();
  const { user, updateUser, updatePassword, deleteAccount } = useAuth();
  const { findOrderByNumber, getOrdersForUser } = useOrderStore();
  const { products } = useProductStore();
  
  const [orderNumber, setOrderNumber] = useState('');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useSeo("Dashboard | SakiTrailer29", "Manage your profile and track orders.", {
    keywords: 'dashboard, profile, orders, sakitrailer29 account',
    canonical: getAbsoluteSiteUrl('/dashboard'),
    noIndex: true,
  });

  const profileSchema = createProfileSchema(t);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      companyName: user?.companyName || '',
    },
  });

  const pwSchema = createPasswordSchema(t);
  const pwForm = useForm<PasswordFormValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const myOrders = useMemo(() => {
    if (!user) return [];
    return getOrdersForUser(user.id);
  }, [getOrdersForUser, user]);

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasSearched(true);

    const order = findOrderByNumber(orderNumber);
    if (!order || !user || order.userId !== user.id) {
      setMatchedOrder(null);
      toast.error(t('orders.search.notFound'));
      return;
    }

    setMatchedOrder(order);
  };

  const onUpdateProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    try {
      const updatedUser = await updateProfileInApi({
        fullName: values.fullName,
        companyName: values.companyName || undefined,
      });
      updateUser(updatedUser);
      toast.success(t('dashboard.profileUpdated'));
    } catch {
      toast.error(t('dashboard.profileUpdateFailed'));
    }
  };

  const onUpdatePassword = async (values: PasswordFormValues) => {
    if (!updatePassword) {
      toast.error(t('dashboard.passwordUnsupported'));
      return;
    }
    const result = await updatePassword(values.newPassword);
    if (result.success) {
      toast.success(t('dashboard.passwordUpdated'));
      pwForm.reset();
    } else {
      if (result.error?.includes('requires-recent-login')) {
        toast.error(t('dashboard.requiresRecentLoginPassword'));
      } else {
        toast.error(result.error ? `${t('dashboard.passwordUpdateFailed')} ${result.error}` : t('dashboard.passwordUpdateFailed'));
      }
    }
  };

  const onDeleteAccount = async () => {
    if (!deleteAccount) return;
    const result = await deleteAccount();
    if (result.success) {
      toast.success(t('dashboard.accountDeleted'));
      // The context will set current user to null and App.js will handle redirect to home
    } else {
      if (result.error?.includes('requires-recent-login')) {
        toast.error(t('dashboard.requiresRecentLoginDelete'));
      } else {
        toast.error(result.error ? `${t('dashboard.accountDeleteFailed')} ${result.error}` : t('dashboard.accountDeleteFailed'));
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">{t('dashboard.title')}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile Section */}
          <Card className="rounded-3xl border-0 shadow-xl h-fit">
            <CardHeader>
              <CardTitle>{t('dashboard.profileTitle')}</CardTitle>
              <CardDescription>{t('dashboard.profileDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(onUpdateProfile)}>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('leadForm.fullName')}</Label>
                  <Input id="fullName" {...form.register('fullName')} />
                  {form.formState.errors.fullName && <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('dashboard.companyName')}</Label>
                  <Input id="companyName" {...form.register('companyName')} />
                  {form.formState.errors.companyName && <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t('dashboard.emailReadOnly')}</Label>
                  <Input id="email" value={user.email} readOnly disabled className="bg-slate-100" />
                </div>

                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full bg-brand-blue text-white hover:bg-brand-blue/90">
                  {t('dashboard.saveChanges')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="rounded-3xl border-0 shadow-xl h-fit">
            <CardHeader>
              <CardTitle>{t('dashboard.securityTitle')}</CardTitle>
              <CardDescription>{t('dashboard.securityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={pwForm.handleSubmit(onUpdatePassword)}>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('dashboard.newPassword')}</Label>
                  <Input type="password" id="newPassword" {...pwForm.register('newPassword')} />
                  {pwForm.formState.errors.newPassword && <p className="text-sm text-red-500">{pwForm.formState.errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('dashboard.confirmPassword')}</Label>
                  <Input type="password" id="confirmPassword" {...pwForm.register('confirmPassword')} />
                  {pwForm.formState.errors.confirmPassword && <p className="text-sm text-red-500">{pwForm.formState.errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" disabled={pwForm.formState.isSubmitting} className="w-full bg-slate-900 text-white hover:bg-slate-800">
                  {t('dashboard.changePassword')}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="mb-2 text-sm font-semibold text-red-600">{t('dashboard.dangerZone')}</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {t('dashboard.deleteAccountWarning')}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto">
                      {t('dashboard.deleteAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('dashboard.deleteConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('dashboard.deleteConfirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('dashboard.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        {t('dashboard.deleteConfirmAction')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Orders Search Section */}
          <Card className="rounded-3xl border-0 shadow-xl h-fit">
            <CardHeader>
              <CardTitle>{t('orders.search.title')}</CardTitle>
              <CardDescription>{t('orders.search.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
                <Input
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder={t('orders.search.placeholder')}
                />
                <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90 shrink-0">
                  {t('orders.search.submit')}
                </Button>
              </form>

              {matchedOrder ? (
                <div className="rounded-2xl border bg-white p-4">
                  <p className="text-sm text-slate-500">{t('orders.fields.orderNumber')}</p>
                  <p className="text-lg font-semibold text-slate-950">{matchedOrder.orderNumber}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <span className={`inline-flex rounded-full px-3 py-1 font-medium ${orderStatusClass[matchedOrder.status]}`}>
                      {t(`orders.status.${matchedOrder.status}`)}
                    </span>
                    <span className="text-slate-500">
                      {t('orders.fields.updatedAt')}: {formatDate(matchedOrder.updatedAt, i18n.language)}
                    </span>
                  </div>
                </div>
              ) : null}

              {!matchedOrder && hasSearched ? (
                <p className="text-sm text-slate-500">{t('orders.search.notFound')}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* All Orders Table Section */}
        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>{t('orders.myOrdersTitle')}</CardTitle>
            <CardDescription>{t('orders.myOrdersCount', { count: myOrders.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {myOrders.length === 0 ? (
              <p className="text-sm text-slate-500">{t('orders.noOrders')}</p>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => {
                  const product = products.find((p) => p.id === order.productId);
                  return (
                    <div key={order.id} className="rounded-2xl border bg-white p-4 transition-all hover:shadow-md">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Status & Basic Info */}
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-slate-500">{t('orders.fields.orderNumber')}</p>
                          <p className="text-lg font-bold text-slate-900">{order.orderNumber}</p>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${orderStatusClass[order.status]}`}>
                              {t(`orders.status.${order.status}`)}
                            </span>
                            <span className="text-sm text-slate-500">
                              Updated: {formatDate(order.updatedAt, i18n.language)}
                            </span>
                          </div>
                        </div>

                        {/* Product Details Section */}
                        {product && (
                          <div className="md:w-1/2 rounded-xl bg-slate-50 p-4 border border-slate-100 flex gap-4 items-center">
                            <div className="h-16 w-16 md:h-20 md:w-20 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm border">
                              <img 
                                src={product.images[0] || '/placeholder.svg'} 
                                alt={getLocalizedProductTitle(product, i18n.language)}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900 line-clamp-2 leading-tight">
                                {getLocalizedProductTitle(product, i18n.language)}
                              </p>
                              <p className="text-sm text-slate-500">{getProductCategoryLabel(product, t)}</p>
                              <p className="font-medium text-brand-blue">
                                {product.stockType !== 'new'
                                  ? formatCurrency(product.price, i18n.language)
                                  : t('product.priceOnRequest')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
