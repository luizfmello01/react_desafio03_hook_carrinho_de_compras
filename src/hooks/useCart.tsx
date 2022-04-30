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
  cartItemsAmount: CartItemsAmount;
}

interface CartItemsAmount {
  [key: number]: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
        return JSON.parse(storagedCart);
    }

    return [];
  });

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    if ( sumAmount[product.id] ) {
      sumAmount[product.id] += product.amount;
    } else {
      sumAmount[product.id] = product.amount;
    }

    return sumAmount;
  }, {} as CartItemsAmount)

  const stockVerify = async (productId: number, qtdStock: number):Promise<boolean> => {
    const data = await api.get(`/stock/${productId}`).then(response => response.data);
    if (data.amount >= qtdStock) return true;

    return false;
  };

  const addProduct = async (productId: number) => {
    try {
      let newCart = Array<Product>();

      if ( cartItemsAmount[productId] === undefined ) {
        // Stock verify
        const hasStock = await stockVerify(productId, 1);

        if ( hasStock === false ) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const data = await api.get(`/products/${productId}`).then(response => response.data); 
        newCart = [...cart, {...data, amount: 1}];
      } else {
        const hasStock = await stockVerify(
          productId, 
          ((cart.find( cartItem => cartItem.id === productId )?.amount || 1) + 1)
        );

        if ( hasStock === false ) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        newCart = cart.map( cartItem => {
          if ( cartItem.id === productId ) {
            return {
              ...cartItem,
              amount: cartItem.amount + 1
            }
          } else {
            return cartItem;
          }
        } );
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find(cartItem => cartItem.id === productId) === undefined) {
        throw Error("Produto não está no carrinho")
      }

      const newCart = cart.filter( cartItem => {
        if ( cartItem.id !== productId ) return cartItem
      } );

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if ( amount <= 0 ) return;

      // Stock verify
      const hasStock = await stockVerify(productId, amount);

      if ( hasStock === false ) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map( cartItem => {
        if ( cartItem.id === productId ) {
          return {
            ...cartItem,
            amount: amount
          }
        } else {
          return cartItem;
        }
      } );

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      setCart(newCart);

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount, cartItemsAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}