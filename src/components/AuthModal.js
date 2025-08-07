import { useState } from 'react';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const provinces = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

export default function AuthModal({ show, handleClose }) {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    phone: '',
    province: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          province: formData.province,
          rating: 0,
          reviews: 0,
          createdAt: serverTimestamp()
        });

        toast.success("¡Registrado con éxito!");
        setTimeout(() => handleClose(), 1000);

      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Sesión iniciada");
        setTimeout(() => handleClose(), 1000);
      }

    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(formatFirebaseError(err.message));
    }

    setLoading(false);
  };

  const formatFirebaseError = (message) => {
    if (message.includes('auth/email-already-in-use')) return 'El correo ya está registrado';
    if (message.includes('auth/weak-password')) return 'La contraseña debe tener al menos 6 caracteres';
    if (message.includes('auth/invalid-email')) return 'Correo electrónico inválido';
    if (message.includes('auth/user-not-found')) return 'Usuario no registrado';
    if (message.includes('auth/wrong-password')) return 'Contraseña incorrecta';
    return 'Error en el proceso. Intente nuevamente';
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} animation={true}>
      <Modal.Header closeButton>
        <Modal.Title>{activeTab === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
          <Tab eventKey="login" title="Iniciar Sesión">
            <Form onSubmit={handleAuth}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Group>
              {error && <div className="text-danger mb-3">{error}</div>}
              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? "Iniciando..." : "Ingresar"}
              </Button>
            </Form>
          </Tab>
          <Tab eventKey="register" title="Registrarse">
            <Form onSubmit={handleAuth}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de usuario</Form.Label>
                <Form.Control
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="tel"
                  required
                  placeholder="Ej: 8888-8888 ó 88888888"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Provincia</Form.Label>
                <Form.Select
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                >
                  <option value="">Seleccionar provincia</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </Form.Select>
              </Form.Group>
              {error && <div className="text-danger mb-3">{error}</div>}
              <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? "Registrando..." : "Registrarse"}
              </Button>
            </Form>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
}
