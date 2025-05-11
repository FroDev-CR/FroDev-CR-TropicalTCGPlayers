import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaStar } from 'react-icons/fa';

const provinces = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const rateUser = async (userId, newRating) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentRating = userData.rating || 0;
      const currentReviews = userData.reviews || 0;
      const updatedReviews = currentReviews + 1;
      const updatedRating = (currentRating * currentReviews + newRating) / updatedReviews;

      await updateDoc(userRef, {
        rating: updatedRating,
        reviews: updatedReviews,
      });

      alert('Calificación enviada con éxito.');
    }
  } catch (error) {
    console.error('Error al calificar:', error);
    alert('Hubo un error al calificar.');
  }
};

const StarDisplay = ({ rating }) => {
  const fullStars = Math.round(rating);
  return (
    <div className="d-flex justify-content-center mb-2">
      {Array.from({ length: 5 }, (_, index) => (
        <FaStar
          key={index}
          size={22}
          style={{ marginRight: '4px' }}
          color={index < fullStars ? '#FFD700' : '#ddd'}
        />
      ))}
    </div>
  );
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setFormData(data);
          }
        } catch (err) {
          console.error('Error al obtener datos del usuario:', err);
          setError('Hubo un error al cargar los datos del usuario.');
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), formData);
        setUserData(formData);
        setEditMode(false);
        setSuccess('Perfil actualizado correctamente');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError('Error al actualizar perfil');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container className="py-5">
        {user && userData && (
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Mi Perfil</h2>
                <Button onClick={() => setEditMode(!editMode)} variant="outline-primary">
                  {editMode ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {!editMode ? (
                <div className="profile-info text-center">
                  <h4>{userData.username || 'Usuario sin nombre'}</h4>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Teléfono:</strong> {userData.phone || 'No registrado'}</p>
                  <p><strong>Provincia:</strong> {userData.province || 'No especificada'}</p>
                  <p><strong>Calificación:</strong></p>
                  <StarDisplay rating={userData.rating || 0} />
                  <p className="text-muted small">
                    ({userData.rating?.toFixed(1) || '0.0'} de 5, {userData.reviews || 0} reviews)
                  </p>

                  {userData.phone && (
                    <Button
                      variant="success"
                      href={`https://wa.me/506${userData.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3"
                    >
                      <FaWhatsapp className="me-2" /> Contactar por WhatsApp
                    </Button>
                  )}
                </div>
              ) : (
                <Form onSubmit={handleUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre de usuario</Form.Label>
                    <Form.Control
                      value={formData.username || ''}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Provincia</Form.Label>
                    <Form.Select
                      value={formData.province || ''}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    >
                      <option value="">Selecciona una provincia</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Button type="submit" variant="primary">Guardar Cambios</Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        )}
      </Container>
    </motion.div>
  );
}
