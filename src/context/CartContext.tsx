'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  barcode: string;
  priceMnt: number;
  originalPriceMnt?: number | null;
  discountPriceMnt?: number | null;
  imageUrl?: string | null;
  selectedImageUrl?: string | null; // the specific image the customer chose (e.g. a colour variant)
  stock: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number, selectedImageUrl?: string | null) => void;
  addBundleToCart: (bundle: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  totalItems: number;
  totalAmountMnt: number;
  originalTotalAmountMnt: number;

  // Wishlist & Compare
  savedItems: any[];
  toggleSave: (product: any) => boolean; // returns isSaved boolean
  isSaved: (productId: string) => boolean;
  isSavedOpen: boolean;
  setIsSavedOpen: (open: boolean) => void;

  compareItems: any[];
  toggleCompare: (product: any) => boolean; // returns isCompared boolean
  isCompared: (productId: string) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [compareItems, setCompareItems] = useState<any[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSavedOpen, setIsSavedOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('inky_cart');
      const savedWishlist = localStorage.getItem('inky_wishlist');
      const savedCompare = localStorage.getItem('inky_compare');

      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setSavedItems(JSON.parse(savedWishlist));
      if (savedCompare) setCompareItems(JSON.parse(savedCompare));
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inky_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Save wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inky_wishlist', JSON.stringify(savedItems));
    } catch (e) {
      console.error(e);
    }
  }, [savedItems]);

  // Save compare to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('inky_compare', JSON.stringify(compareItems));
    } catch (e) {
      console.error(e);
    }
  }, [compareItems]);

  const addBundleToCart = (bundle: any, quantity = 1) => {
    const bundleCartId = `bundle-${bundle.id}`;
    const bundleName = bundle.name.startsWith('🎁') ? bundle.name : `🎁 [БАГЦ] ${bundle.name}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === bundleCartId);
      if (existing) {
        return prevCart.map((item) =>
          item.id === bundleCartId ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: bundleCartId,
            name: bundleName,
            barcode: `BUNDLE-${String(bundle.id).slice(0, 8)}`,
            priceMnt: bundle.bundlePriceMnt,
            originalPriceMnt: bundle.originalPriceMnt || bundle.bundlePriceMnt,
            discountPriceMnt: null,
            imageUrl: bundle.imageUrl || (bundle.items?.[0]?.product?.imageUrl) || 'https://images.unsplash.com/photo-1585336261026-875a60a1c92f?w=600&auto=format&fit=crop&q=80',
            stock: 999,
            quantity: quantity,
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const addToCart = (product: any, quantity = 1, selectedImageUrl?: string | null) => {
    if (product.bundlePriceMnt || product.isBundle) {
      addBundleToCart(product, quantity);
      return;
    }

    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        return prevCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: newQty,
                // Update selectedImageUrl if a new one was specified
                selectedImageUrl: selectedImageUrl !== undefined ? selectedImageUrl : item.selectedImageUrl,
              }
            : item
        );
      } else {
        const itemPrice = product.isDiscounted && product.discountPriceMnt
          ? product.discountPriceMnt
          : product.priceMnt;

        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            priceMnt: itemPrice,
            originalPriceMnt: product.priceMnt,
            discountPriceMnt: product.discountPriceMnt,
            imageUrl: product.imageUrl,
            selectedImageUrl: selectedImageUrl ?? null,
            stock: product.stock,
            quantity: Math.min(quantity, product.stock),
          },
        ];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleSave = (product: any) => {
    let nowSaved = false;
    setSavedItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        nowSaved = false;
        return prev.filter((item) => item.id !== product.id);
      } else {
        nowSaved = true;
        return [...prev, product];
      }
    });
    return nowSaved;
  };

  const isSaved = (productId: string) => {
    return savedItems.some((item) => item.id === productId);
  };

  const toggleCompare = (product: any) => {
    let nowCompared = false;
    setCompareItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        nowCompared = false;
        return prev.filter((item) => item.id !== product.id);
      } else {
        nowCompared = true;
        return [...prev, product];
      }
    });
    return nowCompared;
  };

  const isCompared = (productId: string) => {
    return compareItems.some((item) => item.id === productId);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmountMnt = cart.reduce((sum, item) => sum + item.priceMnt * item.quantity, 0);
  const originalTotalAmountMnt = cart.reduce(
    (sum, item) => sum + (item.originalPriceMnt || item.priceMnt) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addBundleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        totalItems,
        totalAmountMnt,
        originalTotalAmountMnt,
        savedItems,
        toggleSave,
        isSaved,
        isSavedOpen,
        setIsSavedOpen,
        compareItems,
        toggleCompare,
        isCompared,
        isCompareOpen,
        setIsCompareOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
