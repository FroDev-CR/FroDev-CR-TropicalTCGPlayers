// src/contexts/CartContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, runTransaction } from 'firebase/firestore';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Cargar datos del usuario desde Firebase
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            
            // Cargar carrito del usuario desde Firebase
            const userCart = data.cart || [];
            setCart(userCart);
          } else {
            // Si el usuario no existe en Firestore, crear el documento
            const newUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email,
              createdAt: new Date(),
              cart: [],
              binders: [],
              listings: [],
              rating: 0,
              reviews: 0
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
            setUserData(newUserData);
            setCart([]);
          }
        } catch (error) {
          console.error('Error cargando datos del usuario:', error);
          // Fallback al localStorage si hay error
          const savedCart = localStorage.getItem('cart');
          if (savedCart) setCart(JSON.parse(savedCart));
        }
      } else {
        // Usuario no autenticado, usar localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) setCart(JSON.parse(savedCart));
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addToCart = async (listing, requestedQuantity = 1) => {
    try {
      // Verificar disponibilidad
      const availability = await checkListingAvailability(listing.id, requestedQuantity);
      
      if (!availability.available) {
        alert(`No se puede agregar al carrito: ${availability.reason}`);
        return false;
      }

      // Verificar si ya está en el carrito
      const existingItemIndex = cart.findIndex(item => item.id === listing.id);
      let newCart;
      
      if (existingItemIndex >= 0) {
        // Si ya existe, verificar si la nueva cantidad total no excede la disponible
        const currentQuantityInCart = cart[existingItemIndex].quantity || 1;
        const totalQuantity = currentQuantityInCart + requestedQuantity;
        
        if (totalQuantity > availability.availableQuantity) {
          alert(`Solo puedes agregar ${availability.availableQuantity - currentQuantityInCart} unidades más de esta carta`);
          return false;
        }
        
        newCart = [...cart];
        newCart[existingItemIndex].quantity = totalQuantity;
      } else {
        newCart = [...cart, { 
          ...listing, 
          quantity: requestedQuantity, 
          addedAt: new Date(),
          availableQuantity: availability.availableQuantity 
        }];
      }
      
      setCart(newCart);
      
      // Guardar en localStorage para usuarios no autenticados
      localStorage.setItem('cart', JSON.stringify(newCart));
      
      // Guardar en Firebase si el usuario está autenticado
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            cart: newCart
          });
        } catch (error) {
          console.error('Error guardando carrito en Firebase:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert('Error al agregar la carta al carrito');
      return false;
    }
  };

  const removeFromCart = async (listingId) => {
    const newCart = cart.filter(item => (item.listingId || item.id) !== listingId);
    setCart(newCart);
    
    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Guardar en Firebase si el usuario está autenticado
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          cart: newCart
        });
      } catch (error) {
        console.error('Error guardando carrito en Firebase:', error);
      }
    }
  };

  const updateCartItemQuantity = async (listingId, quantity) => {
    const newCart = cart.map(item => 
      item.id === listingId ? { ...item, quantity: Math.max(1, quantity) } : item
    );
    setCart(newCart);
    
    // Guardar en localStorage
    localStorage.setItem('cart', JSON.stringify(newCart));
    
    // Guardar en Firebase si el usuario está autenticado
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          cart: newCart
        });
      } catch (error) {
        console.error('Error guardando carrito en Firebase:', error);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem('cart');
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          cart: []
        });
      } catch (error) {
        console.error('Error limpiando carrito en Firebase:', error);
      }
    }
  };

  const syncUserData = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setCart(data.cart || []);
        }
      } catch (error) {
        console.error('Error sincronizando datos del usuario:', error);
      }
    }
  };

  const createTransaction = async (items, contactMethod = 'whatsapp', buyerNotes = '') => {
    if (!user || !items.length) return null;
    
    try {
      const transaction = {
        buyerId: user.uid,
        buyerName: userData?.username || userData?.displayName || user.email,
        buyerNotes: buyerNotes.trim(),
        items: items.map(item => ({
          listingId: item.id,
          cardId: item.cardId,
          cardName: item.cardName,
          cardImage: item.cardImage,
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          price: item.price,
          quantity: item.quantity || 1,
          condition: item.condition
        })),
        totalAmount: items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
        contactMethod,
        status: 'initiated', // initiated -> contacted -> completed -> rated
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const transactionRef = await addDoc(collection(db, 'transactions'), transaction);
      
      // Actualizar el carrito del usuario
      await clearCart();
      
      return transactionRef.id;
    } catch (error) {
      console.error('Error creando transacción:', error);
      return null;
    }
  };

  const updateTransactionStatus = async (transactionId, status) => {
    if (!user) return false;
    
    try {
      await updateDoc(doc(db, 'transactions', transactionId), {
        status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error actualizando transacción:', error);
      return false;
    }
  };

  // Funciones de inventario
  const checkListingAvailability = async (listingId, requestedQuantity = 1) => {
    try {
      const listingRef = doc(db, 'listings', listingId);
      const listingSnap = await getDoc(listingRef);
      
      if (!listingSnap.exists()) {
        return { available: false, reason: 'El listado no existe' };
      }

      const listingData = listingSnap.data();
      const availableQuantity = listingData.availableQuantity || listingData.quantity || 0;
      const status = listingData.status || 'active';
      
      if (status === 'inactive') {
        return { available: false, reason: 'El listado está inactivo' };
      }
      
      if (status === 'sold_out' || availableQuantity === 0) {
        return { available: false, reason: 'Producto agotado' };
      }
      
      if (availableQuantity < requestedQuantity) {
        return { 
          available: false, 
          reason: `Solo hay ${availableQuantity} unidad${availableQuantity > 1 ? 'es' : ''} disponible${availableQuantity > 1 ? 's' : ''}`,
          availableQuantity 
        };
      }

      return { 
        available: true, 
        availableQuantity,
        status: listingData.status 
      };
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
      return { available: false, reason: 'Error verificando disponibilidad' };
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  const reduceListingQuantity = async (listingId, quantityToReduce) => {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await transaction.get(listingRef);
        
        if (!listingSnap.exists()) {
          throw new Error('El listado no existe');
        }

        const listingData = listingSnap.data();
        const currentAvailable = listingData.availableQuantity || listingData.quantity || 0;
        
        if (currentAvailable < quantityToReduce) {
          throw new Error(`Solo hay ${currentAvailable} unidades disponibles`);
        }

        const newAvailable = currentAvailable - quantityToReduce;
        const newStatus = newAvailable === 0 ? 'sold_out' : 'active';
        
        transaction.update(listingRef, {
          availableQuantity: newAvailable,
          status: newStatus,
          updatedAt: new Date()
        });

        return { success: true, newAvailable, newStatus };
      });
      
      return result;
    } catch (error) {
      console.error('Error reduciendo cantidad del listado:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateCartItemQuantity,
      clearCart,
      getTotalItems,
      getTotalPrice,
      user,
      userData,
      loading,
      syncUserData,
      createTransaction,
      updateTransactionStatus,
      checkListingAvailability,
      reduceListingQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}