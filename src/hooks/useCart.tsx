import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {      
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const found = cart.find(product => product.id === productId);

      if (found) {
        await updateProductAmount({ productId, amount: found.amount + 1});
        return;
      }    

      const response = await api.get<Product>(`/products/${productId}`)
      .catch(() => {
        throw new Error("Erro na adição do produto");
      });

      const newCart = [...cart, { ...response.data, amount: 1 }];

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

      setCart(newCart);
      toast.success("Produto adicionado ao carrinho");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const found = cart.find((product) => product.id === productId);

      if (!found) {
        throw new Error('Erro na remoção do produto');
      }
      const newCart = cart.filter(task => task.id !== productId);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      setCart(newCart);
      toast.success("Produto removido do carrinho");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const found = cart.find((product) => product.id === productId);

      if (!found || amount === 0) {
        throw new Error("Erro na alteração de quantidade do produto");
      }

      const response = await api.get<Stock>(`/stock/${productId}`);

      if (found) {
        if (response.data.amount < amount) {
          throw new Error("Quantidade solicitada fora de estoque");
        }

        const newCart = cart.map(product => {
          if (product.id === productId) {
            product.amount = amount;
          }
          return product;
        });

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        setCart(newCart);
        toast.success("Produto adicionado ao carrinho");
        return;
      }

      throw new Error("Erro na alteração de quantidade do produto");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
