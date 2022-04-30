import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);
  const { addProduct, cart, cartItemsAmount } = useCart();

  useEffect(() => {
    async function loadProducts() {
      const data = await api.get('/products').then(response => response.data);

      setProducts( data.map( (productItem: Product) => {
        return {
          ...productItem,
          priceFormatted: formatPrice(productItem.price)
        };
      } ) );
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    addProduct(id);
  }

  return (
    <ProductList>
      {products.map( product => {
        return (
          <li key={product.id}>
            <img src={product.image} alt={product.title} />
            <strong>{product.title}</strong>
            <span>{product.priceFormatted}</span>
            <button
              type="button"
              data-testid="add-product-button"
              onClick={() => handleAddProduct(product.id)}
            >
              <div data-testid="cart-product-quantity">
                <MdAddShoppingCart size={16} color="#FFF" />
                { cart.find(cartItem => cartItem.id === product.id)?.amount || 0 }
                {/*cartItemsAmount[product.id] || 0*/} 
              </div>

              <span>ADICIONAR AO CARRINHO</span>
            </button>
          </li>
        );
      } )}
    </ProductList>
  );
};

export default Home;
