// src/pages/Cart.js
import { Container, Row, Col, Card, ListGroup, Button, Alert } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

export default function Cart() {
  const { cart, removeFromCart } = useCart();

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
                    onClick={() => alert('Proceso de contacto iniciado: Los vendedores se comunicarán contigo')}
                  >
                    Contactar Vendedores
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </motion.div>
  );
}