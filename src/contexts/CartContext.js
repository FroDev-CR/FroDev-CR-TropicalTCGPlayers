// src/contexts/CartContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

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
      console.log('🛒 Intentando agregar al carrito:', listing?.cardName, 'ID:', listing?.id, 'Cantidad:', requestedQuantity);
      console.log('📋 Listing completo:', listing);
      
      if (!listing || !listing.id) {
        console.error('❌ Listing inválido:', listing);
        alert('No se puede agregar al carrito: Datos de carta inválidos');
        return false;
      }
      
      // Verificar disponibilidad
      const availability = await checkListingAvailability(listing.id, requestedQuantity);
      
      if (!availability.available) {
        console.log('❌ No disponible:', availability.reason);
        alert(`No se puede agregar al carrito: ${availability.reason}`);
        return false;
      }

      // Verificar si ya está en el carrito
      console.log('🛒 Carrito actual:', cart);
      console.log('🔍 Buscando item existente con ID:', listing.id);
      
      let existingItemIndex = -1;
      if (!Array.isArray(cart)) {
        console.error('❌ Carrito no es un array:', cart);
        setCart([]);
      } else {
        existingItemIndex = cart.findIndex(item => item && item.id === listing.id);
      }
      
      console.log('📍 Índice de item existente:', existingItemIndex);
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
      console.error('❌ Error agregando al carrito:', error);
      console.error('Stack trace:', error.stack);
      console.error('Listing que causó error:', listing);
      alert(`Error agregando al carrito: ${error.message}`);
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
      console.log('🔍 Verificando disponibilidad para listing:', listingId, 'cantidad:', requestedQuantity);
      
      const listingRef = doc(db, 'listings', listingId);
      const listingSnap = await getDoc(listingRef);
      
      if (!listingSnap.exists()) {
        console.log('❌ Listing no existe:', listingId);
        return { available: false, reason: 'El listado no existe' };
      }

      const listingData = listingSnap.data();
      console.log('📦 Datos del listing:', listingData);
      
      const availableQuantity = listingData.availableQuantity || listingData.quantity || 0;
      const status = listingData.status || 'active';
      
      console.log('📊 Estado:', status, 'Disponible:', availableQuantity, 'Solicitado:', requestedQuantity);
      
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

      console.log('✅ Disponibilidad verificada exitosamente');
      return { 
        available: true, 
        availableQuantity,
        status: listingData.status 
      };
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      console.error('Error details:', error.message, error.code);
      return { available: false, reason: `Error verificando disponibilidad: ${error.message}` };
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

  // ===============================================
  // NUEVAS FUNCIONES P2P - SPRINT 2
  // ===============================================

  // Verificar disponibilidad atómica para checkout
  const checkAtomicAvailability = async (items) => {
    try {
      const checkAvailability = httpsCallable(functions, 'checkAtomicAvailability');
      const result = await checkAvailability({ 
        items: items.map(item => ({
          listingId: item.id,
          requestedQuantity: item.quantity || 1
        }))
      });
      
      return result.data;
    } catch (error) {
      console.error('Error verificando disponibilidad atómica:', error);
      throw error;
    }
  };

  // Crear transacción P2P pendiente con reserva de inventario
  const createPendingTransaction = async (vendorItems, contactMethod = 'whatsapp', buyerNotes = '') => {
    if (!user || !vendorItems.length) {
      throw new Error('Usuario no autenticado o items vacíos');
    }
    
    try {
      const createTransaction = httpsCallable(functions, 'createPendingTransaction');
      
      const transactionData = {
        buyerId: user.uid,
        buyerName: userData?.username || userData?.displayName || user.email,
        buyerNotes: buyerNotes.trim(),
        vendorId: vendorItems[0].sellerId, // Todos los items son del mismo vendedor
        items: vendorItems.map(item => ({
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
        totalAmount: vendorItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
        contactMethod,
        shippingCost: vendorItems[0].shippingIncluded ? 0 : 600
      };

      const result = await createTransaction(transactionData);
      
      // Remover items del carrito que fueron procesados
      const processedListingIds = vendorItems.map(item => item.id);
      const newCart = cart.filter(item => !processedListingIds.includes(item.id));
      setCart(newCart);
      
      // Actualizar localStorage y Firebase
      localStorage.setItem('cart', JSON.stringify(newCart));
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { cart: newCart });
      }
      
      return result.data;
    } catch (error) {
      console.error('Error creando transacción P2P:', error);
      throw error;
    }
  };

  // Obtener items del carrito agrupados por vendedor
  const getCartByVendor = () => {
    const vendors = {};
    
    cart.forEach(item => {
      const vendorId = item.sellerId;
      if (!vendors[vendorId]) {
        vendors[vendorId] = {
          vendorId,
          vendorName: item.sellerName,
          vendorPhone: item.userPhone,
          vendorEmail: item.userEmail,
          items: [],
          totalAmount: 0,
          totalItems: 0,
          hasShipping: false
        };
      }
      
      vendors[vendorId].items.push(item);
      vendors[vendorId].totalAmount += item.price * (item.quantity || 1);
      vendors[vendorId].totalItems += (item.quantity || 1);
      
      // Verificar si algún item no incluye envío gratis
      if (!item.shippingIncluded) {
        vendors[vendorId].hasShipping = true;
      }
    });
    
    return Object.values(vendors);
  };

  // Obtener transacciones del usuario actual
  const getUserTransactions = async (type = 'all') => {
    if (!user) return [];
    
    try {
      const getUserTransactions = httpsCallable(functions, 'getUserTransactions');
      const result = await getUserTransactions({ 
        userId: user.uid,
        type // 'buyer', 'seller', 'all'
      });
      
      return result.data.transactions || [];
    } catch (error) {
      console.error('Error obteniendo transacciones del usuario:', error);
      return [];
    }
  };

  // Actualizar estado de transacción P2P
  const updateTransactionP2P = async (transactionId, updateData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const updateTransaction = httpsCallable(functions, 'updateTransactionP2P');
      const result = await updateTransaction({
        transactionId,
        userId: user.uid,
        ...updateData
      });
      
      return result.data;
    } catch (error) {
      console.error('Error actualizando transacción P2P:', error);
      throw error;
    }
  };

  // Responder a una transacción como vendedor
  const respondToTransaction = async (transactionId, action, responseData = {}) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const respondToTransaction = httpsCallable(functions, 'respondToTransaction');
      const result = await respondToTransaction({
        transactionId,
        sellerId: user.uid,
        action, // 'accept' | 'reject'
        ...responseData
      });
      
      return result.data;
    } catch (error) {
      console.error('Error respondiendo a transacción:', error);
      throw error;
    }
  };

  // Confirmar entrega como vendedor
  const confirmDelivery = async (transactionId, deliveryProof) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const confirmDelivery = httpsCallable(functions, 'confirmDelivery');
      const result = await confirmDelivery({
        transactionId,
        sellerId: user.uid,
        deliveryProof // { originStore, proofImage, notes }
      });
      
      return result.data;
    } catch (error) {
      console.error('Error confirmando entrega:', error);
      throw error;
    }
  };

  // Confirmar pago como vendedor
  const confirmPayment = async (transactionId, paymentProof) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const confirmPayment = httpsCallable(functions, 'confirmPayment');
      const result = await confirmPayment({
        transactionId,
        sellerId: user.uid,
        paymentProof // { method, proofImage, amount, notes }
      });
      
      return result.data;
    } catch (error) {
      console.error('Error confirmando pago:', error);
      throw error;
    }
  };

  // Confirmar recibo como comprador
  const confirmReceipt = async (transactionId, receiptData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const confirmReceipt = httpsCallable(functions, 'confirmReceipt');
      const result = await confirmReceipt({
        transactionId,
        buyerId: user.uid,
        ...receiptData // { destinationStore, satisfaction, notes }
      });
      
      return result.data;
    } catch (error) {
      console.error('Error confirmando recibo:', error);
      throw error;
    }
  };

  // Enviar calificación mutua
  const submitRating = async (transactionId, ratingData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const submitRating = httpsCallable(functions, 'submitRating');
      const result = await submitRating({
        transactionId,
        userId: user.uid,
        ...ratingData // { rating, comment, category }
      });
      
      return result.data;
    } catch (error) {
      console.error('Error enviando calificación:', error);
      throw error;
    }
  };

  // Crear disputa/reporte
  const createDispute = async (transactionId, disputeData) => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    try {
      const createDispute = httpsCallable(functions, 'createDispute');
      const result = await createDispute({
        transactionId,
        reporterId: user.uid,
        ...disputeData // { type, description, evidence }
      });
      
      return result.data;
    } catch (error) {
      console.error('Error creando disputa:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider value={{ 
      // Funciones originales del carrito
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
      reduceListingQuantity,
      
      // Nuevas funciones P2P
      checkAtomicAvailability,
      createPendingTransaction,
      getCartByVendor,
      getUserTransactions,
      updateTransactionP2P,
      respondToTransaction,
      confirmDelivery,
      confirmPayment,
      confirmReceipt,
      submitRating,
      createDispute
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}