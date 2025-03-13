import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import YouTube from 'react-youtube';

export default function LivePage() {
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'streams'));
        const currentStream = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .find(s => s.isLive);
        
        setStream(currentStream || null);
      } catch (error) {
        console.error("Error cargando stream:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, []);

  const videoOptions = {
    height: '600',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      showinfo: 0,
      mute: 0
    },
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="section"
    >
      <Container>
        <h2 className="section-title">Transmisión en Vivo</h2>
        
        {stream ? (
          <>
            <div className="stream-container mb-4">
              <YouTube videoId={extractYoutubeId(stream.youtubeUrl)} opts={videoOptions} />
            </div>
            
            <Row className="g-4">
              <Col lg={8}>
                <h3>{stream.title}</h3>
                <Badge bg="danger" className="mb-3">En Vivo</Badge>
                <p className="lead">{stream.description}</p>
              </Col>
              <Col lg={4}>
                <div className="stream-info-card p-4 rounded-3 shadow">
                  <h4>Próximos Eventos</h4>
                  <ul className="list-unstyled">
                    <li className="mb-2">• Torneo Pokémon: 15:00 hrs</li>
                    <li className="mb-2">• Apertura de sobres Magic: 17:00 hrs</li>
                    <li className="mb-2">• Q&A con jugadores pro: 19:00 hrs</li>
                  </ul>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <div className="text-center py-5">
            <h3>No hay transmisiones en vivo actualmente</h3>
            <p className="text-muted">¡Vuelve más tarde para nuestro próximo stream!</p>
          </div>
        )}
      </Container>
    </motion.div>
  );
}

// Función auxiliar para extraer ID de YouTube
function extractYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}