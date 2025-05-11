// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomNavbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Footer from './components/Footer';
import AdminPanel from './pages/AdminPanel';
import LivePage from './pages/LivePage';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import CreateListing from './pages/CreateListing';
import Cart from './pages/Cart';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/main.css';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from 'react-hot-toast';
import BinderView from './pages/BinderView';
import Binders from './pages/Binders';


function App() {
  return (
    <Router>
      <CustomNavbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/crear-listado" element={<CreateListing />} />
        <Route path="/binders" element={<Binders />} />
        <Route path="/binder/:id" element={<BinderView />} />
        <Route path="/carrito" element={<Cart />} />
      </Routes>
      <Toaster position="top-right" />
      <Footer />
    </Router>
  );
}

export default App;