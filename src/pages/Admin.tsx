import { useEffect, useMemo, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import RichTextTextarea from '@/components/admin/RichTextTextarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useOrderStore } from '@/context/OrderContext';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { createAdminUserInApi, deleteAdminUserInApi, fetchUsersFromApi, type AuthUser } from '@/lib/auth-api';
import { createApiHeaders, getApiEndpoint } from '@/lib/api';
import { fetchLeadsFromApi } from '@/lib/leads-api';
import { uploadCatalogueInApi, uploadImageInApi } from '@/lib/products-api';
import { getAbsoluteSiteUrl } from '@/lib/site';
import type { Lead } from '@/types/lead';
import type { Order } from '@/types/order';
import { ORDER_STATUS_OPTIONS } from '@/types/order';
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
import { exportProductsToCsv } from '@/utils/csv';
import { formatCurrency } from '@/utils/format';
import {
  getLocalizedProductTitle,
  getLocalizedStatusName,
  getLocalizedTransmissionName,
} from '@/utils/localization';
import { getProductCategoryLabel, normalizeCustomCategoryName } from '@/utils/product-category';
import { stripRichText } from '@/utils/rich-text';
import { createId } from '@/utils/storage';

const preloadAdminProductEdit = () => import('@/pages/AdminProductEdit');

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

function createOrderSchema(t: TFunction) {
  return z.object({
    orderNumber: z.string().min(3, t('admin.orders.validation.orderNumber')),
    userId: z.string(),
    productId: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(['created', 'assigned', 'in_progress', 'ready', 'delivered', 'cancelled']),
  });
}

type ProductFormInput = z.input<ReturnType<typeof createProductSchema>>;
type ProductFormSchema = z.output<ReturnType<typeof createProductSchema>>;
type OrderFormInput = z.input<ReturnType<typeof createOrderSchema>>;
type OrderFormSchema = z.output<ReturnType<typeof createOrderSchema>>;

function getProductMutationToastError(errorCode: string | undefined, fallbackMessage: string, t: TFunction) {
  if (errorCode === 'backend_unreachable') {
    return t('admin.toasts.backendUnavailable');
  }

  return fallbackMessage;
}

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

const emptyOrderValues: OrderFormInput = {
  orderNumber: '',
  userId: 'unassigned',
  productId: '',
  notes: '',
  status: 'created',
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

function formValuesToProduct(values: ProductFormSchema, existingProduct?: Product): Product {
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
    images: images,
    catalogues: values.catalogues?.length ? values.catalogues : undefined,
    description: values.description.trim(),
    descriptionFr: values.descriptionFr?.trim() || undefined,
    descriptionEs: values.descriptionEs?.trim() || undefined,
    status: values.status,
    createdAt: existingProduct?.createdAt ?? new Date().toISOString(),
  };
}

function parseImageEntries(imagesText: string) {
  return imagesText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      // Keep uploaded data URLs intact (they always contain commas)
      if (line.startsWith('data:')) {
        return [line];
      }

      // Support legacy comma-separated URLs/paths for manual input
      return line.split(',').map((image) => image.trim()).filter(Boolean);
    });
}

function getStockTypeLabel(stockType: ProductStockType, t: TFunction) {
  return stockType === 'new' ? t('admin.stockType.new') : t('admin.stockType.used');
}

function getSourceLabel(source: ProductSource, t: TFunction) {
  return source === 'lecitrailer' ? t('admin.source.lecitrailer') : t('admin.source.sakitrailer29');
}

function orderToFormValues(order: Order): OrderFormInput {
  return {
    orderNumber: order.orderNumber,
    userId: order.userId ?? 'unassigned',
    productId: order.productId ?? '',
    notes: order.notes ?? '',
    status: order.status,
  };
}

