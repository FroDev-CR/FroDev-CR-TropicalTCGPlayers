import { Container } from 'react-bootstrap';
import { motion } from 'framer-motion';
import CarouselHero from '../components/CarouselHero';
import LatestCards from '../components/LatestCards';
import UpcomingEvents from '../components/UpcomingEvents';

export default function Home() {
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
          <LatestCards />
        </Container>
      </section>

      {/* Sección de próximos eventos */}
      <section className="section">
        <Container>
          <UpcomingEvents />
        </Container>
      </section>

    </motion.div>
  );
}