// src/contexts/TransactionContext.js
// Context específico para manejo de transacciones P2P

import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [buyerTransactions, setBuyerTransactions] = useState([]);
  const [sellerTransactions, setSellerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Escuchar cambios en la autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setTransactions([]);
        setBuyerTransactions([]);
        setSellerTransactions([]);
        setUnreadNotifications(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Escuchar transacciones en tiempo real
  useEffect(() => {
    if (!user) return;

    // Query para transacciones como comprador
    const buyerQuery = query(
      collection(db, 'transactions'),
      where('buyerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Query para transacciones como vendedor
    const sellerQuery = query(
      collection(db, 'transactions'),
      where('sellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeBuyer = onSnapshot(buyerQuery, (snapshot) => {
      const buyerTxs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'buyer'
      }));
      setBuyerTransactions(buyerTxs);
    });

    const unsubscribeSeller = onSnapshot(sellerQuery, (snapshot) => {
      const sellerTxs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'seller'
      }));
      setSellerTransactions(sellerTxs);
    });

    return () => {
      unsubscribeBuyer();
      unsubscribeSeller();
    };
  }, [user]);

  // Combinar y ordenar todas las transacciones
  useEffect(() => {
    const allTransactions = [
      ...buyerTransactions,
      ...sellerTransactions
    ].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt;
      const dateB = b.createdAt?.toDate?.() || b.createdAt;
      return dateB - dateA;
    });

    setTransactions(allTransactions);

    // Calcular notificaciones no leídas
    const unread = allTransactions.filter(tx => {
      const userRole = tx.role;
      const status = tx.status;
      
      // Lógica para determinar si requiere atención del usuario
      if (userRole === 'buyer') {
        return ['delivered_pending_payment', 'payment_confirmed', 'completed_pending_rating'].includes(status);
      } else if (userRole === 'seller') {
        return ['pending_seller_response', 'accepted_pending_delivery', 'completed_pending_rating'].includes(status);
      }
      return false;
    }).length;

    setUnreadNotifications(unread);
  }, [buyerTransactions, sellerTransactions]);

  // ===============================================
  // FUNCIONES DE TRANSACCIONES P2P
  // ===============================================

  // Obtener detalles completos de una transacción
  const getTransactionDetails = async (transactionId) => {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      const transactionSnap = await getDoc(transactionRef);
      
      if (!transactionSnap.exists()) {
        throw new Error('Transacción no encontrada');
      }

      return {
        id: transactionSnap.id,
        ...transactionSnap.data()
      };
    } catch (error) {
      console.error('Error obteniendo detalles de transacción:', error);
      throw error;
    }
  };

  // Aceptar transacción como vendedor
  const acceptTransaction = async (transactionId, acceptanceData = {}) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const acceptTransaction = httpsCallable(functions, 'acceptTransaction');
      const result = await acceptTransaction({
        transactionId,
        sellerId: user.uid,
        originStore: acceptanceData.originStore,
        estimatedDeliveryDays: acceptanceData.estimatedDeliveryDays || 3,
        sellerNotes: acceptanceData.sellerNotes || ''
      });

      return result.data;
    } catch (error) {
      console.error('Error aceptando transacción:', error);
      throw error;
    }
  };

  // Rechazar transacción como vendedor
  const rejectTransaction = async (transactionId, reason = '') => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const rejectTransaction = httpsCallable(functions, 'rejectTransaction');
      const result = await rejectTransaction({
        transactionId,
        sellerId: user.uid,
        reason
      });

      return result.data;
    } catch (error) {
      console.error('Error rechazando transacción:', error);
      throw error;
    }
  };

  // Confirmar entrega como vendedor (con foto de prueba)
  const confirmDelivery = async (transactionId, deliveryData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const confirmDelivery = httpsCallable(functions, 'confirmDelivery');
      const result = await confirmDelivery({
        transactionId,
        sellerId: user.uid,
        originStore: deliveryData.originStore,
        proofImage: deliveryData.proofImage,
        deliveryNotes: deliveryData.deliveryNotes || ''
      });

      return result.data;
    } catch (error) {
      console.error('Error confirmando entrega:', error);
      throw error;
    }
  };

  // Solicitar pago como vendedor
  const requestPayment = async (transactionId, paymentMethod = 'whatsapp') => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const requestPayment = httpsCallable(functions, 'requestPayment');
      const result = await requestPayment({
        transactionId,
        sellerId: user.uid,
        method: paymentMethod
      });

      return result.data;
    } catch (error) {
      console.error('Error solicitando pago:', error);
      throw error;
    }
  };

  // Confirmar pago recibido como vendedor
  const confirmPaymentReceived = async (transactionId, paymentProof) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const confirmPayment = httpsCallable(functions, 'confirmPaymentReceived');
      const result = await confirmPayment({
        transactionId,
        sellerId: user.uid,
        paymentMethod: paymentProof.method,
        proofImage: paymentProof.proofImage,
        amount: paymentProof.amount,
        paymentNotes: paymentProof.notes || ''
      });

      return result.data;
    } catch (error) {
      console.error('Error confirmando pago recibido:', error);
      throw error;
    }
  };

  // Confirmar recibo como comprador
  const confirmReceipt = async (transactionId, receiptData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const confirmReceipt = httpsCallable(functions, 'confirmReceipt');
      const result = await confirmReceipt({
        transactionId,
        buyerId: user.uid,
        destinationStore: receiptData.destinationStore,
        satisfactionLevel: receiptData.satisfactionLevel,
        receiptNotes: receiptData.receiptNotes || ''
      });

      return result.data;
    } catch (error) {
      console.error('Error confirmando recibo:', error);
      throw error;
    }
  };

  // Enviar calificación (comprador o vendedor)
  const submitRating = async (transactionId, ratingData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const submitRating = httpsCallable(functions, 'submitRating');
      const result = await submitRating({
        transactionId,
        userId: user.uid,
        rating: ratingData.rating, // 1-5 estrellas
        comment: ratingData.comment || '',
        categories: ratingData.categories || {} // { communication: 5, delivery: 4, product: 5 }
      });

      return result.data;
    } catch (error) {
      console.error('Error enviando calificación:', error);
      throw error;
    }
  };

  // Crear disputa/reporte
  const createDispute = async (transactionId, disputeData) => {
    if (!user) throw new Error('Usuario no autenticado');

    try {
      const createDispute = httpsCallable(functions, 'createDispute');
      const result = await createDispute({
        transactionId,
        reporterId: user.uid,
        disputeType: disputeData.type, // 'not_received', 'wrong_item', 'payment_issue', 'communication'
        description: disputeData.description,
        evidence: disputeData.evidence || [], // Array de URLs de imágenes
        severity: disputeData.severity || 'medium' // 'low', 'medium', 'high'
      });

      return result.data;
    } catch (error) {
      console.error('Error creando disputa:', error);
      throw error;
    }
  };

  // Marcar transacción como leída
  const markAsRead = async (transactionId) => {
    try {
      const markAsRead = httpsCallable(functions, 'markTransactionAsRead');
      await markAsRead({
        transactionId,
        userId: user.uid
      });
    } catch (error) {
      console.error('Error marcando transacción como leída:', error);
    }
  };

  // ===============================================
  // FUNCIONES DE UTILIDAD
  // ===============================================

  // Obtener estado legible de una transacción
  const getTransactionStatusText = (transaction) => {
    const status = transaction.status;
    const userRole = transaction.role;

    const statusTexts = {
      buyer: {
        'pending_seller_response': 'Esperando respuesta del vendedor',
        'accepted_pending_delivery': 'Vendedor preparando envío',
        'delivered_pending_payment': 'Realizar pago al vendedor',
        'payment_confirmed': 'Recoger producto en tienda',
        'completed_pending_rating': 'Calificar al vendedor',
        'completed': 'Transacción completada',
        'cancelled_by_seller': 'Cancelada por vendedor',
        'timeout_cancelled': 'Cancelada por tiempo agotado',
        'disputed': 'En proceso de disputa'
      },
      seller: {
        'pending_seller_response': 'Responder a la compra',
        'accepted_pending_delivery': 'Entregar en tienda de origen',
        'delivered_pending_payment': 'Solicitar pago al comprador',
        'payment_confirmed': 'Esperando confirmación del comprador',
        'completed_pending_rating': 'Calificar al comprador',
        'completed': 'Transacción completada',
        'cancelled_by_seller': 'Cancelada por ti',
        'timeout_cancelled': 'Cancelada por tiempo agotado',
        'disputed': 'En proceso de disputa'
      }
    };

    return statusTexts[userRole]?.[status] || `Estado: ${status}`;
  };

  // Obtener acciones disponibles para el usuario actual
  const getAvailableActions = (transaction) => {
    const status = transaction.status;
    const userRole = transaction.role;
    const actions = [];

    if (userRole === 'seller') {
      switch (status) {
        case 'pending_seller_response':
          actions.push('accept', 'reject');
          break;
        case 'accepted_pending_delivery':
          actions.push('confirm_delivery');
          break;
        case 'delivered_pending_payment':
          actions.push('request_payment', 'confirm_payment');
          break;
        case 'completed_pending_rating':
          actions.push('submit_rating');
          break;
      }
    } else if (userRole === 'buyer') {
      switch (status) {
        case 'delivered_pending_payment':
          actions.push('make_payment');
          break;
        case 'payment_confirmed':
          actions.push('confirm_receipt');
          break;
        case 'completed_pending_rating':
          actions.push('submit_rating');
          break;
      }
    }

    // Siempre permitir crear disputa si la transacción no está completada
    if (!['completed', 'cancelled_by_seller', 'timeout_cancelled'].includes(status)) {
      actions.push('create_dispute');
    }

    return actions;
  };

  // Verificar si una transacción requiere atención urgente
  const requiresUrgentAttention = (transaction) => {
    const now = new Date();
    const createdAt = transaction.createdAt?.toDate?.() || transaction.createdAt;
    const timeline = transaction.timeline || {};
    
    // Verificar timeouts próximos
    if (transaction.status === 'pending_seller_response') {
      const hoursLeft = 24 - ((now - createdAt) / (1000 * 60 * 60));
      return hoursLeft <= 2; // Urgente si quedan menos de 2 horas
    }
    
    if (transaction.status === 'accepted_pending_delivery') {
      const acceptedAt = timeline.accepted?.toDate?.() || timeline.accepted;
      if (acceptedAt) {
        const hoursLeft = 144 - ((now - acceptedAt) / (1000 * 60 * 60)); // 6 días = 144 horas
        return hoursLeft <= 24; // Urgente si queda menos de 1 día
      }
    }
    
    return false;
  };

  // Calcular tiempo restante para una acción
  const getTimeRemaining = (transaction) => {
    const now = new Date();
    const createdAt = transaction.createdAt?.toDate?.() || transaction.createdAt;
    const timeline = transaction.timeline || {};
    
    switch (transaction.status) {
      case 'pending_seller_response':
        const responseDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        return Math.max(0, responseDeadline - now);
        
      case 'accepted_pending_delivery':
        const acceptedAt = timeline.accepted?.toDate?.() || timeline.accepted;
        if (acceptedAt) {
          const deliveryDeadline = new Date(acceptedAt.getTime() + 6 * 24 * 60 * 60 * 1000);
          return Math.max(0, deliveryDeadline - now);
        }
        break;
        
      case 'payment_confirmed':
        const confirmedAt = timeline.paymentConfirmed?.toDate?.() || timeline.paymentConfirmed;
        if (confirmedAt) {
          const receiptDeadline = new Date(confirmedAt.getTime() + 10 * 24 * 60 * 60 * 1000);
          return Math.max(0, receiptDeadline - now);
        }
        break;
        
      case 'completed_pending_rating':
        const completedAt = timeline.completed?.toDate?.() || timeline.completed;
        if (completedAt) {
          const ratingDeadline = new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
          return Math.max(0, ratingDeadline - now);
        }
        break;
    }
    
    return 0;
  };

  return (
    <TransactionContext.Provider value={{
      // Estado
      user,
      transactions,
      buyerTransactions,
      sellerTransactions,
      loading,
      unreadNotifications,
      
      // Funciones principales
      getTransactionDetails,
      acceptTransaction,
      rejectTransaction,
      confirmDelivery,
      requestPayment,
      confirmPaymentReceived,
      confirmReceipt,
      submitRating,
      createDispute,
      markAsRead,
      
      // Funciones de utilidad
      getTransactionStatusText,
      getAvailableActions,
      requiresUrgentAttention,
      getTimeRemaining
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}