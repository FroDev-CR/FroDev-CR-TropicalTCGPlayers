import { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';
import ReactStars from "react-rating-stars-component";
import { FaStar, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';

const RatingSystem = ({ sellerId, sellerName, show, onHide, transactionId = null }) => {
  const { user, userData } = useCart();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [validTransactions, setValidTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(transactionId || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && user && sellerId) {
      checkRatingEligibility();
    }
  }, [show, user, sellerId]);

  const checkRatingEligibility = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Buscar transacciones completadas entre el usuario y el vendedor
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('buyerId', '==', user.uid),
        where('status', '==', 'completed')
      );
      
      const transactionsSnap = await getDocs(transactionsQuery);
      const userTransactions = [];
      
      transactionsSnap.forEach(doc => {
        const transaction = doc.data();
        // Verificar si algún item de la transacción es del vendedor
        const hasSellerItem = transaction.items?.some(item => item.sellerId === sellerId);
        if (hasSellerItem) {
          userTransactions.push({
            id: doc.id,
            ...transaction
          });
        }
      });

      setValidTransactions(userTransactions);

      if (userTransactions.length === 0) {
        setCanRate(false);
        setError('Solo puedes calificar a vendedores con quienes hayas completado una transacción.');
        setLoading(false);
        return;
      }

      // Verificar si ya calificó alguna transacción con este vendedor
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('raterId', '==', user.uid),
        where('ratedUserId', '==', sellerId)
      );

      const ratingsSnap = await getDocs(ratingsQuery);
      const existingRatings = ratingsSnap.docs.map(doc => doc.data());

      // Verificar si ya calificó la transacción específica (si se proporcionó)
      if (transactionId) {
        const hasRatedTransaction = existingRatings.some(r => r.transactionId === transactionId);
        if (hasRatedTransaction) {
          setAlreadyRated(true);
          setCanRate(false);
          setError('Ya has calificado esta transacción.');
        } else {
          setCanRate(true);
          setSelectedTransaction(transactionId);
        }
      } else {
        // Ver qué transacciones no han sido calificadas
        const unratedTransactions = userTransactions.filter(t => 
          !existingRatings.some(r => r.transactionId === t.id)
        );
        
        if (unratedTransactions.length === 0) {
          setAlreadyRated(true);
          setCanRate(false);
          setError('Ya has calificado todas tus transacciones con este vendedor.');
        } else {
          setCanRate(true);
        }
      }
    } catch (error) {
      console.error('Error verificando elegibilidad de rating:', error);
      setError('Error al verificar el historial de transacciones.');
    }
    
    setLoading(false);
  };

  const handleSubmitRating = async () => {
    if (!rating || rating < 1) {
      setError('Por favor selecciona una calificación.');
      return;
    }

    if (!selectedTransaction) {
      setError('Por favor selecciona una transacción.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Crear el rating
      const ratingData = {
        raterId: user.uid,
        raterName: userData?.username || userData?.displayName || user.email,
        ratedUserId: sellerId,
        ratedUserName: sellerName,
        transactionId: selectedTransaction,
        rating: rating,
        comment: comment.trim(),
        createdAt: new Date(),
        type: 'seller_rating'
      };

      await addDoc(collection(db, 'ratings'), ratingData);

      // Actualizar la calificación promedio del vendedor
      await updateSellerRating(sellerId);

      // Cerrar modal y limpiar
      onHide();
      setRating(0);
      setComment('');
      setSelectedTransaction('');
      
      alert('¡Calificación enviada exitosamente!');
    } catch (error) {
      console.error('Error enviando calificación:', error);
      setError('Error al enviar la calificación. Inténtalo de nuevo.');
    }

    setLoading(false);
  };

  const updateSellerRating = async (sellerId) => {
    try {
      // Obtener todas las calificaciones del vendedor
      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('ratedUserId', '==', sellerId),
        where('type', '==', 'seller_rating')
      );

      const ratingsSnap = await getDocs(ratingsQuery);
      const ratings = ratingsSnap.docs.map(doc => doc.data());

      if (ratings.length > 0) {
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        // Actualizar el documento del usuario vendedor
        const sellerRef = doc(db, 'users', sellerId);
        await updateDoc(sellerRef, {
          rating: averageRating,
          reviews: ratings.length,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error actualizando rating del vendedor:', error);
    }
  };

  if (!user) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Body className="text-center p-4">
          <FaExclamationTriangle size={48} className="text-warning mb-3" />
          <h5>Inicia sesión para calificar</h5>
          <p className="text-muted">Debes iniciar sesión para poder calificar vendedores.</p>
          <Button variant="primary" onClick={onHide}>Entendido</Button>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <FaStar className="text-warning" />
          Calificar a {sellerName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status" />
            <p className="mt-3 text-muted">Verificando historial de transacciones...</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            
            {canRate && (
              <>
                {!transactionId && validTransactions.length > 1 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Selecciona la transacción a calificar:</Form.Label>
                    <Form.Select 
                      value={selectedTransaction} 
                      onChange={(e) => setSelectedTransaction(e.target.value)}
                      required
                    >
                      <option value="">Selecciona una transacción...</option>
                      {validTransactions.map(transaction => (
                        <option key={transaction.id} value={transaction.id}>
                          {new Date(transaction.createdAt.toDate()).toLocaleDateString()} - 
                          ${transaction.totalAmount} 
                          ({transaction.items.length} carta{transaction.items.length > 1 ? 's' : ''})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Tu calificación:</Form.Label>
                  <div className="d-flex justify-content-center">
                    <ReactStars
                      count={5}
                      value={rating}
                      size={36}
                      activeColor="#ffd700"
                      edit={true}
                      onChange={setRating}
                    />
                  </div>
                  {rating > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-muted">
                        {rating === 1 && "Muy malo"}
                        {rating === 2 && "Malo"}
                        {rating === 3 && "Regular"}
                        {rating === 4 && "Bueno"}
                        {rating === 5 && "Excelente"}
                      </span>
                    </div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Comentario (opcional):</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Comparte tu experiencia con este vendedor..."
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {comment.length}/500 caracteres
                  </Form.Text>
                </Form.Group>
              </>
            )}

            {alreadyRated && (
              <div className="text-center p-4">
                <FaCheckCircle size={48} className="text-success mb-3" />
                <h5>Ya calificaste a este vendedor</h5>
                <p className="text-muted">
                  Solo puedes calificar una vez por transacción completada.
                </p>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      {canRate && !loading && (
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitRating}
            disabled={!rating || !selectedTransaction || loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" animation="border" className="me-2" />
                Enviando...
              </>
            ) : (
              'Enviar Calificación'
            )}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default RatingSystem;