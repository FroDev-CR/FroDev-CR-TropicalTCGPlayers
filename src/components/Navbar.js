// Navbar.js
import { useState } from 'react';
import { Navbar, Container, Nav, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AuthModal from './AuthModal';

const CustomNavbar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);

  auth.onAuthStateChanged((user) => {
    if (user !== null) {
      setUser(user);
    }
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" fixed="top" className="py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="h4 mb-0">TROPICAL PLAYERS TCG</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {user && (
                <>
                  <Nav.Link as={Link} to="/marketplace" className="mx-3 nav-hover">
                    Marketplace
                  </Nav.Link>
                  <Nav.Link as={Link} to="/perfil" className="mx-3 nav-hover">
                    Mi Perfil
                  </Nav.Link>
                </>
              )}

<Nav.Link as={Link} to="/binders" className="mx-3 nav-hover">
  Mis Binders
</Nav.Link>

              <Nav.Link as={Link} to="/live" className="mx-3 nav-hover">
                En Vivo
              </Nav.Link>
              <Nav.Link as={Link} to="/catalogo" className="mx-3 nav-hover">
                Catálogo
              </Nav.Link>
              {user ? (
                <Button variant="outline-light" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              ) : (
                <Button variant="outline-light" onClick={() => setShowAuthModal(true)}>
                  Ingresar
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <AuthModal show={showAuthModal} handleClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default CustomNavbar;