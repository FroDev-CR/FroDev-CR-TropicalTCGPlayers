import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Modal, Button, Image } from 'react-bootstrap';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('es');
const localizer = momentLocalizer(moment);

export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'events'));
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title || 'Evento sin título',
          start: doc.data().date?.toDate() || new Date(),
          end: doc.data().date?.toDate() || new Date(),
          description: doc.data().description || '',
          price: doc.data().price || 0,
          image: doc.data().image || 'https://via.placeholder.com/500x300'
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error("Error cargando eventos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const eventStyle = (event) => ({
    style: {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${event.image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: 'none',
      borderRadius: '4px',
      color: 'white',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }
  });

  const EventContent = ({ event }) => (
    <div className="p-1 text-center w-100">
      <div className="event-title">{event.title}</div>
      {event.price > 0 && <div className="event-price">${event.price}</div>}
    </div>
  );

  return (
    <>
      <div className="calendar-container">
        {loading ? (
          <div className="text-center my-5">Cargando eventos...</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            components={{ event: EventContent }}
            eventPropGetter={eventStyle}
            onSelectEvent={(event) => {
              setSelectedEvent(event);
              setShowModal(true);
            }}
            messages={{
              today: 'Hoy',
              previous: 'Anterior',
              next: 'Siguiente',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              noEventsInRange: 'No hay eventos programados.'
            }}
          />
        )}
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-primary">{selectedEvent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-4">
            <div className="col-md-6">
              <Image 
                src={selectedEvent?.image} 
                alt={selectedEvent?.title}
                fluid
                className="rounded-3 modal-image"
              />
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-column h-100">
                <div className="mb-3">
                  <h5 className="text-accent">Detalles del Evento</h5>
                  <div className="detail-item">
                    <i className="bi bi-calendar-event me-2"></i>
                    {moment(selectedEvent?.start).format('DD MMM YYYY - HH:mm')}
                  </div>
                  <div className="detail-item">
                    <i className="bi bi-cash me-2"></i>
                    Valor: ${selectedEvent?.price}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-muted mb-0">
                    {selectedEvent?.description || 'Descripción no disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}

