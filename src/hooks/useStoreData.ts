import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth, signInWithGoogle, signOutUser } from '../firebase';
import { Product, Order, StoreSettings, Category } from '../types';
import { DEFAULT_PRODUCTS, CATEGORIES } from '../data';
import { onAuthStateChanged } from 'firebase/auth';

export function useStoreData() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    name: 'Makeup',
    slogan: 'Beleza que cabe no seu bolso',
    phone: '5566996316766',
    ig: 'https://instagram.com',
    password: 'admin'
  });
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.email === 'vitorsori4@gmail.com' && user?.emailVerified;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  // Fetch / Sync Settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/store', false);
    });
    return () => unsub();
  }, []);

  // Fetch / Sync Categories
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (!snapshot.empty) {
        setCategories(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories', false);
    });
    return () => unsub();
  }, []);

  // Fetch / Sync Products
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), async (snapshot) => {
      if (!snapshot.empty) {
        setProducts(snapshot.docs.map(d => ({ ...d.data(), id: Number(d.id) } as any)).sort((a, b) => b.id - a.id));
      } else {
        // Automatically seed products if empty and user is admin
        if (isAdmin) {
          try {
            const batch = writeBatch(db);
            for (const prod of DEFAULT_PRODUCTS) {
              const { id, ...productData } = prod;
              batch.set(doc(db, 'products', String(prod.id)), productData);
            }
            await batch.commit();
          } catch (e) {
            console.error('Failed to seed products', e);
          }
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products', false);
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin]);

  // Seeding categories
  useEffect(() => {
    if (isAdmin && categories.length === 0) {
      const seedCats = async () => {
        try {
          const batch = writeBatch(db);
          for (const cat of CATEGORIES) {
            batch.set(doc(db, 'categories', cat.name), cat);
          }
          await batch.commit();
        } catch (e) {
          console.error('Failed to seed categories', e);
        }
      };
      seedCats();
    }
  }, [isAdmin, categories.length]);

  // Fetch / Sync Orders (Admin only)
  useEffect(() => {
    if (isAdmin) {
      const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
        setOrders(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)));
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders', false);
      });
      return () => unsub();
    }
  }, [isAdmin]);

  // Seeding initial data if empty (Client side check for simplicity, ideally done via a script)
  // We can skip seeding to avoid permission issues if the user is not admin.
  // We will let the app run empty and the admin can seed.

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const id = Date.now();
      await setDoc(doc(db, 'products', String(id)), { ...product });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  const updateProduct = async (id: number, product: Omit<Product, 'id'>) => {
    try {
      await updateDoc(doc(db, 'products', String(id)), { ...product });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'products', String(id)));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const saveSettings = async (newSettings: StoreSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'store'), newSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'settings/store');
    }
  };

  const saveOrder = async (orderData: Omit<Order, 'id' | 'date' | 'firebaseId'>) => {
    try {
      const orderId = String(Date.now());
      await setDoc(doc(db, 'orders', orderId), {
        date: new Date().toLocaleString('pt-BR'),
        items: orderData.items,
        total: orderData.total,
        status: orderData.status,
        customer: orderData.customer || 'Cliente',
        deliveryMethod: orderData.deliveryMethod || 'store',
        deliveryType: orderData.deliveryType || (orderData.deliveryMethod === 'store' ? 'pickup' : 'delivery'),
        ...(orderData.address && { address: orderData.address }),
        ...(orderData.shippingDetails && { shippingDetails: orderData.shippingDetails }),
        ...(orderData.paymentMethod && { paymentMethod: orderData.paymentMethod })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `orders/${Date.now()}`);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const addCategory = async (category: any) => {
    try {
      await setDoc(doc(db, 'categories', category.name), category);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${category.name}`);
    }
  };

  const updateCategory = async (oldName: string, newCategory: any) => {
    try {
      if (oldName !== newCategory.name) {
        await setDoc(doc(db, 'categories', newCategory.name), newCategory);
        await deleteDoc(doc(db, 'categories', oldName));
      } else {
        await updateDoc(doc(db, 'categories', oldName), newCategory);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${oldName}`);
    }
  };

  const deleteCategory = async (name: string) => {
    try {
      await deleteDoc(doc(db, 'categories', name));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${name}`);
    }
  };

  return {
    products,
    orders,
    settings,
    categories,
    loading,
    user,
    isAdmin,
    login: signInWithGoogle,
    logout: signOutUser,
    addProduct,
    updateProduct,
    deleteProduct,
    saveSettings,
    saveOrder,
    updateOrderStatus,
    addCategory,
    updateCategory,
    deleteCategory
  };
}
