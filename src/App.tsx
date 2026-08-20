import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import { AdminLayout } from './layouts/AdminLayout'
import Home from './pages/Home'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { PageSpinner } from './components/ui/primitives'

const ProductDetail = lazy(() =>
  import('./pages/ProductDetail').then((m) => ({ default: m.default })),
)

const Dashboard = lazy(() =>
  import('./pages/admin/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const Products = lazy(() =>
  import('./pages/admin/Products').then((m) => ({ default: m.Products })),
)
const ProductNew = lazy(() =>
  import('./pages/admin/ProductNew').then((m) => ({ default: m.ProductNew })),
)
const ProductEdit = lazy(() =>
  import('./pages/admin/ProductEdit').then((m) => ({ default: m.ProductEdit })),
)
const Categories = lazy(() =>
  import('./pages/admin/Categories').then((m) => ({ default: m.Categories })),
)
const Orders = lazy(() =>
  import('./pages/admin/Orders').then((m) => ({ default: m.Orders })),
)
const OrderDetail = lazy(() =>
  import('./pages/admin/OrderDetail').then((m) => ({ default: m.OrderDetail })),
)
const Settings = lazy(() =>
  import('./pages/admin/Settings').then((m) => ({ default: m.Settings })),
)

function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:slug" element={<ProductDetail />} />
        </Route>

        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductNew />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default App