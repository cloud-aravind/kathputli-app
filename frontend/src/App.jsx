import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Navbar from './components/Navbar'
import PageTransition from './components/PageTransition'
import ProtectedRoute from './components/ProtectedRoute'

import Home from './pages/home'
import Shop from './pages/Shop'
import Artists from './pages/Artists'
import Wishlist from './pages/Wishlist'
import ArtistDashboard from './pages/ArtistDashboard'
import ArtworkUpload from './pages/ArtworkUpload'
import ArtworkManagement from './pages/ArtworkManagement'
import ArtworkEdit from './pages/ArtworkEdit'
import ArtworkModeration from './pages/ArtworkModeration'

import Login from './pages/Login'
import Register from './pages/Register'

import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderTrack from './pages/OrderTrack'
import Profile from './pages/Profile'

import AdminDashboard from './pages/AdminDashboard'

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-stone-900">
          Page not found
        </h1>

        <p className="mt-3 text-sm text-stone-500">
          The page you are looking for does not exist.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />

      <Navbar />

      <PageTransition>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer shopping flow */}
          <Route path="/cart" element={<Cart />} />

          {/* Temporarily public during UI verification */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderTrack />} />
          <Route path="/profile" element={<Profile />} />

          {/* Artist workflow */}
          {/* Temporarily public during UI verification */}
          <Route
            path="/artist/dashboard"
            element={<ArtistDashboard />}
          />

          <Route
            path="/artist/artworks/upload"
            element={<ArtworkUpload />}
          />

          <Route
            path="/artist/artworks"
            element={<ArtworkManagement />}
          />

          <Route
            path="/artist/artworks/:id/edit"
            element={<ArtworkEdit />}
          />

          {/* Platform administration */}
          {/* Temporarily public during UI verification */}
          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          {/* Artwork moderation */}
          {/* Temporarily public during UI verification */}
          <Route
            path="/admin/moderation"
            element={<ArtworkModeration />}
          />

          {/* Restaurant administration removed */}
          {/* Will be cleaned up from the remaining frontend files separately. */}

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </>
  )
}