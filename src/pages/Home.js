import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import EventCalendar from '../components/EventCalendar';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <section className="section bg-light">
        <Container>
          <h2 className="section-title">Quiénes Somos</h2>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <motion.p
                className="lead mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                DIGALES.
              </motion.p>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="section">
        <Container>
          <h2 className="section-title">Calendario de Eventos</h2>
          <EventCalendar />
        </Container>
      </section>

    </motion.div>
  );
}