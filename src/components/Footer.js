import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => (
  <footer className="bg-dark text-light py-5 mt-5">
    <Container>
      <Row>
        <Col md={6}>
          <h5>Horario de Atención</h5>
          <p className="mb-0">Lunes a Viernes: 10:00 - 20:00 hrs</p>
          <p>Sábado y Domingo: 11:00 - 22:00 hrs</p>
        </Col>
        <Col md={6} className="text-md-end">
          <h5>Síguenos</h5>
          <div className="d-flex gap-3 justify-content-md-end">
            <a href="#" className="text-light"><i className="bi bi-instagram fs-4"></i></a>
            <a href="#" className="text-light"><i className="bi bi-facebook fs-4"></i></a>
            <a href="#" className="text-light"><i className="bi bi-twitter-x fs-4"></i></a>
          </div>
        </Col>
      </Row>
      <hr className="my-4"/>
      <p className="text-center mb-0 small">
        © 2024 Tropical Players TCG  - Todos los derechos reservados
      </p>
    </Container>
  </footer>
);

export default Footer;