import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import RichTextTextarea from '@/components/admin/RichTextTextarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { uploadCatalogueInApi, uploadImageInApi } from '@/lib/products-api';
import { getAbsoluteSiteUrl } from '@/lib/site';
import type {
  Product,
  ProductAdminCategory,
  ProductSource,
  ProductStockType,
  ProductTransmissionType,
} from '@/types/product';
import {
  PRODUCT_ADMIN_CATEGORY_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_SOURCE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_STOCK_TYPE_OPTIONS,
} from '@/types/product';
import { getLocalizedStatusName } from '@/utils/localization';
import { normalizeCustomCategoryName } from '@/utils/product-category';

function createProductSchema(t: TFunction) {
  return z
    .object({
      id: z.string().min(2, t('admin.validation.id')),
      title: z.string().min(3, t('admin.validation.title')),
      titleFr: z.string().optional(),
      titleEs: z.string().optional(),
      category: z.enum(PRODUCT_ADMIN_CATEGORY_OPTIONS),
      customCategoryName: z.string().optional(),
      brand: z.string().min(2, t('admin.validation.brand')),
      stockType: z.enum(['new', 'used']),
      source: z.enum(['lecitrailer', 'sakitrailer29']),
      dedouanee: z.enum(['yes', 'no', 'not-specified']),
      price: z.coerce.number().min(1, t('admin.validation.price')),
      year: z.coerce.number().min(2000, t('admin.validation.year')).max(2100, t('admin.validation.year')),
      modelYear: z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? undefined : value),
        z.coerce.number().min(2000, t('admin.validation.modelYear')).max(2100, t('admin.validation.modelYear')).optional()
      ),
      transmission: z.enum(['manual', 'automatic', 'semi-automatic', 'not-specified']),
      mileageKm: z.preprocess(
        (value) => (value === '' || value === null || value === undefined ? undefined : value),
        z.coerce.number().min(0, t('admin.validation.mileage')).optional()
      ),
      location: z.string().optional(),
      imagesText: z.string().min(1, t('admin.validation.imagesText')),
      catalogues: z.array(z.object({ name: z.string(), url: z.string() })).optional(),
      description: z.string().min(5, t('admin.validation.description')),
      descriptionFr: z.string().optional(),
      descriptionEs: z.string().optional(),
      status: z.enum(['available', 'reserved', 'sold']),
    })
    .superRefine((values, context) => {
      if (values.stockType === 'new' && values.category === 'other') {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['category'],
          message: t('admin.validation.customCategoryUsedOnly'),
        });
      }

      if (values.stockType === 'used' && values.category === 'other' && !normalizeCustomCategoryName(values.customCategoryName)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customCategoryName'],
          message: t('admin.validation.customCategoryName'),
        });
      }
    });
}

type ProductFormInput = z.input<ReturnType<typeof createProductSchema>>;
type ProductFormSchema = z.output<ReturnType<typeof createProductSchema>>;

const emptyValues: ProductFormInput = {
  id: '',
  title: '',
  titleFr: '',
  titleEs: '',
  category: 'curtainsiders-semicurtainsiders',
  customCategoryName: '',
  brand: '',
  stockType: 'new',
  source: 'lecitrailer',
  dedouanee: 'not-specified',
  price: 0,
  year: new Date().getFullYear(),
  modelYear: undefined,
  transmission: 'not-specified',
  mileageKm: undefined,
  location: '',
  imagesText: '',
  catalogues: [],
  description: '',
  descriptionFr: '',
  descriptionEs: '',
  status: 'available',
};

function productToFormValues(product: Product): ProductFormInput {
  return {
    id: product.id,
    title: product.title,
    titleFr: product.titleFr ?? '',
    titleEs: product.titleEs ?? '',
    category: product.category,
    customCategoryName: product.customCategoryName ?? '',
    brand: product.brand,
    stockType: product.stockType ?? 'used',
    source: product.source ?? (product.stockType === 'new' ? 'lecitrailer' : 'sakitrailer29'),
    dedouanee: product.dedouanee === true ? 'yes' : product.dedouanee === false ? 'no' : 'not-specified',
    price: product.price,
    year: product.year,
    modelYear: product.modelYear,
    transmission: product.transmission ?? 'not-specified',
    mileageKm: product.mileageKm,
    location: product.location ?? '',
    imagesText: product.images.join('\n'),
    catalogues: product.catalogues ?? [],
    description: product.description,
    descriptionFr: product.descriptionFr ?? '',
    descriptionEs: product.descriptionEs ?? '',
    status: product.status,
  };
}

