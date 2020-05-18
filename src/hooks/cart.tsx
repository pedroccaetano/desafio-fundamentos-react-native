import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface AddedProduct {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity?: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: AddedProduct): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const retrieved = await AsyncStorage.getItem('@GoMarketplace:cart');
      if (retrieved) {
        try {
          setProducts(JSON.parse(retrieved) as Product[]);
        } catch (err) {
          // noop, but we should really have a proper Product list parser
          // to ensure what we are retrieving is compatible with our logic
        }
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async (addedProduct: AddedProduct) => {
    let newProducts = [] as Product[];

    setProducts(oldProducts => {
      let productExists = false;
      newProducts = oldProducts.map(product => {
        if (product.id === addedProduct.id) {
          productExists = true;
          return { ...product, quantity: product.quantity + 1 };
        }
        return product;
      });
      if (!productExists) {
        newProducts.push({ ...addedProduct, quantity: 1 });
      }
      return newProducts;
    });

    await AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(newProducts),
    );
  }, []);

  const increment = useCallback(async id => {
    let newProducts = [] as Product[];

    setProducts(oldProducts => {
      newProducts = oldProducts.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );
      return newProducts;
    });

    await AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(newProducts),
    );
  }, []);

  const decrement = useCallback(async id => {
    let newProducts = [] as Product[];

    setProducts(oldProducts => {
      newProducts = oldProducts.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity - 1 }
          : product,
      );
      newProducts = newProducts.filter(product => product.quantity > 0);
      return newProducts;
    });

    await AsyncStorage.setItem(
      '@GoMarketplace:cart',
      JSON.stringify(newProducts),
    );
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
