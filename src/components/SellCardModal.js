// src/components/SellCardModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, ListGroup } from 'react-bootstrap';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const API_KEY = '1f1c90be-e3da-4ff5-9753-8a662f20c2f0';

export default function SellCardModal({ show, handleClose }) {
  const [sellSearchTerm, setSellSearchTerm] = useState('');
  const [sellCards, setSellCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState('NM');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para la paginación en la búsqueda del modal
  const [sellPage, setSellPage] = useState(1);
  const [sellTotalPages, setSellTotalPages] = useState(1);

  // Función para buscar cartas permitiendo espacios correctamente
  const searchSellCards = async (page = 1) => {
    if (!sellSearchTerm.trim()) return;
    setLoading(true);
    try {
      // Limpieza básica: se conservan los espacios (normalizados)
      const sanitizedTerm = sellSearchTerm.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
      let queryTerm;
      // Si el término tiene espacios, lo envolvemos en comillas; si no, añadimos un wildcard
      if (sanitizedTerm.includes(' ')) {
        queryTerm = encodeURIComponent(`"${sanitizedTerm}"`);
      } else {
        queryTerm = encodeURIComponent(sanitizedTerm + '*');
      }
      const response = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=name:${queryTerm}&page=${page}&pageSize=10`,
        { headers: { 'X-Api-Key': API_KEY } }
      );
      if (!response.ok) throw new Error('Error al buscar cartas');
      const data = await response.json();
      setSellCards(data.data || []);
      setSellTotalPages(Math.ceil((data.totalCount || 0) / 10));
      setSellPage(page);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
    setLoading(false);
  };

  // Manejar el envío del listado para crear la venta
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCard) {
      alert('Por favor, selecciona una carta.');
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      alert('Ingresa un precio válido.');
      return;
    }
    setSubmitting(true);
    try {
      const listingData = {
        cardId: selectedCard.id,
        cardName: selectedCard.name,
        cardImage: selectedCard.images?.small || 'https://via.placeholder.com/300',
        quantity: Number(quantity),
        condition,
        description,
        location,
        price: parseFloat(price),
        userId: auth.currentUser ? auth.currentUser.uid : null,
        sellerName: auth.currentUser?.displayName || auth.currentUser?.email || 'Sin nombre',
        createdAt: new Date()
      };
      await addDoc(collection(db, 'listings'), listingData);
      alert('Listado creado exitosamente.');
      // Reiniciamos los campos del formulario
      setSellSearchTerm('');
      setSellCards([]);
      setSelectedCard(null);
      setQuantity(1);
      setCondition('NM');
      setDescription('');
      setLocation('');
      setPrice('');
      handleClose();
    } catch (error) {
      console.error(error);
      alert('Error al crear el listado');
    }
    setSubmitting(false);
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Vender Cartas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {/* Buscador para la carta */}
          <Form.Group className="mb-3">
            <Form.Label>Buscar Carta</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="text"
                placeholder="Buscar carta (ej: 'Radiant Greninja')..."
                value={sellSearchTerm}
                onChange={(e) => {
                  setSellSearchTerm(e.target.value);
                  setSellPage(1); // Reiniciamos la paginación al cambiar el término
                }}
              />
              <Button variant="primary" onClick={() => searchSellCards(1)} disabled={loading} className="ms-2">
                {loading ? (
                  <Spinner size="sm" animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </Spinner>
                ) : 'Buscar'}
              </Button>
            </div>
          </Form.Group>

          {/* Resultados de búsqueda con paginación */}
          {!selectedCard && sellCards.length > 0 && (
            <>
              <ListGroup className="mb-3">
                {sellCards.map(card => (
                  <ListGroup.Item key={card.id} action onClick={() => setSelectedCard(card)}>
                    <div className="d-flex align-items-center">
                      <img
                        src={card.images?.small || 'https://via.placeholder.com/50'}
                        alt={card.name}
                        style={{ width: '50px', marginRight: '10px' }}
                      />
                      <span>{card.name}</span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              {sellTotalPages > 1 && (
                <div className="d-flex justify-content-between mt-2">
                  <Button variant="secondary" disabled={sellPage === 1} onClick={() => searchSellCards(sellPage - 1)}>
                    Anterior
                  </Button>
                  <span>Página {sellPage} de {sellTotalPages}</span>
                  <Button variant="secondary" disabled={sellPage === sellTotalPages} onClick={() => searchSellCards(sellPage + 1)}>
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Mostrar carta seleccionada */}
          {selectedCard && (
            <div className="mb-3">
              <h6>Carta seleccionada:</h6>
              <div className="d-flex align-items-center">
                <img
                  src={selectedCard.images?.small || 'https://via.placeholder.com/50'}
                  alt={selectedCard.name}
                  style={{ width: '50px', marginRight: '10px' }}
                />
                <span>{selectedCard.name}</span>
                <Button variant="link" onClick={() => setSelectedCard(null)}>
                  Cambiar
                </Button>
              </div>
            </div>
          )}

          {/* Campo para cantidad */}
          <Form.Group className="mb-3">
            <Form.Label>Cantidad</Form.Label>
            <Form.Control
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </Form.Group>

          {/* Campo para condición */}
          <Form.Group className="mb-3">
            <Form.Label>Condición</Form.Label>
            <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)} required>
              <option value="NM">NM</option>
              <option value="GOOD">GOOD</option>
              <option value="POOR">POOR</option>
            </Form.Select>
          </Form.Group>

          {/* Campo para precio */}
          <Form.Group className="mb-3">
            <Form.Label>Precio (USD)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 5.00"
              required
            />
          </Form.Group>

          {/* Campo para descripción */}
          <Form.Group className="mb-3">
            <Form.Label>Descripción del Vendedor</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalles de la carta, estado, etc."
            />
          </Form.Group>

          {/* Campo para ubicación */}
          <Form.Group className="mb-3">
            <Form.Label>Ubicación (donde dejas la carta)</Form.Label>
            <Form.Control
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: San José, Costa Rica"
              required
            />
          </Form.Group>

          <div className="text-end">
            <Button variant="secondary" onClick={handleClose} disabled={submitting} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" role="status" />
                  <span className="ms-2">Publicando...</span>
                </>
              ) : (
                'Publicar Listado'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  ); 
}
