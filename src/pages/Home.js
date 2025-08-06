import { useState } from 'react';
import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import CarouselHero from '../components/CarouselHero';
import LatestCards from '../components/LatestCards';
import UpcomingEvents from '../components/UpcomingEvents';
import CardDetailModal from '../components/CardDetailModal';

export default function Home() {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowCardModal(true);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
    setShowCardModal(false);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <section className="section" style={{ padding: 0 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <CarouselHero />
        </motion.div>
      </section>

      {/* Sección de últimas cartas */}
      <section className="section">
        <Container>
          <LatestCards onCardClick={handleCardClick} />
        </Container>
      </section>

      {/* Sección de próximos eventos */}
      <section className="section">
        <Container>
          <UpcomingEvents />
        </Container>
      </section>

      {/* Modal de Detalle de Carta */}
      <CardDetailModal 
        show={showCardModal}
        onHide={closeCardModal}
        card={selectedCard}
      />

    </motion.div>
  );
}