function parseImageEntries(imagesText: string) {
  return imagesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      if (line.startsWith('data:')) {
        return [line];
      }

      return line.split(',').map((image) => image.trim()).filter(Boolean);
    });
}


function formValuesToProduct(values: ProductFormSchema, existingProduct: Product): Product {
  const images = parseImageEntries(values.imagesText);
  const normalizedStockType: ProductStockType = values.stockType;
  const normalizedSource: ProductSource = values.source;
  const normalizedDedouanee =
    normalizedStockType === 'used'
      ? values.dedouanee === 'yes'
        ? true
        : values.dedouanee === 'no'
          ? false
          : undefined
      : undefined;
  const normalizedTransmission: ProductTransmissionType | undefined =
    normalizedStockType === 'used' && values.transmission !== 'not-specified' ? values.transmission : undefined;

  return {
    ...existingProduct,
    id: values.id.trim(),
    title: values.title.trim(),
    titleFr: values.titleFr?.trim() || undefined,
    titleEs: values.titleEs?.trim() || undefined,
    category: values.category,
    customCategoryName:
      normalizedStockType === 'used' && values.category === 'other'
        ? normalizeCustomCategoryName(values.customCategoryName)
        : undefined,
    brand: values.brand.trim(),
    stockType: normalizedStockType,
    source: normalizedSource,
    dedouanee: normalizedDedouanee,
    price: Number(values.price),
    year: Number(values.year),
    modelYear: normalizedStockType === 'used' && values.modelYear !== undefined ? Number(values.modelYear) : undefined,
    transmission: normalizedTransmission,
    mileageKm: values.mileageKm === undefined ? undefined : Number(values.mileageKm),
    location: values.location?.trim() || undefined,
    images,
    catalogues: values.catalogues?.length ? values.catalogues : undefined,
    description: values.description.trim(),
    descriptionFr: values.descriptionFr?.trim() || undefined,
    descriptionEs: values.descriptionEs?.trim() || undefined,
    status: values.status,
  };
}

function getStockTypeLabel(stockType: ProductStockType, t: TFunction) {
  return stockType === 'new' ? t('admin.stockType.new') : t('admin.stockType.used');
}

function getSourceLabel(source: ProductSource, t: TFunction) {
  return source === 'lecitrailer' ? t('admin.source.lecitrailer') : t('admin.source.sakitrailer29');
}

function getProductMutationToastError(errorCode: string | undefined, fallbackMessage: string, t: TFunction) {
  if (errorCode === 'backend_unreachable') {
    return t('admin.toasts.backendUnavailable');
  }

  return fallbackMessage;
}

