// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomNavbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import Footer from './components/Footer';
import AdminPanel from './pages/AdminPanel';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import CreateListing from './pages/CreateListing';
import Cart from './pages/Cart';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import './styles/marketplace.css';
import './styles/fonts.css';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import BinderView from './pages/BinderView';
import Binders from './pages/Binders';
import Dashboard from './pages/Dashboard';
import { CartProvider } from './contexts/CartContext';
import backgroundImage from './assets/images/textura3.png';

function App() {
  const backgroundStyle = {
    minHeight: '100vh',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    display: 'flex',
    flexDirection: 'column'
  };
  return (
    <CartProvider>
      <Router>
        <div style={backgroundStyle}>
          <CustomNavbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/eventos" element={<Events />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/crear-listado" element={<CreateListing />} />
            <Route path="/binders" element={<Binders />} />
            <Route path="/binder/:id" element={<BinderView />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
          <Toaster position="top-right" />
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;