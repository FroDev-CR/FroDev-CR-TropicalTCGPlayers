// src/pages/Cart.js
import { useState } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Alert, Spinner, Toast, ToastContainer, Modal, Form, ButtonGroup } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { FaWhatsapp, FaCheckCircle, FaEnvelope, FaPhone, FaCreditCard, FaStore } from 'react-icons/fa';

export default function Cart() {
  const { cart, removeFromCart, createTransaction, user } = useCart();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedContactMethod, setSelectedContactMethod] = useState('whatsapp');
  const [buyerNotes, setBuyerNotes] = useState('');

  const handleStartCheckout = () => {
    if (!user) {
      alert('Debes iniciar sesión para continuar con la compra');
      return;
    }

    if (cart.length === 0) {
      alert('Tu carrito está vacío');
      return;
    }

    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async () => {
    setLoading(true);
    try {
      const newTransactionId = await createTransaction(cart, selectedContactMethod, buyerNotes);
      if (newTransactionId) {
        setTransactionId(newTransactionId);
        setShowCheckoutModal(false);
        setShowToast(true);
        
        // Agrupar items por vendedor
        const sellerGroups = cart.reduce((groups, item) => {
          const sellerId = item.sellerId;
          if (!groups[sellerId]) {
            groups[sellerId] = {
              sellerName: item.sellerName,
              phone: item.userPhone,
              email: item.userEmail,
              items: []
            };
          }
          groups[sellerId].items.push(item);
          return groups;
        }, {});

        // Contactar según el método seleccionado
        Object.values(sellerGroups).forEach((seller, index) => {
          const itemsList = seller.items.map(item => 
            `• ${item.cardName} - $${item.price} (${item.condition})`
          ).join('\n');

          const notesText = buyerNotes ? `\n\nNotas del comprador: ${buyerNotes}` : '';
          
          if (selectedContactMethod === 'whatsapp' && seller.phone) {
            const message = encodeURIComponent(
              `¡Hola ${seller.sellerName}! Me interesan estas cartas de tu listado:\n\n${itemsList}\n\nTotal: $${seller.items.reduce((sum, item) => sum + item.price, 0)}\n\nID de transacción: ${newTransactionId}${notesText}`
            );
            
            setTimeout(() => {
              window.open(`https://wa.me/${seller.phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
            }, index * 1000);
          } else if (selectedContactMethod === 'email' && seller.email) {
            const subject = encodeURIComponent(`Interés en compra - Transacción #${newTransactionId.slice(-6)}`);
            const body = encodeURIComponent(
              `Hola ${seller.sellerName},\n\nMe interesan estas cartas de tu listado:\n\n${itemsList}\n\nTotal: $${seller.items.reduce((sum, item) => sum + item.price, 0)}\n\nID de transacción: ${newTransactionId}${notesText}\n\nSaludos`
            );
            
            setTimeout(() => {
              window.open(`mailto:${seller.email}?subject=${subject}&body=${body}`, '_blank');
            }, index * 500);
          } else if (selectedContactMethod === 'phone') {
            // Para teléfono, mostraremos la información en el toast
            console.log(`Contactar por teléfono a ${seller.sellerName}: ${seller.phone}`);
          }
        });
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      alert('Hubo un error al procesar tu solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container>
        <h2 className="section-title">Carrito de Compras</h2>
        
        {cart.length === 0 ? (
          <Alert variant="info">Tu carrito está vacío</Alert>
        ) : (
          <Row className="g-4">
            <Col md={8}>
              <ListGroup>
                {cart.map(item => (
                  <ListGroup.Item key={item.id}>
                    <div className="d-flex align-items-center gap-4">
                      <img src={item.cardImage} alt={item.cardName} style={{ width: '100px' }} />
                      <div className="flex-grow-1">
                        <h5>{item.cardName}</h5>
                        <div className="d-flex gap-3">
                          <span>Precio: ${item.price}</span>
                          <span>Condición: {item.condition}</span>
                          <span>Cantidad: {item.quantity}</span>
                        </div>
                      </div>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col md={4}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h5>Resumen de Compra</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between">
                      <span>Total:</span>
                      <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span>
                    </ListGroup.Item>
                  </ListGroup>
                  <Button 
                    variant="primary" 
                    className="w-100 mt-3"
                    onClick={handleStartCheckout}
                    disabled={loading || !user}
                    size="lg"
                  >
                    <FaCreditCard className="me-2" />
                    Proceder al Checkout
                  </Button>
                  {!user && (
                    <Alert variant="warning" className="mt-2 mb-0">
                      <small>Inicia sesión para continuar con la compra</small>
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Modal de Checkout */}
        <Modal show={showCheckoutModal} onHide={() => setShowCheckoutModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <FaCreditCard className="text-primary" />
              Finalizar Compra
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-4">
              <h6 className="mb-3">Resumen de tu pedido:</h6>
              <div className="bg-light p-3 rounded">
                <div className="row g-2">
                  {cart.slice(0, 3).map(item => (
                    <div key={item.id} className="col-12">
                      <div className="d-flex align-items-center gap-2">
                        <img 
                          src={item.cardImage} 
                          alt={item.cardName}
                          style={{ width: '40px', height: '56px', objectFit: 'contain' }}
                          className="rounded"
                        />
                        <div className="flex-grow-1">
                          <div className="fw-bold small">{item.cardName}</div>
                          <div className="text-muted small">${item.price} · {item.condition}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length > 3 && (
                    <div className="col-12 text-center text-muted">
                      <small>... y {cart.length - 3} carta{cart.length - 3 > 1 ? 's' : ''} más</small>
                    </div>
                  )}
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center fw-bold">
                  <span>Total:</span>
                  <span className="text-primary">${cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Método de contacto preferido:</Form.Label>
                <ButtonGroup className="w-100 d-flex">
                  <Button
                    variant={selectedContactMethod === 'whatsapp' ? 'success' : 'outline-success'}
                    onClick={() => setSelectedContactMethod('whatsapp')}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaWhatsapp />
                    WhatsApp
                  </Button>
                  <Button
                    variant={selectedContactMethod === 'email' ? 'primary' : 'outline-primary'}
                    onClick={() => setSelectedContactMethod('email')}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaEnvelope />
                    Email
                  </Button>
                  <Button
                    variant={selectedContactMethod === 'phone' ? 'info' : 'outline-info'}
                    onClick={() => setSelectedContactMethod('phone')}
                    className="d-flex align-items-center justify-content-center gap-2"
                  >
                    <FaPhone />
                    Teléfono
                  </Button>
                </ButtonGroup>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Notas para los vendedores (opcional):</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="Agrega cualquier información adicional para los vendedores (horarios preferidos, método de entrega, etc.)"
                  maxLength={500}
                />
                <Form.Text className="text-muted">
                  {buyerNotes.length}/500 caracteres
                </Form.Text>
              </Form.Group>

              <Alert variant="info">
                <div className="d-flex align-items-start gap-2">
                  <FaStore className="mt-1" />
                  <div>
                    <strong>¿Cómo funciona?</strong>
                    <div className="small mt-1">
                      Al confirmar, se creará una transacción y se {selectedContactMethod === 'whatsapp' ? 'abrirán enlaces de WhatsApp' : 
                      selectedContactMethod === 'email' ? 'abrirán ventanas de email' : 
                      'mostrará información de contacto'} para cada vendedor. 
                      Los vendedores podrán ver tu solicitud y contactarte directamente.
                    </div>
                  </div>
                </div>
              </Alert>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCheckoutModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="success" 
              onClick={handleConfirmCheckout}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  Procesando...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Confirmar Compra
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Toast de confirmación */}
        <ToastContainer position="top-end" className="p-3">
          <Toast show={showToast} onClose={() => setShowToast(false)} delay={5000} autohide>
            <Toast.Header>
              <FaCheckCircle className="text-success me-2" />
              <strong className="me-auto">¡Transacción iniciada!</strong>
            </Toast.Header>
            <Toast.Body>
              Se ha creado la transacción #{transactionId?.slice(-6)}. 
              {selectedContactMethod === 'whatsapp' && 'Los enlaces de WhatsApp se abrirán automáticamente.'}
              {selectedContactMethod === 'email' && 'Las ventanas de email se abrirán automáticamente.'}
              {selectedContactMethod === 'phone' && 'Revisa la página de transacciones para ver la información de contacto.'}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </motion.div>
  );
}