export default function AdminProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { products, isLoading, updateProduct } = useProductStore();
  const editingProduct = useMemo(() => products.find((product) => product.id === id) ?? null, [id, products]);
  const initializedProductIdRef = useRef<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploadingCatalogues, setIsUploadingCatalogues] = useState(false);
  const [catalogueUploadProgress, setCatalogueUploadProgress] = useState(0);

  useSeo(t('admin.dialog.editTitle'), t('admin.dialog.description'), {
    canonical: id ? getAbsoluteSiteUrl(`/admin/products/${encodeURIComponent(id)}/edit`) : getAbsoluteSiteUrl('/admin'),
    noIndex: true,
  });

  const productSchema = useMemo(() => createProductSchema(t), [t]);
  const form = useForm<ProductFormInput, unknown, ProductFormSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });
  const watchedFormValues = useWatch({ control: form.control });
  const watchedValues = useMemo<ProductFormInput>(
    () => ({
      ...emptyValues,
      ...watchedFormValues,
      catalogues: (watchedFormValues?.catalogues ?? emptyValues.catalogues ?? []).map((catalogue) => ({
        name: catalogue?.name ?? '',
        url: catalogue?.url ?? '',
      })),
    }),
    [watchedFormValues]
  );
  const currentImages = useMemo(() => parseImageEntries(watchedValues.imagesText), [watchedValues.imagesText]);
  const currentCatalogues = watchedValues.catalogues ?? [];

  useEffect(() => {
    if (!editingProduct) {
      return;
    }

    if (initializedProductIdRef.current === editingProduct.id) {
      return;
    }

    initializedProductIdRef.current = editingProduct.id;
    form.reset(productToFormValues(editingProduct));
  }, [editingProduct, form]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let oversizeCount = 0;
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        oversizeCount++;
      } else {
        validFiles.push(file);
      }
    }

    if (oversizeCount > 0) {
      toast.error(t('admin.form.imageSizeError'));
    }

    if (validFiles.length === 0) {
      event.currentTarget.value = '';
      return;
    }

    const currentLines = parseImageEntries(form.getValues('imagesText'));
    const totalBytes = validFiles.reduce((sum, file) => sum + file.size, 0) || 1;
    let uploadedBytes = 0;

    setIsUploadingImages(true);
    setImageUploadProgress(0);

    try {
      const uploadedImages: string[] = [];

      for (const file of validFiles) {
        const uploadedImage = await uploadImageInApi(file, ({ loaded, total }) => {
          const currentFileBytes = Math.min(loaded, total || file.size);
          const progress = Math.round(((uploadedBytes + currentFileBytes) / totalBytes) * 100);
          setImageUploadProgress(Math.min(progress, 99));
        });

        uploadedBytes += file.size;
        setImageUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
        uploadedImages.push(uploadedImage.url);
      }

      const normalizedImages = [...new Set([...currentLines, ...uploadedImages])];
      form.setValue('imagesText', normalizedImages.join('\n'), { shouldValidate: true, shouldDirty: true });
      toast.success(t('admin.form.imagesUploaded'));
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'image_upload_failed';
      const message =
        errorCode === 'image_too_large'
          ? t('admin.form.imageSizeError')
          : errorCode === 'backend_unreachable' || errorCode === 'image_upload_failed'
            ? t('admin.toasts.backendUnavailable')
            : t('admin.toasts.createFailed');
      toast.error(message);
    } finally {
      setIsUploadingImages(false);
      setImageUploadProgress(0);
      event.currentTarget.value = '';
    }
  };

  const handleCatalogueUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let oversizeCount = 0;
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        oversizeCount++;
      } else {
        validFiles.push(file);
      }
    }

    if (oversizeCount > 0) {
      toast.error(t('admin.form.catalogueSizeError'));
    }

    if (validFiles.length === 0) {
      event.currentTarget.value = '';
      return;
    }

    const currentCatalogues = form.getValues('catalogues') ?? [];
    setIsUploadingCatalogues(true);
    setCatalogueUploadProgress(0);

    try {
      const totalBytes = validFiles.reduce((sum, file) => sum + file.size, 0) || 1;
      let uploadedBytes = 0;
      const newCatalogues = [];

      for (const file of validFiles) {
        const uploadedCatalogue = await uploadCatalogueInApi(file, ({ loaded, total }) => {
          const currentFileBytes = Math.min(loaded, total || file.size);
          const progress = Math.round(((uploadedBytes + currentFileBytes) / totalBytes) * 100);
          setCatalogueUploadProgress(Math.min(progress, 99));
        });

        uploadedBytes += file.size;
        setCatalogueUploadProgress(Math.round((uploadedBytes / totalBytes) * 100));
        newCatalogues.push(uploadedCatalogue);
      }

      form.setValue('catalogues', [...currentCatalogues, ...newCatalogues], { shouldValidate: true, shouldDirty: true });
      toast.success(t('admin.form.catalogueUploaded'));
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'catalogue_upload_failed';
      const message =
        errorCode === 'catalogue_too_large'
          ? t('admin.form.catalogueSizeError')
          : errorCode === 'backend_unreachable' || errorCode === 'catalogue_upload_failed'
            ? t('admin.toasts.backendUnavailable')
            : t('admin.toasts.createFailed');
      toast.error(message);
    } finally {
      setIsUploadingCatalogues(false);
      setCatalogueUploadProgress(0);
      event.currentTarget.value = '';
    }
  };

  const handleRemoveImageAt = (index: number) => {
    const nextImages = parseImageEntries(form.getValues('imagesText')).filter((_, imageIndex) => imageIndex !== index);
    form.setValue('imagesText', nextImages.join('\n'), { shouldValidate: true, shouldDirty: true });
  };

  const handleClearImages = () => {
    form.setValue('imagesText', '', { shouldValidate: true, shouldDirty: true });
  };

  const handleRemoveCatalogue = (index: number) => {
    const nextCatalogues = (form.getValues('catalogues') ?? []).filter((_, catalogueIndex) => catalogueIndex !== index);
    form.setValue('catalogues', nextCatalogues, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: ProductFormSchema) => {
    if (!editingProduct) {
      return;
    }

    const duplicateId = products.some((product) => product.id === values.id && product.id !== editingProduct.id);
    if (duplicateId) {
      toast.error(t('admin.toasts.duplicateId'));
      return;
    }

    const nextProduct = formValuesToProduct(values, editingProduct);
    const result = await updateProduct(nextProduct);
    if (!result.success) {
      toast.error(getProductMutationToastError(result.error, t('admin.toasts.updateFailed'), t));
      return;
    }

    toast.success(t('admin.toasts.updated'));
    navigate('/admin');
  };

  if (!editingProduct && isLoading) {
    return (
      <section className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto px-4 pb-20">
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-950">{t('common.loading')}</p>
                <p className="text-sm text-slate-500">{t('productDetailPage.loadingDescription', 'Loading product details...')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!editingProduct) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('admin.eyebrow')}</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">{t('admin.dialog.editTitle')}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">{editingProduct.title}</p>
          </div>
          <Link to="/admin">
            <Button type="button" variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              {t('admin.cancel')}
            </Button>
          </Link>
        </div>

        <div className="mx-auto max-w-6xl">
          <Card className="overflow-hidden rounded-[32px] border-0 shadow-2xl">
            <div className="border-b border-white/10 bg-gradient-to-r from-brand-blue via-brand-blue to-slate-900 px-6 py-6 text-left text-white">
              <h1 className="text-2xl font-semibold">{t('admin.dialog.editTitle')}</h1>
              <p className="mt-2 max-w-3xl text-sm text-blue-50/90">{t('admin.dialog.description')}</p>
            </div>

            <form className="grid content-start gap-4 p-6 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input id="id" {...form.register('id')} />
                {form.formState.errors.id ? <p className="text-sm text-red-500">{form.formState.errors.id.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">{t('admin.form.title')}</Label>
                <Input id="title" {...form.register('title')} />
                {form.formState.errors.title ? <p className="text-sm text-red-500">{form.formState.errors.title.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleFr">{t('admin.form.titleFr')}</Label>
                <Input id="titleFr" {...form.register('titleFr')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titleEs">{t('admin.form.titleEs')}</Label>
                <Input id="titleEs" {...form.register('titleEs')} />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.form.category')}</Label>
                <Select
                  value={watchedValues.category ?? PRODUCT_CATEGORY_OPTIONS[0]}
                  onValueChange={(value) => {
                    form.setValue('category', value as ProductAdminCategory, { shouldValidate: true, shouldDirty: true });
                    if (value !== 'other') {
                      form.setValue('customCategoryName', '', { shouldValidate: true, shouldDirty: true });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {((watchedValues.stockType ?? 'new') === 'used' ? PRODUCT_ADMIN_CATEGORY_OPTIONS : PRODUCT_CATEGORY_OPTIONS).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category === 'other' ? t('admin.form.categoryOther') : t(`product.categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category ? <p className="text-sm text-red-500">{form.formState.errors.category.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">{t('admin.form.brand')}</Label>
                <Input id="brand" {...form.register('brand')} />
                {form.formState.errors.brand ? <p className="text-sm text-red-500">{form.formState.errors.brand.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>{t('admin.form.stockType')}</Label>
                <Select
                  value={watchedValues.stockType ?? 'new'}
                  onValueChange={(value) => {
                    form.setValue('stockType', value as ProductStockType, { shouldDirty: true });
                    if (value === 'new') {
                      form.setValue('dedouanee', 'not-specified', { shouldDirty: true });
                      form.setValue('transmission', 'not-specified', { shouldDirty: true });
                      form.setValue('modelYear', undefined, { shouldDirty: true });
                      form.setValue('customCategoryName', '', { shouldValidate: true, shouldDirty: true });
                      if (form.getValues('category') === 'other') {
                        form.setValue('category', PRODUCT_CATEGORY_OPTIONS[0], { shouldValidate: true, shouldDirty: true });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STOCK_TYPE_OPTIONS.map((stockType) => (
                      <SelectItem key={stockType} value={stockType}>
                        {getStockTypeLabel(stockType, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(watchedValues.stockType ?? 'new') === 'used' && watchedValues.category === 'other' ? (
                <div className="space-y-2">
                  <Label htmlFor="customCategoryName">{t('admin.form.customCategoryName')}</Label>
                  <Input
                    id="customCategoryName"
                    {...form.register('customCategoryName')}
                    placeholder={t('admin.form.customCategoryPlaceholder')}
                  />
                  {form.formState.errors.customCategoryName ? (
                    <p className="text-sm text-red-500">{form.formState.errors.customCategoryName.message}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>{t('admin.form.source')}</Label>
                <Select
                  value={watchedValues.source ?? 'lecitrailer'}
                  onValueChange={(value) => form.setValue('source', value as ProductSource, { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_SOURCE_OPTIONS.map((source) => (
                      <SelectItem key={source} value={source}>
                        {getSourceLabel(source, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('admin.form.dedouanee')}</Label>
                <Select
                  value={watchedValues.dedouanee ?? 'not-specified'}
                  onValueChange={(value) =>
                    form.setValue('dedouanee', value as ProductFormInput['dedouanee'], { shouldDirty: true })
                  }
                  disabled={(watchedValues.stockType ?? 'new') !== 'used'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t('usedFilters.dedouaneeYes')}</SelectItem>
                    <SelectItem value="no">{t('usedFilters.dedouaneeNo')}</SelectItem>
                    <SelectItem value="not-specified">{t('admin.form.dedouaneeNotSpecified')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t('admin.form.price')}</Label>
                <Input id="price" type="number" {...form.register('price')} />
                {form.formState.errors.price ? <p className="text-sm text-red-500">{form.formState.errors.price.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">{t('admin.form.year')}</Label>
                <Input id="year" type="number" {...form.register('year')} />
                {form.formState.errors.year ? <p className="text-sm text-red-500">{form.formState.errors.year.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelYear">{t('admin.form.modelYear')}</Label>
                <Input id="modelYear" type="number" {...form.register('modelYear')} disabled={(watchedValues.stockType ?? 'new') !== 'used'} />
                {form.formState.errors.modelYear ? <p className="text-sm text-red-500">{form.formState.errors.modelYear.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label>{t('admin.form.transmission')}</Label>
                <Select
                  value={watchedValues.transmission ?? 'not-specified'}
                  onValueChange={(value) =>
                    form.setValue('transmission', value as ProductFormInput['transmission'], { shouldDirty: true })
                  }
                  disabled={(watchedValues.stockType ?? 'new') !== 'used'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-specified">{t('admin.form.transmissionNotSpecified')}</SelectItem>
                    <SelectItem value="manual">{t('admin.form.transmissionManual')}</SelectItem>
                    <SelectItem value="automatic">{t('admin.form.transmissionAutomatic')}</SelectItem>
                    <SelectItem value="semi-automatic">{t('admin.form.transmissionSemiAutomatic')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileageKm">{t('admin.form.mileage')}</Label>
                <Input id="mileageKm" type="number" {...form.register('mileageKm')} />
                {form.formState.errors.mileageKm ? <p className="text-sm text-red-500">{form.formState.errors.mileageKm.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{t('admin.form.location')}</Label>
                <Input id="location" {...form.register('location')} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imagesText">{t('admin.form.images')}</Label>
                <Textarea id="imagesText" rows={4} {...form.register('imagesText')} placeholder={t('admin.form.imagesPlaceholder')} />
                <Input id="imageUpload" type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploadingImages} />
                {isUploadingImages ? (
                  <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <p>{t('admin.form.imageUploading')}</p>
                      <p>{imageUploadProgress}%</p>
                    </div>
                    <Progress value={imageUploadProgress} />
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <p>{t('admin.form.imagesUploadHelp')}</p>
                  <p>{t('admin.form.imagesCount', { count: currentImages.length })}</p>
                </div>
                {currentImages.length > 0 ? (
                  <div className="space-y-3 rounded-xl border bg-slate-50 p-3">
                    <div className="flex justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={handleClearImages}>
                        {t('admin.form.clearAllImages')}
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {currentImages.map((image, index) => (
                        <div key={`${image}-${index}`} className="space-y-2 rounded-lg border bg-white p-2">
                          <img src={image} alt={`Preview ${index + 1}`} className="h-24 w-full rounded object-cover" loading="lazy" />
                          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => handleRemoveImageAt(index)}>
                            {t('admin.form.removeImage')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {form.formState.errors.imagesText ? <p className="text-sm text-red-500">{form.formState.errors.imagesText.message}</p> : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="catalogueUpload">{t('admin.form.catalogue')}</Label>
                <Input id="catalogueUpload" type="file" accept="application/pdf" multiple onChange={handleCatalogueUpload} disabled={isUploadingCatalogues} />
                {isUploadingCatalogues ? (
                  <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <p>{t('admin.form.catalogueUploading')}</p>
                      <p>{catalogueUploadProgress}%</p>
                    </div>
                    <Progress value={catalogueUploadProgress} />
                  </div>
                ) : null}
                {currentCatalogues.length > 0 ? (
                  <div className="mt-3 space-y-2 rounded-xl border bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">{t('admin.form.cataloguesCount', { count: currentCatalogues.length })}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue('catalogues', [], { shouldValidate: true, shouldDirty: true })}
                      >
                        {t('admin.form.clearAllCatalogues')}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {currentCatalogues.map((catalogue, index) => (
                        <div key={`${catalogue.name}-${index}`} className="flex items-center justify-between rounded-md border bg-white p-2 text-sm shadow-sm">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle className="size-4 shrink-0 text-emerald-600" />
                            <span className="truncate text-slate-600">{catalogue.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCatalogue(index)}
                            className="h-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            {t('admin.form.remove')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <RichTextTextarea
                  id="description"
                  name={form.register('description').name}
                  label={t('admin.form.description')}
                  rows={5}
                  value={watchedValues.description ?? ''}
                  onBlur={form.register('description').onBlur}
                  onChange={(value) => form.setValue('description', value, { shouldDirty: true, shouldValidate: true })}
                  error={form.formState.errors.description?.message}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <RichTextTextarea
                  id="descriptionFr"
                  name={form.register('descriptionFr').name}
                  label={t('admin.form.descriptionFr')}
                  rows={4}
                  value={watchedValues.descriptionFr ?? ''}
                  onBlur={form.register('descriptionFr').onBlur}
                  onChange={(value) => form.setValue('descriptionFr', value, { shouldDirty: true, shouldValidate: true })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <RichTextTextarea
                  id="descriptionEs"
                  name={form.register('descriptionEs').name}
                  label={t('admin.form.descriptionEs')}
                  rows={4}
                  value={watchedValues.descriptionEs ?? ''}
                  onBlur={form.register('descriptionEs').onBlur}
                  onChange={(value) => form.setValue('descriptionEs', value, { shouldDirty: true, shouldValidate: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('admin.form.status')}</Label>
                <Select
                  value={watchedValues.status ?? editingProduct.status}
                  onValueChange={(value) => form.setValue('status', value as Product['status'], { shouldDirty: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getLocalizedStatusName(status, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => navigate('/admin')}>
                  {t('admin.cancel')}
                </Button>
                <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90">
                  {t('admin.saveChanges')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
