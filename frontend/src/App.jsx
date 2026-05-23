import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import ContactPage from './pages/ContactPage'
import OrderTrackingPage from './pages/OrderTrackingPage'

import AdminLayout from './pages/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminMenu from './pages/admin/AdminMenu'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminExpenses from './pages/admin/AdminExpenses'
import AdminReviews from './pages/admin/AdminReviews';

const PublicLayout = ({ children }) => (
  <div>
    <Navbar />
    {children}
    <Footer />
  </div>
)

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>

              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/menu" element={<PublicLayout><MenuPage /></PublicLayout>} />
              <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
              <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
              <Route path="/track" element={<PublicLayout><OrderTrackingPage /></PublicLayout>} />
              <Route path="/track/:orderNumber" element={<PublicLayout><OrderTrackingPage /></PublicLayout>} />

              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="expenses" element={<AdminExpenses />} />
                {/* <Route path="contacts" element={<AdminContacts />} /> */}
                {/* <Route path="security" element={<AdminSecurity />} /> */}
              </Route>

            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={2500}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
              limit={3}
              style={{ top: '80px' }}
            />

          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App