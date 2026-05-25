import { create } from 'zustand';
import { products as initialProducts } from './data/products';
import type { Product } from './context/CartContext';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  organization: string;
  address: string;
  reference: string;
  status: 'pending' | 'confirmed';
  items: any[];
  total: number;
  userId?: string;
  guestName?: string;
  guestPhone?: string;
}

type AuthActionResult = {
  success: boolean;
  error?: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type ProfileRow = {
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'admin' | null;
};

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  category: string;
  image: string;
  description: string;
  ingredients: string[] | null;
  allergens: Record<string, boolean> | null;
  flavors: string[] | null;
  quantity: string | null;
  gallery_images: string[] | null;
  reference_images: string[] | null;
  videos: any[] | null;
  is_featured: boolean | null;
  featured_background_image: string | null;
};

type OrderItemRow = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number | string;
  subtotal: number | string;
};

type OrderRow = {
  id: string;
  user_id: string | null;
  reservation_number: string;
  organization: string | null;
  full_name: string;
  phone: string;
  address: string;
  reference: string | null;
  delivery_date: string;
  total: number | string;
  status: string;
  created_at: string;
  order_items?: OrderItemRow[];
};

interface AppState {
  user: User | null;
  users: User[];
  products: Product[];
  categories: string[];
  reservations: Reservation[];
  authLoading: boolean;

  initializeAuth: () => Promise<void>;
  loadCatalogData: () => Promise<void>;
  loadReservations: () => Promise<void>;

  login: (
    emailOrUser: string | User,
    password?: string
  ) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  register: (user: RegisterData) => Promise<AuthActionResult>;
  updateProfile: (data: Partial<User>) => Promise<AuthActionResult>;

  addCategory: (category: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  deleteCategory: (name: string) => void;

  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addReservation: (reservation: Omit<Reservation, 'id'>) => void;
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
}

const fallbackAllergens: Record<string, boolean> = {
  gluten: false,
  lactose: false,
  nuts: false,
};

const mapSupabaseUser = async (
  authUserId: string,
  email: string
): Promise<User> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', authUserId)
    .maybeSingle();

  const profileRow = profile as ProfileRow | null;

  return {
    id: authUserId,
    email,
    name: profileRow?.full_name || email.split('@')[0],
    phone: profileRow?.phone || undefined,
    role: profileRow?.role === 'admin' ? 'admin' : 'user',
  };
};

const normalizeVideos = (videos: unknown): any[] => {
  if (!Array.isArray(videos)) {
    return [];
  }

  return videos.filter(Boolean);
};

const mapProductFromDatabase = (product: ProductRow): Product => {
  const galleryImages =
    product.gallery_images && product.gallery_images.length > 0
      ? product.gallery_images
      : [product.image, ...(product.reference_images || [])].filter(Boolean);

  const mappedProduct: any = {
    id: product.id,
    name: product.name,
    price: Number(product.price),
    category: product.category,
    image: product.image,
    description: product.description,
    ingredients: product.ingredients || [],
    allergens: product.allergens || fallbackAllergens,
    flavors: product.flavors || [],
    quantity: product.quantity || '',
    galleryImages,
    referenceImages: product.reference_images || galleryImages.slice(1),
    videos: normalizeVideos(product.videos),
    isFeatured: Boolean(product.is_featured),
    featuredBackgroundImage: product.featured_background_image || product.image,
  };

  return mappedProduct as Product;
};

const mapProductToDatabase = (product: any) => {
  const galleryImages =
    Array.isArray(product.galleryImages) && product.galleryImages.length > 0
      ? product.galleryImages
      : [
          product.image,
          ...(Array.isArray(product.referenceImages)
            ? product.referenceImages
            : []),
        ].filter(Boolean);

  const referenceImages =
    Array.isArray(product.referenceImages) && product.referenceImages.length > 0
      ? product.referenceImages
      : galleryImages.slice(1);

  const videos = Array.isArray(product.videos)
    ? product.videos
    : product.video
      ? [
          {
            title: 'Preparación',
            thumbnail: product.image,
            video: product.video,
            description: `Mira la preparación de ${product.name}.`,
          },
        ]
      : [];

  return {
    name: product.name,
    price: Number(product.price) || 0,
    category: product.category,
    image: product.image,
    description: product.description || '',
    ingredients: Array.isArray(product.ingredients) ? product.ingredients : [],
    allergens: product.allergens || fallbackAllergens,
    flavors: Array.isArray(product.flavors) ? product.flavors : [],
    quantity: product.quantity || null,
    gallery_images: galleryImages,
    reference_images: referenceImages,
    videos,
    is_featured: Boolean(product.isFeatured),
    featured_background_image:
      product.featuredBackgroundImage || product.image || null,
  };
};

