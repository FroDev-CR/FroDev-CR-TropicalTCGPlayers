// src/components/FeaturedSections.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { FaFire, FaStar, FaGem, FaClock, FaCrown, FaEye, FaShoppingCart, FaWhatsapp } from 'react-icons/fa';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../contexts/CartContext';

const SECTION_CONFIGS = {
  offers: {
    title: "🔥 Ofertas del Día",
    subtitle: "Cartas con los mejores precios",
    icon: FaFire,
    color: "danger",
    limit: 6
  },
  popular: {
    title: "⭐ Más Populares", 
    subtitle: "Las cartas más vistas y compradas",
    icon: FaStar,
    color: "warning",
    limit: 6
  },
  rare: {
    title: "💎 Cartas Raras",
    subtitle: "Encuentra cartas especiales y únicas",
    icon: FaGem,
    color: "info",
    limit: 6
  },
  recent: {
    title: "Recién Agregadas",
    subtitle: "Últimas cartas publicadas",
    icon: FaClock,
    color: "success",
    limit: 6
  },
};

function FeaturedCard({ listing, onViewCard, onAddToCart }) {
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await onAddToCart(listing);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
    setLoading(false);
  };

  return (
    <div 
      className="simple-card-container"
      onClick={() => {
        // Crear objeto completo de carta con toda la información necesaria
        const cardData = {
          id: listing.cardId || listing.id,
          name: listing.cardName,
          images: { 
            small: listing.cardImage, 
            large: listing.cardImage 
          },
          set: { 
            name: typeof listing.setName === 'object' ? 
              (listing.setName.name || 'Desconocido') : 
              (listing.setName || 'Desconocido') 
          },
          rarity: listing.rarity || 'Sin rareza',
          tcgType: listing.tcgType || 'unknown',
          // Agregar información de precios
          tcgPlayer: {
            low: listing.price * 0.8, // Precio bajo simulado
            market: listing.price,     // Precio de mercado
            high: listing.price * 1.2  // Precio alto simulado
          },
          // Agregar vendedores locales
          sellers: [{
            listingId: listing.id,
            sellerId: listing.sellerId,
            sellerName: listing.sellerName,
            price: listing.price,
            condition: listing.condition,
            quantity: listing.availableQuantity || listing.quantity || 1,
            createdAt: listing.createdAt,
            userPhone: listing.userPhone,
            userEmail: listing.userEmail,
            location: listing.location
          }],
          hasLocalSellers: true,
          // Agregar campos específicos según el TCG
          language: listing.language || null
        };
        onViewCard(cardData);
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="simple-card-image-wrapper">
        <img 
          src={listing.cardImage || 'https://via.placeholder.com/300x400'} 
          alt={listing.cardName}
          className="simple-card-image"
        />
        
        {/* Overlay con precio */}
        <div className="simple-card-overlay">
          <div className="simple-price-badge">
            ₡{typeof listing.price === 'number' ? listing.price.toLocaleString() : listing.price}
          </div>
        </div>
      </div>
      
      {/* Información del vendedor debajo */}
      <div className="simple-card-info">
        <small className="seller-name">
          {listing.sellerName || "Vendedor"}
        </small>
      </div>
    </div>
  );
}

function FeaturedSection({ sectionKey, listings, onViewCard, onAddToCart }) {
  const config = SECTION_CONFIGS[sectionKey];
  
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="featured-section mb-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <div className={`d-flex align-items-center gap-2 text-${config.color}`}>
          <config.icon size={24} />
          <div>
            <h4 className="mb-0">{config.title}</h4>
            <small className="text-muted">{config.subtitle}</small>
          </div>
        </div>
      </div>
      
      <div className="latest-cards-horizontal">
        <div className="latest-cards-container">
          {listings.slice(0, config.limit).map(listing => (
            <div key={listing.id} className="latest-card-item">
              <FeaturedCard 
                listing={listing}
                onViewCard={onViewCard}
                onAddToCart={onAddToCart}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSections({ onViewCard }) {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      try {
        const sectionsData = {};

        // 1. Ofertas del día (cartas baratas)
        const offersQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          where('price', '<=', 15),
          orderBy('price', 'asc'),
          limit(6)
        );
        const offersSnapshot = await getDocs(offersQuery);
        sectionsData.offers = offersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Cartas raras (por rareza)
        const rareQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const rareSnapshot = await getDocs(rareQuery);
        const allRare = rareSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        sectionsData.rare = allRare
          .filter(listing => {
            const rarity = (listing.rarity || '').toLowerCase();
            return rarity.includes('rare') || rarity.includes('ultra') || rarity.includes('secret') || rarity.includes('special');
          })
          .slice(0, 6);

        // 3. Recién agregadas (últimas 24-48 horas)
        const recentQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const recentSnapshot = await getDocs(recentQuery);
        sectionsData.recent = recentSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Populares (simulado con cartas de precio medio)
        const popularQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          where('price', '>=', 20),
          where('price', '<=', 50),
          orderBy('price', 'desc'),
          limit(6)
        );
        const popularSnapshot = await getDocs(popularQuery);
        sectionsData.popular = popularSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));


        setSections(sectionsData);
      } catch (error) {
        console.error('Error fetching featured sections:', error);
      }
      setLoading(false);
    };

    fetchFeaturedListings();
  }, []);

  const handleAddToCart = async (listing) => {
    try {
      await addToCart(listing);
      // Aquí podrías mostrar un toast de éxito
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Error al agregar al carrito');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" className="mb-3" />
        <p className="text-muted">Cargando secciones destacadas...</p>
      </div>
    );
  }

  return (
    <div className="featured-sections">
      {Object.entries(sections).map(([sectionKey, listings]) => (
        <FeaturedSection
          key={sectionKey}
          sectionKey={sectionKey}
          listings={listings}
          onViewCard={onViewCard}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
}