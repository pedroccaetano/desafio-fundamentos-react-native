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

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProductsData = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (storageProductsData) {
        setProducts(JSON.parse(storageProductsData));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const increment = useCallback(
    id => {
      const productIndex = products.findIndex(item => item.id === id);

      const product = products[productIndex];

      products[productIndex] = {
        ...product,
        quantity: product.quantity + 1,
      };

      setProducts([...products]);
    },
    [products],
  );

  const decrement = useCallback(
    id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex === -1) {
        throw Error('Produto não encontrado!');
      }

      const newProducts = [...products];

      if (products[productIndex].quantity === 1) {
        newProducts.splice(productIndex, 1);

        setProducts(products.filter(item => item.id !== id));

        return;
      }

      newProducts[productIndex] = {
        ...products[productIndex],
        quantity: products[productIndex].quantity - 1,
      };

      setProducts([...newProducts]);
    },
    [products],
  );

  const addToCart = useCallback(
    (product: Omit<Product, 'quantity'>) => {
      const productExits = products.findIndex(item => item.id === product.id);

      if (productExits < 0) {
        const newProduct = {
          ...product,
          quantity: 1,
        };

        setProducts([...products, newProduct]);

        return;
      }

      increment(product.id);
    },
    [products, increment],
  );

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