const seedInitialCatalogIfEmpty = async () => {
  const { data: existingProducts, error } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (error || (existingProducts && existingProducts.length > 0)) {
    return;
  }

  const initialCategories = Array.from(
    new Set(initialProducts.map((product) => product.category))
  );

  await supabase.from('categories').upsert(
    initialCategories.map((name) => ({ name })),
    { onConflict: 'name' }
  );

  await supabase
    .from('products')
    .insert(initialProducts.map((product) => mapProductToDatabase(product)));
};

const mapOrderStatus = (status: string): Reservation['status'] => {
  if (status === 'confirmed' || status === 'confirmado') {
    return 'confirmed';
  }

  return 'pending';
};

const mapReservationStatusToDatabase = (
  status: Reservation['status']
): string => {
  return status === 'confirmed' ? 'confirmado' : 'pendiente';
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  users: [],
  products: initialProducts,
  categories: Array.from(new Set(initialProducts.map((p) => p.category))),
  reservations: [],
  authLoading: false,

  initializeAuth: async () => {
    set({ authLoading: true });

    await get().loadCatalogData();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      set({ user: null, authLoading: false });
      return;
    }

    const currentUser = await mapSupabaseUser(
      data.user.id,
      data.user.email || ''
    );

    set({ user: currentUser, authLoading: false });

    if (currentUser.role === 'admin') {
      await seedInitialCatalogIfEmpty();
      await get().loadCatalogData();
      await get().loadReservations();
    }
  },

  loadCatalogData: async () => {
    const { data: categoryRows, error: categoryError } = await supabase
      .from('categories')
      .select('name')
      .order('name', { ascending: true });

    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    const productsFromDatabase =
      !productError && productRows && productRows.length > 0
        ? (productRows as ProductRow[]).map(mapProductFromDatabase)
        : initialProducts;

    const categoriesFromDatabase =
      !categoryError && categoryRows && categoryRows.length > 0
        ? categoryRows.map((category) => category.name)
        : Array.from(
            new Set(productsFromDatabase.map((product) => product.category))
          );

    set({
      products: productsFromDatabase,
      categories: categoriesFromDatabase,
    });
  },

  loadReservations: async () => {
    const currentUser = get().user;

    if (!currentUser) {
      set({ reservations: [] });
      return;
    }

    let query = supabase
      .from('orders')
      .select(
        `
        id,
        user_id,
        reservation_number,
        organization,
        full_name,
        phone,
        address,
        reference,
        delivery_date,
        total,
        status,
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          subtotal
        )
      `
      )
      .order('created_at', { ascending: false });

    if (currentUser.role !== 'admin') {
      query = query.eq('user_id', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error cargando reservas:', error.message);
      return;
    }

    const currentProducts = get().products;

    const reservationsFromDatabase = ((data || []) as OrderRow[]).map(
      (order) => ({
        id: order.id,
        date: order.delivery_date,
        time: '12:00 PM - 6:00 PM',
        organization: order.organization || '',
        address: order.address,
        reference: order.reference || '',
        status: mapOrderStatus(order.status),
        total: Number(order.total),
        userId: order.user_id || undefined,
        guestName: order.full_name,
        guestPhone: order.phone,
        items: (order.order_items || []).map((item) => {
          const product = currentProducts.find(
            (currentProduct) => currentProduct.id === item.product_id
          );

          return {
            id: item.product_id,
            name: item.product_name,
            image: product?.image || '',
            price: Number(item.price),
            cartQuantity: item.quantity,
          };
        }),
      })
    );

    set({ reservations: reservationsFromDatabase });
  },

  login: async (emailOrUser, password) => {
    if (typeof emailOrUser !== 'string') {
      set({ user: emailOrUser });
      return { success: true };
    }

    if (!password) {
      return {
        success: false,
        error: 'Ingresa tu contraseña.',
      };
    }

    set({ authLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailOrUser,
      password,
    });

    if (error || !data.user) {
      set({ authLoading: false });

      return {
        success: false,
        error: error?.message || 'No se pudo iniciar sesión.',
      };
    }

    const loggedUser = await mapSupabaseUser(data.user.id, data.user.email || '');

    set({
      user: loggedUser,
      authLoading: false,
    });

    if (loggedUser.role === 'admin') {
      await seedInitialCatalogIfEmpty();
      await get().loadCatalogData();
      await get().loadReservations();
    } else {
      await get().loadCatalogData();
    }

    return { success: true };
  },

  logout: async () => {
    await supabase.auth.signOut();

    set({
      user: null,
      reservations: [],
    });
  },

  register: async ({ name, email, password, phone }) => {
    set({ authLoading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          phone: phone || '',
        },
      },
    });

    if (error || !data.user) {
      set({ authLoading: false });

      return {
        success: false,
        error: error?.message || 'No se pudo registrar el usuario.',
      };
    }

    await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone: phone || null,
      })
      .eq('id', data.user.id);

    const newUser = await mapSupabaseUser(data.user.id, data.user.email || email);

    set({
      user: newUser,
      authLoading: false,
    });

    return { success: true };
  },

  updateProfile: async (data) => {
    const currentUser = get().user;

    if (!currentUser) {
      return {
        success: false,
        error: 'No hay un usuario activo.',
      };
    }

    set({ authLoading: true });

    if (data.email && data.email !== currentUser.email) {
      const { error } = await supabase.auth.updateUser({
        email: data.email,
      });

      if (error) {
        set({ authLoading: false });

        return {
          success: false,
          error: error.message,
        };
      }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: data.name ?? currentUser.name,
        phone: data.phone ?? currentUser.phone ?? null,
      })
      .eq('id', currentUser.id);

    if (profileError) {
      set({ authLoading: false });

      return {
        success: false,
        error: profileError.message,
      };
    }

    const updatedUser: User = {
      ...currentUser,
      ...data,
    };

    set({
      user: updatedUser,
      authLoading: false,
    });

    return { success: true };
  },

  addCategory: (category) => {
    const cleanCategory = category.trim();

    if (!cleanCategory) {
      return;
    }

    set((state) => ({
      categories: state.categories.includes(cleanCategory)
        ? state.categories
        : [...state.categories, cleanCategory],
    }));

    void (async () => {
      const { error } = await supabase
        .from('categories')
        .insert({ name: cleanCategory });

      if (error) {
        console.error('Error agregando categoría:', error.message);
      }

      await get().loadCatalogData();
    })();
  },

  updateCategory: (oldName, newName) => {
    const cleanNewName = newName.trim();

    if (!cleanNewName) {
      return;
    }

    set((state) => ({
      categories: state.categories.map((category) =>
        category === oldName ? cleanNewName : category
      ),
      products: state.products.map((product) =>
        product.category === oldName
          ? { ...product, category: cleanNewName }
          : product
      ),
    }));

    void (async () => {
      const { error: categoryError } = await supabase
        .from('categories')
        .update({ name: cleanNewName })
        .eq('name', oldName);

      const { error: productError } = await supabase
        .from('products')
        .update({ category: cleanNewName })
        .eq('category', oldName);

      if (categoryError) {
        console.error('Error actualizando categoría:', categoryError.message);
      }

      if (productError) {
        console.error(
          'Error actualizando categoría en productos:',
          productError.message
        );
      }

      await get().loadCatalogData();
    })();
  },

  deleteCategory: (name) => {
    set((state) => ({
      categories: state.categories.filter((category) => category !== name),
    }));

    void (async () => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('name', name);

      if (error) {
        console.error('Error eliminando categoría:', error.message);
      }

      await get().loadCatalogData();
    })();
  },

  addProduct: (product) => {
    const tempProduct = {
      ...(product as any),
      id: uuidv4(),
    } as Product;

    set((state) => ({
      products: [tempProduct, ...state.products],
    }));

    void (async () => {
      const { error } = await supabase
        .from('products')
        .insert(mapProductToDatabase(product));

      if (error) {
        console.error('Error agregando producto:', error.message);
      }

      await get().loadCatalogData();
    })();
  },

  updateProduct: (id, updatedProduct) => {
    const currentProduct = get().products.find((product) => product.id === id);

    if (!currentProduct) {
      return;
    }

    const mergedProduct = {
      ...(currentProduct as any),
      ...(updatedProduct as any),
    };

    set((state) => ({
      products: state.products.map((product) =>
        product.id === id ? (mergedProduct as Product) : product
      ),
    }));

    void (async () => {
      const { error } = await supabase
        .from('products')
        .update(mapProductToDatabase(mergedProduct))
        .eq('id', id);

      if (error) {
        console.error('Error actualizando producto:', error.message);
      }

      await get().loadCatalogData();
    })();
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }));

    void (async () => {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        console.error('Error eliminando producto:', error.message);
      }

      await get().loadCatalogData();
    })();
  },

  addReservation: (reservation) => {
    set((state) => ({
      reservations: [{ ...reservation, id: uuidv4() }, ...state.reservations],
    }));
  },

  updateReservationStatus: (id, status) => {
    set((state) => ({
      reservations: state.reservations.map((reservation) =>
        reservation.id === id ? { ...reservation, status } : reservation
      ),
    }));

    void (async () => {
      const { error } = await supabase
        .from('orders')
        .update({
          status: mapReservationStatusToDatabase(status),
        })
        .eq('id', id);

      if (error) {
        console.error('Error actualizando reserva:', error.message);
      }

      await get().loadReservations();
    })();
  },
}));