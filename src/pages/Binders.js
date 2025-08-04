import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const binderTypes = ['3x3', '4x4', '2x2', 'Jumbo'];

const binderStyles = [
  { label: 'Rojo clásico', value: 'red', background: '#e63946' },
  { label: 'Negro profesional', value: 'black', background: '#212529' },
  { label: 'Azul eléctrico', value: 'blue', background: '#0077b6' },
  { label: 'Verde bosque', value: 'green', background: '#2a9d8f' }
];

export default function Binders() {
  const { user, userData, syncUserData } = useCart();
  const [binders, setBinders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    style: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBinders = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'binders'), where('ownerId', '==', user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBinders(data);
      } catch (err) {
        console.error("Error al cargar binders:", err);
        setError("Error al cargar binders");
      } finally {
        setLoading(false);
      }
    };
    fetchBinders();
  }, [user, showModal]);

  const handleCreateBinder = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!user) {
      setError("Debes iniciar sesión para crear binders");
      return;
    }
    
    if (!formData.type || !formData.style) {
      setError("Por favor completa todos los campos");
      return;
    }
    try {
      if (binders.length >= 4) {
        setError("Solo puedes tener hasta 4 binders");
        return;
      }

      const binderData = {
        ...formData,
        ownerId: user.uid,
        ownerName: userData?.username || userData?.displayName || user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        mode: 'colección',
        cards: []
      };

      // Crear el binder en Firestore
      const binderRef = await addDoc(collection(db, 'binders'), binderData);

      // Actualizar el documento del usuario con el nuevo binder
      const userRef = doc(db, 'users', user.uid);
      const currentBinders = userData?.binders || [];
      await updateDoc(userRef, {
        binders: [...currentBinders, binderRef.id],
        updatedAt: new Date()
      });

      // Sincronizar datos del usuario
      await syncUserData();

      setSuccess("Binder creado con éxito");
      setShowModal(false);
      setFormData({ type: '', style: '', description: '' });
    } catch (err) {
      console.error("Error al crear binder:", err);
      setError("Error al crear binder");
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="section">
      <Container className="py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title">Mis Binders</h2>
          {user ? (
            <Button onClick={() => setShowModal(true)} disabled={binders.length >= 4}>
              Crear nuevo Binder
            </Button>
          ) : (
            <Button variant="outline-primary" disabled>
              Inicia sesión para crear binders
            </Button>
          )}
        </div>

        {!user && (
          <Alert variant="info" className="mb-4">
            <strong>Inicia sesión</strong> para crear y gestionar tus binders de cartas.
          </Alert>
        )}

        {binders.length === 0 && user && <p className="text-muted">Aún no has creado binders.</p>}

        <Row className="g-4">
          {binders.map(binder => {
            const styleInfo = binderStyles.find(s => s.value === binder.style);
            return (
              <Col key={binder.id} md={4} lg={3}>
                <Card className="shadow-sm h-100" style={{ backgroundColor: styleInfo?.background || '#f8f9fa' }}>
                  <Card.Body className="text-white">
                    <h5 className="mb-2">Tipo: {binder.type}</h5>
                    <p className="text-white-50 small">{binder.description || "Sin descripción"}</p>
                    <div className="mb-2">
                      <small className="text-white-50">
                        {binder.cards?.length || 0} cartas
                      </small>
                    </div>
                    <Button
                      as={Link}
                      to={`/binder/${binder.id}`}
                      variant="light"
                      size="sm"
                    >
                      Ver Binder
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Modal para crear binder */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Binder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateBinder}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Binder</Form.Label>
              <Form.Select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Selecciona tipo</option>
                {binderTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estilo visual</Form.Label>
              <Form.Select
                required
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
              >
                <option value="">Selecciona estilo</option>
                {binderStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción (opcional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Descripción del binder..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button variant="primary" type="submit">Crear Binder</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </motion.div>
  );
}
