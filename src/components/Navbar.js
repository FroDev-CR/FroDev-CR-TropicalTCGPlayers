// Navbar.js
import { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button, NavDropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import AuthModal from './AuthModal';
import { FaUser, FaShoppingCart, FaBook, FaHome, FaSignOutAlt } from 'react-icons/fa';

const CustomNavbar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // Cerrar el menú cuando se navega a una nueva página
  useEffect(() => {
    setExpanded(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        fixed="top" 
        className="py-2 py-lg-3 shadow-sm"
        expanded={expanded}
        onToggle={(expanded) => setExpanded(expanded)}
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            <span className="h5 h-lg-4 mb-0 fw-bold">TROPICAL PLAYERS TCG</span>
          </Navbar.Brand>
          
          <Navbar.Toggle 
            aria-controls="basic-navbar-nav" 
            className="border-0"
          />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              {/* Enlaces principales */}
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`mx-2 mx-lg-3 nav-hover ${isActive('/') ? 'active' : ''}`}
              >
                <FaHome className="d-lg-none me-2" />
                Inicio
              </Nav.Link>

              {user && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/marketplace" 
                    className={`mx-2 mx-lg-3 nav-hover ${isActive('/marketplace') ? 'active' : ''}`}
                  >
                    <FaShoppingCart className="d-lg-none me-2" />
                    Marketplace
                  </Nav.Link>
                  
                  <Nav.Link 
                    as={Link} 
                    to="/perfil" 
                    className={`mx-2 mx-lg-3 nav-hover ${isActive('/perfil') ? 'active' : ''}`}
                  >
                    <FaUser className="d-lg-none me-2" />
                    Mi Perfil
                  </Nav.Link>
                  
                </>
              )}

              <Nav.Link 
                as={Link} 
                to="/binders" 
                className={`mx-2 mx-lg-3 nav-hover ${isActive('/binders') ? 'active' : ''}`}
              >
                <FaBook className="d-lg-none me-2" />
                Mis Binders
              </Nav.Link>


              {/* Botones de autenticación */}
              <div className="d-flex align-items-center mt-3 mt-lg-0">
                {user ? (
                  <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2">
                    <div className="text-light small d-lg-none w-100 text-center">
                      Bienvenido, {user.displayName || user.email}
                    </div>
                    <Button 
                      variant="outline-light" 
                      onClick={handleLogout}
                      size="sm"
                      className="d-flex align-items-center gap-2 w-100 w-lg-auto justify-content-center"
                    >
                      <FaSignOutAlt size={14} />
                      <span className="d-none d-lg-inline">Cerrar Sesión</span>
                      <span className="d-lg-none">Salir</span>
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline-light" 
                    onClick={() => setShowAuthModal(true)}
                    size="sm"
                    className="w-100 w-lg-auto"
                  >
                    Ingresar
                  </Button>
                )}
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      {/* Espaciador para el contenido fijo */}
      <div style={{ height: '80px' }} className="d-none d-lg-block"></div>
      <div style={{ height: '70px' }} className="d-lg-none"></div>
      
      <AuthModal show={showAuthModal} handleClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default CustomNavbar;