export default function Admin() {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useSeo(t('admin.seoTitle'), t('admin.seoDescription'), {
    keywords: 'admin stock management, trailer dealership dashboard, morocco',
    canonical: getAbsoluteSiteUrl('/admin'),
    noIndex: true,
  });

  const { products, isLoading, addProduct, updateProduct, deleteProduct } = useProductStore();
  const { orders, createOrder, updateOrder } = useOrderStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [adminUsers, setAdminUsers] = useState<AuthUser[]>([]);
  const [customerUsers, setCustomerUsers] = useState<AuthUser[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [newAdminFullName, setNewAdminFullName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploadingCatalogues, setIsUploadingCatalogues] = useState(false);
  const [catalogueUploadProgress, setCatalogueUploadProgress] = useState(0);
  const productSchema = useMemo(() => createProductSchema(t), [t]);
  const orderSchema = useMemo(() => createOrderSchema(t), [t]);
  const [analytics, setAnalytics] = useState<{
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    activeOrders: number;
    availableProducts: number;
    totalLeads: number;
  } | null>(null);
  const standaloneMode = searchParams.get('mode');
  const standaloneProductId = searchParams.get('id');
  const isStandaloneCreate = standaloneMode === 'new-product';
  const isStandaloneEdit = standaloneMode === 'edit-product';
  const isStandaloneEditor = isStandaloneCreate || isStandaloneEdit;

  useEffect(() => {
    void preloadAdminProductEdit();
  }, []);

  const loadAdminUsers = async () => {
    try {
      const users = await fetchUsersFromApi('admin');
      setAdminUsers(users);
    } catch {
      setAdminUsers([]);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadAdminUsersSafe = async () => {
      try {
        const users = await fetchUsersFromApi('admin');
        if (isMounted) {
          setAdminUsers(users);
        }
      } catch {
        if (isMounted) {
          setAdminUsers([]);
        }
      }
    };

    const loadCustomerUsersSafe = async () => {
      try {
        const users = await fetchUsersFromApi('user');
        if (isMounted) {
          setCustomerUsers(users);
        }
      } catch {
        if (isMounted) {
          setCustomerUsers([]);
        }
      }
    };

    const loadLeadsSafe = async () => {
      try {
        const nextLeads = await fetchLeadsFromApi();
        if (isMounted) {
          setLeads(nextLeads);
        }
      } catch {
        if (isMounted) {
          setLeads([]);
        }
      }
    };

    if (!isStandaloneEditor) {
      void loadAdminUsersSafe();
      void loadCustomerUsersSafe();
      void loadLeadsSafe();

      const loadAnalytics = async () => {
        try {
          const res = await fetch(getApiEndpoint('/api/admin/analytics'), {
            headers: createApiHeaders({ auth: true }),
          });
          const data = await res.json();
          if (data.success && isMounted) setAnalytics(data.analytics);
        } catch {
          // silently ignore
        }
      };
      void loadAnalytics();
    }

    return () => {
      isMounted = false;
    };
  }, [isStandaloneEditor]);

  const sortedProducts = useMemo(
    () => [...products].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [products]
  );

  const sortedOrders = useMemo(
    () => [...orders].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()),
    [orders]
  );
  const sortedLeads = useMemo(
    () => [...leads].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [leads]
  );

  const form = useForm<ProductFormInput, unknown, ProductFormSchema>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  const orderForm = useForm<OrderFormInput, unknown, OrderFormSchema>({
    resolver: zodResolver(orderSchema),
    defaultValues: emptyOrderValues,
  });
  const watchedValues = useWatch({ control: form.control }) ?? emptyValues;
  const watchedOrderUserId = useWatch({ control: orderForm.control, name: 'userId' }) ?? 'unassigned';
  const watchedOrderStatus = useWatch({ control: orderForm.control, name: 'status' }) ?? 'created';

  const previewImages = useMemo(
    () => parseImageEntries(watchedValues.imagesText ?? ''),
    [watchedValues.imagesText]
  );

  const previewPrimaryImage = previewImages[0] ?? '/hero-showroom.jpg';
  const previewStockType = watchedValues.stockType ?? 'new';
  const previewSource = watchedValues.source ?? 'lecitrailer';
  const previewDedouanee = watchedValues.dedouanee ?? 'not-specified';
  const previewTransmission = watchedValues.transmission ?? 'not-specified';
  const selectedCategory = watchedValues.category ?? PRODUCT_CATEGORY_OPTIONS[0];
  const previewCatalogues = watchedValues.catalogues ?? [];
  const previewDescription = watchedValues.description ?? '';
  const previewDescriptionFr = watchedValues.descriptionFr ?? '';
  const previewDescriptionEs = watchedValues.descriptionEs ?? '';
  const previewStatus = watchedValues.status ?? 'available';
  const isUsedProductForm = previewStockType === 'used';
  const isCustomCategorySelected = isUsedProductForm && selectedCategory === 'other';
  const standaloneEditingProduct = isStandaloneEdit
    ? products.find((product) => product.id === standaloneProductId) ?? null
    : null;

  const openCreateProductDialog = () => {
    setEditingProduct(null);
    form.reset({
      ...emptyValues,
      id: createId('saki').toUpperCase(),
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    void preloadAdminProductEdit();
    navigate(`/admin/products/${encodeURIComponent(product.id)}/edit`);
  };

  const openCreateOrderDialog = () => {
    setEditingOrder(null);
    orderForm.reset({
      ...emptyOrderValues,
      orderNumber: createId('ord').toUpperCase(),
    });
    setIsOrderDialogOpen(true);
  };

  const openEditOrderDialog = (order: Order) => {
    setEditingOrder(order);
    orderForm.reset(orderToFormValues(order));
    setIsOrderDialogOpen(true);
  };

  useEffect(() => {
    if (isStandaloneCreate) {
      setEditingProduct(null);
      form.reset({
        ...emptyValues,
        id: createId('saki').toUpperCase(),
      });
      return;
    }

    if (isStandaloneEdit && standaloneEditingProduct) {
      setEditingProduct(standaloneEditingProduct);
      form.reset(productToFormValues(standaloneEditingProduct));
      return;
    }

    if (!isStandaloneEditor) return;

    setEditingProduct(null);
  }, [form, isStandaloneCreate, isStandaloneEdit, isStandaloneEditor, standaloneEditingProduct]);

  useEffect(() => {
    if (!isStandaloneEdit || isLoading) return;
    if (standaloneEditingProduct) return;

    navigate('/admin', { replace: true });
  }, [isLoading, isStandaloneEdit, navigate, standaloneEditingProduct]);

  const onSubmit = async (values: ProductFormSchema) => {
    const duplicateId = products.some((product) => product.id === values.id && product.id !== editingProduct?.id);

    if (duplicateId) {
      toast.error(t('admin.toasts.duplicateId'));
      return;
    }

    const nextProduct = formValuesToProduct(values, editingProduct ?? undefined);

    if (editingProduct) {
      const result = await updateProduct(nextProduct);
      if (!result.success) {
        toast.error(getProductMutationToastError(result.error, t('admin.toasts.updateFailed'), t));
        return;
      }
      toast.success(t('admin.toasts.updated'));
    } else {
      const result = await addProduct(nextProduct);
      if (!result.success) {
        toast.error(getProductMutationToastError(result.error, t('admin.toasts.createFailed'), t));
        return;
      }
      toast.success(t('admin.toasts.created'));
    }

    if (isStandaloneEditor) {
      navigate('/admin', { replace: true });
      return;
    }

    setIsDialogOpen(false);
  };

  const onOrderSubmit = async (values: OrderFormSchema) => {
    const normalizedUserId = values.userId === 'unassigned' ? undefined : values.userId;

    if (editingOrder) {
      const result = await updateOrder(editingOrder.id, {
        orderNumber: values.orderNumber,
        status: values.status,
        userId: values.userId === 'unassigned' ? null : values.userId,
        notes: values.notes,
        productId: values.productId,
      });

      if (!result.success) {
        const message =
          result.error === 'duplicate_order_number'
            ? t('admin.orders.toasts.duplicateOrderNumber')
            : t('admin.orders.toasts.updateFailed');
        toast.error(message);
        return;
      }

      toast.success(t('admin.orders.toasts.updated'));
      setIsOrderDialogOpen(false);
      return;
    }

    const result = await createOrder({
      orderNumber: values.orderNumber,
      userId: normalizedUserId,
      notes: values.notes,
      productId: values.productId,
      status: values.status,
    });

    if (!result.success) {
      const message =
        result.error === 'duplicate_order_number'
          ? t('admin.orders.toasts.duplicateOrderNumber')
          : result.error === 'user_not_found'
            ? t('admin.orders.toasts.userNotFound')
            : t('admin.orders.toasts.createFailed');
      toast.error(message);
      return;
    }

    toast.success(t('admin.orders.toasts.created'));
    setIsOrderDialogOpen(false);
  };

  const handleDelete = async (productId: string) => {
    const confirmed = window.confirm(t('admin.confirmDelete'));
    if (!confirmed) return;

    const result = await deleteProduct(productId);
    if (!result.success) {
      toast.error(getProductMutationToastError(result.error, t('admin.toasts.deleteFailed'), t));
      return;
    }

    toast.success(t('admin.toasts.deleted'));
  };

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
      form.setValue('imagesText', normalizedImages.join('\n'), { shouldValidate: true });
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

    const currentCatalogues = form.getValues('catalogues') ?? [];
    if (validFiles.length === 0) {
      event.currentTarget.value = '';
      return;
    }

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

      form.setValue('catalogues', [...currentCatalogues, ...newCatalogues], { shouldValidate: true });
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
    form.setValue('imagesText', nextImages.join('\n'), { shouldValidate: true });
  };

  const handleClearImages = () => {
    form.setValue('imagesText', '', { shouldValidate: true });
  };

  const handleRemoveCatalogue = (index: number) => {
    const nextCatalogues = (form.getValues('catalogues') ?? []).filter((_, catalogueIndex) => catalogueIndex !== index);
    form.setValue('catalogues', nextCatalogues, { shouldValidate: true });
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const fullName = newAdminFullName.trim();
    const email = newAdminEmail.trim();
    const password = newAdminPassword;

    if (!fullName || !email || password.length < 6) {
      toast.error(t('admin.accounts.toasts.invalidPayload'));
      return;
    }

    setIsCreatingAdmin(true);

    try {
      await createAdminUserInApi({ fullName, email, password });
      await loadAdminUsers();
      setNewAdminFullName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      toast.success(t('admin.accounts.toasts.created'));
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'admin_user_create_failed';
      const message =
        errorCode === 'email_exists'
          ? t('admin.accounts.toasts.emailExists')
          : errorCode === 'invalid_admin_payload'
            ? t('admin.accounts.toasts.invalidPayload')
            : errorCode === 'backend_unreachable'
              ? t('admin.toasts.backendUnavailable')
              : t('admin.accounts.toasts.createFailed');
      toast.error(message);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminUser: AuthUser) => {
    const confirmed = window.confirm(t('admin.accounts.confirmDelete', { email: adminUser.email }));
    if (!confirmed) {
      return;
    }

    setDeletingAdminId(adminUser.id);

    try {
      await deleteAdminUserInApi(adminUser.id);
      await loadAdminUsers();
      toast.success(t('admin.accounts.toasts.deleted'));
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'admin_user_delete_failed';
      const message =
        errorCode === 'cannot_delete_current_admin'
          ? t('admin.accounts.toasts.cannotDeleteCurrent')
          : errorCode === 'cannot_delete_seed_admin'
            ? t('admin.accounts.toasts.cannotDeleteSeed')
            : errorCode === 'cannot_delete_last_admin'
              ? t('admin.accounts.toasts.cannotDeleteLast')
              : errorCode === 'backend_unreachable'
                ? t('admin.toasts.backendUnavailable')
                : t('admin.accounts.toasts.deleteFailed');
      toast.error(message);
    } finally {
      setDeletingAdminId(null);
    }
  };

  const productEditorContent = (
    <>
      <div className="border-b border-white/10 bg-gradient-to-r from-brand-blue via-brand-blue to-slate-900 px-6 py-6 text-left text-white">
        <h2 className="text-2xl font-semibold">{editingProduct ? t('admin.dialog.editTitle') : t('admin.dialog.addTitle')}</h2>
        <p className="mt-2 max-w-3xl text-sm text-blue-50/90">{t('admin.dialog.description')}</p>
      </div>

      <form className="grid min-h-0 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2 xl:grid-cols-3" onSubmit={form.handleSubmit(onSubmit)}>
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
            value={selectedCategory}
            onValueChange={(value) => {
              form.setValue('category', value as ProductAdminCategory, { shouldValidate: true });
              if (value !== 'other') {
                form.setValue('customCategoryName', '', { shouldValidate: true });
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(isUsedProductForm ? PRODUCT_ADMIN_CATEGORY_OPTIONS : PRODUCT_CATEGORY_OPTIONS).map((category) => (
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
            value={previewStockType}
            onValueChange={(value) => {
              form.setValue('stockType', value as ProductStockType);
              if (value === 'new') {
                form.setValue('dedouanee', 'not-specified');
                form.setValue('transmission', 'not-specified');
                form.setValue('modelYear', undefined);
                form.setValue('customCategoryName', '', { shouldValidate: true });
                if (form.getValues('category') === 'other') {
                  form.setValue('category', PRODUCT_CATEGORY_OPTIONS[0], { shouldValidate: true });
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

        {isCustomCategorySelected ? (
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
          <Select value={previewSource} onValueChange={(value) => form.setValue('source', value as ProductSource)}>
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
            value={previewDedouanee}
            onValueChange={(value) => form.setValue('dedouanee', value as ProductFormInput['dedouanee'])}
            disabled={!isUsedProductForm}
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
          <Input id="modelYear" type="number" {...form.register('modelYear')} disabled={!isUsedProductForm} />
          {form.formState.errors.modelYear ? <p className="text-sm text-red-500">{form.formState.errors.modelYear.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>{t('admin.form.transmission')}</Label>
          <Select
            value={previewTransmission}
            onValueChange={(value) => form.setValue('transmission', value as ProductFormInput['transmission'])}
            disabled={!isUsedProductForm}
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

        <div className="space-y-2 md:col-span-2 xl:col-span-2">
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
            <p>{t('admin.form.imagesCount', { count: previewImages.length })}</p>
          </div>
          {previewImages.length > 0 ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-3">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={handleClearImages}>
                  {t('admin.form.clearAllImages')}
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {previewImages.map((image, index) => (
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

        <div className="space-y-2 md:col-span-2 xl:col-span-2">
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

          {previewCatalogues.length > 0 && (
            <div className="mt-3 space-y-2 rounded-xl border bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">{t('admin.form.cataloguesCount', { count: previewCatalogues.length })}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => form.setValue('catalogues', [], { shouldValidate: true })}
                >
                  {t('admin.form.clearAllCatalogues')}
                </Button>
              </div>
              <div className="space-y-2">
                {previewCatalogues.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border bg-white p-2 text-sm shadow-sm">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle className="size-4 shrink-0 text-emerald-600" />
                      <span className="truncate text-slate-600">{cat.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCatalogue(idx)}
                      className="h-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                    >
                      {t('admin.form.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 md:col-span-2 xl:col-span-2">
          <RichTextTextarea
            id="description"
            name={form.register('description').name}
            label={t('admin.form.description')}
            rows={5}
            value={previewDescription}
            onBlur={form.register('description').onBlur}
            onChange={(value) => form.setValue('description', value, { shouldDirty: true, shouldValidate: true })}
            error={form.formState.errors.description?.message}
          />
        </div>

        <div className="space-y-2 md:col-span-2 xl:col-span-2">
          <RichTextTextarea
            id="descriptionFr"
            name={form.register('descriptionFr').name}
            label={t('admin.form.descriptionFr')}
            rows={4}
            value={previewDescriptionFr}
            onBlur={form.register('descriptionFr').onBlur}
            onChange={(value) => form.setValue('descriptionFr', value, { shouldDirty: true, shouldValidate: true })}
          />
        </div>

        <div className="space-y-2 md:col-span-2 xl:col-span-2">
          <RichTextTextarea
            id="descriptionEs"
            name={form.register('descriptionEs').name}
            label={t('admin.form.descriptionEs')}
            rows={4}
            value={previewDescriptionEs}
            onBlur={form.register('descriptionEs').onBlur}
            onChange={(value) => form.setValue('descriptionEs', value, { shouldDirty: true, shouldValidate: true })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('admin.form.status')}</Label>
          <Select value={previewStatus} onValueChange={(value) => form.setValue('status', value as Product['status'])}>
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

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1 xl:row-span-3 xl:self-start">
          <h3 className="text-lg font-semibold text-slate-900">{t('admin.form.previewTitle')}</h3>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <img src={previewPrimaryImage} alt={watchedValues.title || 'Preview'} className="h-44 w-full rounded-xl object-cover" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
                {watchedValues.category
                  ? getProductCategoryLabel(
                      {
                        category: watchedValues.category,
                        customCategoryName: watchedValues.customCategoryName,
                      },
                      t
                    )
                  : '-'}
              </p>
              <h4 className="text-xl font-semibold text-slate-950">{watchedValues.title || '-'}</h4>
              <p className="line-clamp-3 text-sm text-slate-600">{stripRichText(watchedValues.description || '') || '-'}</p>
              <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>{t('admin.form.brand')}: {watchedValues.brand || '-'}</p>
                <p>{t('admin.form.price')}: {watchedValues.price ? formatCurrency(Number(watchedValues.price), i18n.language) : '-'}</p>
                <p>{t('admin.form.year')}: {watchedValues.year ? String(watchedValues.year) : '-'}</p>
                <p>{t('admin.form.modelYear')}: {previewStockType === 'used' && watchedValues.modelYear ? String(watchedValues.modelYear) : '-'}</p>
                <p>{t('admin.form.mileage')}: {watchedValues.mileageKm !== undefined ? String(watchedValues.mileageKm) : '-'}</p>
                <p>{t('admin.form.stockType')}: {getStockTypeLabel(previewStockType, t)}</p>
                <p>{t('admin.form.source')}: {getSourceLabel(previewSource, t)}</p>
                <p>
                  {t('admin.form.transmission')}:{' '}
                  {previewStockType === 'used' && previewTransmission !== 'not-specified'
                    ? getLocalizedTransmissionName(previewTransmission as ProductTransmissionType, t)
                    : '-'}
                </p>
                <p>
                  {t('admin.form.dedouanee')}:{' '}
                  {previewStockType === 'new'
                    ? '-'
                    : previewDedouanee === 'yes'
                      ? t('usedFilters.dedouaneeYes')
                      : previewDedouanee === 'no'
                        ? t('usedFilters.dedouaneeNo')
                        : t('admin.form.dedouaneeNotSpecified')}
                </p>
                <p>{t('admin.form.status')}: {watchedValues.status ? getLocalizedStatusName(watchedValues.status, t) : '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 pt-4 md:col-span-2 xl:col-span-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isStandaloneEditor) {
                window.close();
                navigate('/admin', { replace: true });
                return;
              }

              setIsDialogOpen(false);
            }}
          >
            {t('admin.cancel')}
          </Button>
          <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90">
            {editingProduct ? t('admin.saveChanges') : t('admin.createProduct')}
          </Button>
        </DialogFooter>
      </form>
    </>
  );

  if (isStandaloneEditor) {
    return (
      <section className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto space-y-8 px-4 pb-20">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('admin.eyebrow')}</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-950">
                {isStandaloneEdit ? t('admin.dialog.editTitle') : t('admin.dialog.addTitle')}
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">{t('admin.dialog.description')}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => navigate('/admin', { replace: true })}>
              {t('admin.cancel')}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[32px] border-0 bg-slate-100 shadow-2xl">{productEditorContent}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('admin.eyebrow')}</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">{t('admin.title')}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">{t('admin.description')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => exportProductsToCsv(sortedProducts)}>
              {t('admin.exportCsv')}
            </Button>
            <Button variant="outline" onClick={openCreateOrderDialog}>
              {t('admin.orders.addOrder')}
            </Button>
            <Button className="bg-brand-blue text-white hover:bg-brand-blue/90" onClick={openCreateProductDialog}>
              {t('admin.addProduct')}
            </Button>
          </div>
        </div>

        {/* Analytics Stats */}
        {analytics && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Registered Users', value: analytics.totalUsers, color: 'text-brand-blue' },
              { label: 'Total Products', value: analytics.totalProducts, color: 'text-slate-800' },
              { label: 'Available Stock', value: analytics.availableProducts, color: 'text-emerald-600' },
              { label: 'Total Orders', value: analytics.totalOrders, color: 'text-amber-600' },
              { label: 'Active Orders', value: analytics.activeOrders, color: 'text-indigo-600' },
              { label: 'Lead Requests', value: analytics.totalLeads, color: 'text-rose-600' },
            ].map((stat) => (
              <Card key={stat.label} className="rounded-2xl border-0 shadow-md text-center py-6">
                <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.accounts.createTitle')}</CardTitle>
              <CardDescription>{t('admin.accounts.createDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateAdmin}>
                <div className="space-y-2">
                  <Label htmlFor="adminFullName">{t('admin.accounts.form.fullName')}</Label>
                  <Input id="adminFullName" value={newAdminFullName} onChange={(event) => setNewAdminFullName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">{t('admin.accounts.form.email')}</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={newAdminEmail}
                    onChange={(event) => setNewAdminEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">{t('admin.accounts.form.password')}</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={newAdminPassword}
                    onChange={(event) => setNewAdminPassword(event.target.value)}
                  />
                  <p className="text-xs text-slate-500">{t('admin.accounts.form.passwordHint')}</p>
                </div>
                <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90" disabled={isCreatingAdmin}>
                  {isCreatingAdmin ? t('admin.accounts.creating') : t('admin.accounts.createAction')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>{t('admin.accounts.title')}</CardTitle>
              <CardDescription>{t('admin.accounts.count', { count: adminUsers.length })}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.accounts.table.fullName')}</TableHead>
                    <TableHead>{t('admin.accounts.table.email')}</TableHead>
                    <TableHead>{t('admin.accounts.table.role')}</TableHead>
                    <TableHead className="text-right">{t('admin.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                        {t('admin.accounts.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    adminUsers.map((adminUser) => (
                      <TableRow key={adminUser.id}>
                        <TableCell className="font-medium text-slate-900">{adminUser.fullName}</TableCell>
                        <TableCell>{adminUser.email}</TableCell>
                        <TableCell>{t('admin.accounts.roleLabel')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {adminUser.id === user?.id ? (
                              <Button variant="outline" size="sm" disabled>
                                {t('admin.accounts.currentAdmin')}
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={deletingAdminId === adminUser.id}
                                onClick={() => handleDeleteAdmin(adminUser)}
                              >
                                {deletingAdminId === adminUser.id ? t('admin.accounts.deleting') : t('admin.delete')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>{t('admin.productsTitle')}</CardTitle>
            <CardDescription>{t('admin.productsCount', { count: sortedProducts.length })}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('admin.table.title')}</TableHead>
                  <TableHead>{t('admin.table.category')}</TableHead>
                  <TableHead>{t('admin.table.brand')}</TableHead>
                  <TableHead>{t('admin.table.stockType')}</TableHead>
                  <TableHead>{t('admin.table.source')}</TableHead>
                  <TableHead>{t('admin.table.dedouanee')}</TableHead>
                  <TableHead>{t('admin.table.year')}</TableHead>
                  <TableHead>{t('admin.table.modelYear')}</TableHead>
                  <TableHead>{t('admin.table.transmission')}</TableHead>
                  <TableHead>{t('admin.table.price')}</TableHead>
                  <TableHead>{t('admin.table.status')}</TableHead>
                  <TableHead className="text-right">{t('admin.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{getLocalizedProductTitle(product, i18n.language)}</TableCell>
                    <TableCell>{getProductCategoryLabel(product, t)}</TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell>{getStockTypeLabel(product.stockType ?? 'used', t)}</TableCell>
                    <TableCell>{getSourceLabel(product.source ?? 'sakitrailer29', t)}</TableCell>
                    <TableCell>
                      {product.stockType === 'new'
                        ? '-'
                        : product.dedouanee === true
                          ? t('usedFilters.dedouaneeYes')
                          : product.dedouanee === false
                            ? t('usedFilters.dedouaneeNo')
                            : t('admin.form.dedouaneeNotSpecified')}
                    </TableCell>
                    <TableCell>{product.year}</TableCell>
                    <TableCell>{product.stockType === 'used' ? product.modelYear ?? '-' : '-'}</TableCell>
                    <TableCell>
                      {product.stockType === 'used' && product.transmission
                        ? getLocalizedTransmissionName(product.transmission, t)
                        : '-'}
                    </TableCell>
                    <TableCell>{formatCurrency(product.price, i18n.language)}</TableCell>
                    <TableCell>{getLocalizedStatusName(product.status, t)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onMouseEnter={preloadAdminProductEdit} onFocus={preloadAdminProductEdit} onClick={() => openEditDialog(product)}>
                          {t('admin.edit')}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                          {t('admin.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>{t('admin.orders.title')}</CardTitle>
            <CardDescription>{t('admin.orders.count', { count: sortedOrders.length })}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.orders.table.orderNumber')}</TableHead>
                  <TableHead>{t('admin.orders.table.user')}</TableHead>
                  <TableHead>{t('admin.orders.table.status')}</TableHead>
                  <TableHead>{t('admin.orders.table.productId')}</TableHead>
                  <TableHead>{t('admin.orders.table.updatedAt')}</TableHead>
                  <TableHead className="text-right">{t('admin.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.userName ?? t('admin.orders.unassigned')}</TableCell>
                    <TableCell>{t(`orders.status.${order.status}`)}</TableCell>
                    <TableCell>{order.productId ?? '-'}</TableCell>
                    <TableCell>{new Date(order.updatedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditOrderDialog(order)}>
                        {t('admin.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-xl">
          <CardHeader>
            <CardTitle>{t('admin.leads.title')}</CardTitle>
            <CardDescription>{t('admin.leads.count', { count: sortedLeads.length })}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.leads.table.date')}</TableHead>
                  <TableHead>{t('admin.leads.table.customer')}</TableHead>
                  <TableHead>{t('admin.leads.table.contact')}</TableHead>
                  <TableHead>{t('admin.leads.table.product')}</TableHead>
                  <TableHead>{t('admin.leads.table.preferredContact')}</TableHead>
                  <TableHead>{t('admin.leads.table.message')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                      {t('admin.leads.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedLeads.map((lead) => {
                    const relatedProduct = lead.productId
                      ? products.find((product) => product.id === lead.productId)
                      : undefined;

                    return (
                      <TableRow key={lead.id}>
                        <TableCell>{new Date(lead.createdAt).toLocaleString(i18n.language)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900">{lead.fullName}</p>
                            <p className="text-xs text-slate-500">{lead.language?.toUpperCase() ?? 'EN'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{lead.phone}</p>
                            <p className="text-slate-500">{lead.email ?? t('common.notAvailable')}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {relatedProduct ? getLocalizedProductTitle(relatedProduct, i18n.language) : lead.productId ?? '-'}
                        </TableCell>
                        <TableCell>{t(`leadForm.contactOptions.${lead.preferredContact}`)}</TableCell>
                        <TableCell className="max-w-md whitespace-normal text-sm text-slate-600">{lead.message}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="grid h-[94vh] w-[min(96vw,1360px)] max-w-7xl grid-rows-[auto,minmax(0,1fr)] overflow-hidden rounded-[32px] border-0 bg-slate-100 p-0 shadow-2xl">
          {productEditorContent}
        </DialogContent>
      </Dialog>

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="grid h-[90vh] w-[min(94vw,980px)] max-w-4xl grid-rows-[auto,minmax(0,1fr)] overflow-hidden rounded-[28px] border-0 bg-slate-100 p-0 shadow-2xl">
          <DialogHeader className="border-b border-white/10 bg-gradient-to-r from-slate-900 to-brand-blue px-6 py-6 text-left text-white">
            <DialogTitle className="text-2xl font-semibold">
              {editingOrder ? t('admin.orders.editTitle') : t('admin.orders.addTitle')}
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-blue-50/90">{t('admin.orders.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <form className="grid min-h-0 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2" onSubmit={orderForm.handleSubmit(onOrderSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="orderNumber">{t('admin.orders.form.orderNumber')}</Label>
              <Input id="orderNumber" {...orderForm.register('orderNumber')} />
              {orderForm.formState.errors.orderNumber ? (
                <p className="text-sm text-red-500">{orderForm.formState.errors.orderNumber.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t('admin.orders.form.user')}</Label>
              <Select value={watchedOrderUserId} onValueChange={(value) => orderForm.setValue('userId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">{t('admin.orders.unassigned')}</SelectItem>
                  {customerUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderProductId">{t('admin.orders.form.productId')}</Label>
              <Input id="orderProductId" {...orderForm.register('productId')} />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.orders.form.status')}</Label>
              <Select
                value={watchedOrderStatus}
                onValueChange={(value) => orderForm.setValue('status', value as Order['status'])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`orders.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="orderNotes">{t('admin.orders.form.notes')}</Label>
              <Textarea id="orderNotes" rows={4} {...orderForm.register('notes')} />
            </div>

            <DialogFooter className="border-t border-slate-200 pt-4 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                {t('admin.cancel')}
              </Button>
              <Button type="submit" className="bg-brand-blue text-white hover:bg-brand-blue/90">
                {editingOrder ? t('admin.saveChanges') : t('admin.orders.createOrder')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
