// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs, Table, Badge, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { FaChartLine, FaBoxOpen, FaDollarSign, FaStar, FaEye, FaEdit, FaTrash, FaPlus, FaCalendarAlt, FaTrophy } from 'react-icons/fa';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, getDoc, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import SellCardModal from '../components/SellCardModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  
  // Data states
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalListings: 0,
    activeListings: 0,
    averageRating: 0,
    totalReviews: 0,
    salesData: [],
    tcgDistribution: [],
    recentSales: [],
    topListings: []
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const sellerId = user.uid;
      const periodDays = parseInt(selectedPeriod);
      const startDate = startOfDay(subDays(new Date(), periodDays));
      const endDate = endOfDay(new Date());

      // Fetch transactions (sales)
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('sellerId', '==', sellerId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()
      }));

      // Fetch all listings
      const listingsQuery = query(
        collection(db, 'listings'),
        where('sellerId', '==', sellerId),
        orderBy('createdAt', 'desc')
      );
      const listingsSnapshot = await getDocs(listingsQuery);
      const listings = listingsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()
      }));

      // Fetch user data for rating
      const userDoc = await getDoc(doc(db, 'users', sellerId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      // Calculate statistics
      const totalSales = transactions.length;
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const activeListings = listings.filter(l => l.status === 'active').length;
      const averageRating = userData.rating || 0;
      const totalReviews = userData.reviews || 0;

      // Generate sales data for chart
      const salesData = generateSalesChartData(transactions, periodDays);
      
      // TCG distribution
      const tcgDistribution = generateTCGDistribution(listings);

      // Recent sales (last 10)
      const recentSales = transactions.slice(0, 10);

      // Top listings by views/favorites
      const topListings = listings
        .filter(l => l.status === 'active')
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10);

      setDashboardData({
        totalSales,
        totalRevenue,
        totalListings: listings.length,
        activeListings,
        averageRating,
        totalReviews,
        salesData,
        tcgDistribution,
        recentSales,
        topListings
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const generateSalesChartData = (transactions, days) => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayTransactions = transactions.filter(t => 
        t.createdAt && format(t.createdAt, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      data.push({
        date: format(date, 'dd/MM', { locale: es }),
        sales: dayTransactions.length,
        revenue: dayTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
      });
    }
    return data;
  };

  const generateTCGDistribution = (listings) => {
    const distribution = {};
    listings.forEach(listing => {
      const tcg = listing.tcgType || 'Unknown';
      distribution[tcg] = (distribution[tcg] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await deleteDoc(doc(db, 'listings', listingId));
        fetchDashboardData(); // Refresh data
        alert('Publicación eliminada exitosamente');
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Error al eliminar la publicación');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { label: 'Activo', variant: 'success' },
      'sold': { label: 'Vendido', variant: 'info' },
      'inactive': { label: 'Inactivo', variant: 'secondary' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status" className="mb-3" />
          <p className="text-muted">Cargando dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">📊 Dashboard de Vendedor</h2>
        <div className="d-flex gap-2 align-items-center">
          <Form.Select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
          </Form.Select>
          <Button 
            variant="primary" 
            onClick={() => setShowSellModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <FaPlus size={14} />
            Nueva Venta
          </Button>
        </div>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="overview" title="📈 Resumen">
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaDollarSign className="text-success mb-2" size={24} />
                  <h3 className="text-success">{formatCurrency(dashboardData.totalRevenue)}</h3>
                  <small className="text-muted">Ingresos Totales</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaChartLine className="text-primary mb-2" size={24} />
                  <h3 className="text-primary">{dashboardData.totalSales}</h3>
                  <small className="text-muted">Ventas Realizadas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaBoxOpen className="text-warning mb-2" size={24} />
                  <h3 className="text-warning">{dashboardData.activeListings}</h3>
                  <small className="text-muted">Publicaciones Activas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body>
                  <FaStar className="text-info mb-2" size={24} />
                  <h3 className="text-info">{dashboardData.averageRating.toFixed(1)}</h3>
                  <small className="text-muted">Rating Promedio ({dashboardData.totalReviews} reseñas)</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="mb-4">
            <Col md={8}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <FaChartLine className="text-primary" />
                    Ventas e Ingresos por Día
                  </h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboardData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#0d6efd" 
                        strokeWidth={2}
                        name="Ventas"
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#198754" 
                        strokeWidth={2}
                        name="Ingresos (₡)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Distribución por TCG</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboardData.tcgDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.tcgDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Sales */}
          <Row>
            <Col>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-light">
                  <h5 className="mb-0 d-flex align-items-center gap-2">
                    <FaTrophy className="text-warning" />
                    Ventas Recientes
                  </h5>
                </Card.Header>
                <Card.Body>
                  {dashboardData.recentSales.length === 0 ? (
                    <Alert variant="info" className="text-center">
                      <FaCalendarAlt className="me-2" />
                      No hay ventas registradas en este período.
                    </Alert>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Comprador</th>
                          <th>Productos</th>
                          <th>Total</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentSales.map((sale) => (
                          <tr key={sale.id}>
                            <td>
                              {sale.createdAt ? 
                                format(sale.createdAt, 'dd/MM/yyyy HH:mm', { locale: es }) : 
                                'N/A'
                              }
                            </td>
                            <td>{sale.buyerName || 'Usuario'}</td>
                            <td>{sale.items?.length || 1} producto(s)</td>
                            <td className="fw-bold text-success">
                              {formatCurrency(sale.totalAmount)}
                            </td>
                            <td>
                              <Badge bg="success">Completada</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="listings" title="📦 Mis Publicaciones">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Gestión de Publicaciones</h4>
            <Button 
              variant="primary" 
              onClick={() => setShowSellModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FaPlus size={14} />
              Nueva Publicación
            </Button>
          </div>

          {dashboardData.topListings.length === 0 ? (
            <Alert variant="info" className="text-center">
              <FaBoxOpen className="me-2" />
              No tienes publicaciones activas. ¡Crea tu primera publicación!
            </Alert>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Imagen</th>
                      <th>Carta</th>
                      <th>TCG</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Vistas</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <img 
                            src={listing.cardImage || 'https://via.placeholder.com/50'} 
                            alt={listing.cardName}
                            style={{ width: '50px', height: '70px', objectFit: 'contain' }}
                            className="rounded"
                          />
                        </td>
                        <td>
                          <div>
                            <div className="fw-bold">{listing.cardName}</div>
                            <small className="text-muted">{listing.setName}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg="secondary">{listing.tcgType?.toUpperCase()}</Badge>
                        </td>
                        <td className="fw-bold text-success">
                          {formatCurrency(listing.price)}
                        </td>
                        <td>
                          <Badge bg={listing.availableQuantity > 0 ? 'success' : 'danger'}>
                            {listing.availableQuantity || 0}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <FaEye className="text-muted" size={14} />
                            <span>{listing.views || 0}</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(listing.status)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              title="Editar"
                            >
                              <FaEdit size={12} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => handleDeleteListing(listing.id)}
                              title="Eliminar"
                            >
                              <FaTrash size={12} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* Sell Card Modal */}
      <SellCardModal
        show={showSellModal}
        onHide={() => setShowSellModal(false)}
        onSuccess={() => {
          setShowSellModal(false);
          fetchDashboardData(); // Refresh dashboard data
        }}
      />
    </Container>
  );
}