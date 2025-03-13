// src/pages/Profile.js
import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const provinces = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setFormData(docSnap.data());
        }
      }
    };
    fetchUserData();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), formData);
      setUserData(formData);
      setEditMode(false);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error actualizando perfil');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container className="py-5">
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

            {editMode ? (
              <Form onSubmit={handleUpdate}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de usuario</Form.Label>
                  <Form.Control
                    value={formData.username || ''}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Provincia</Form.Label>
                  <Form.Select
                    value={formData.province || ''}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                  >
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </Form.Select>
                </Form.Group>
                <Button type="submit" variant="primary">Guardar Cambios</Button>
              </Form>
            ) : (
              <div className="profile-info">
                <p><strong>Usuario:</strong> {userData?.username}</p>
                <p><strong>Email:</strong> {auth.currentUser?.email}</p>
                <p><strong>Teléfono:</strong> {userData?.phone || 'No registrado'}</p>
                <p><strong>Provincia:</strong> {userData?.province || 'No especificada'}</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </motion.div>
  );
}