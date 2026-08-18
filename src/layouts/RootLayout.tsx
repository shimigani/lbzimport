import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '../components/store/Header'
import Footer from '../components/store/Footer'
import CartBottomBar from '../components/store/CartBottomBar'
import FloatingWhatsApp from '../components/store/FloatingWhatsApp'
import { getPublicSettings } from '../services/store'
import { trackPageView as trackTikTokPageView } from '../lib/tiktok'
import { trackPageView as trackMetaPageView } from '../lib/meta'
import { trackPageView as trackAnalyticsPageView } from '../lib/analytics'

function RootLayout() {
  const location = useLocation()
  const [currency, setCurrency] = useState('BOB')
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (lastPathRef.current === location.pathname) return
    lastPathRef.current = location.pathname
    trackTikTokPageView()
    trackMetaPageView()
    trackAnalyticsPageView({
      page_path: location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    })
  }, [location.pathname])

  useEffect(() => {
    let mounted = true
    getPublicSettings().then((loaded) => {
      if (!mounted || !loaded) return
      setCurrency(loaded.currency)
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="store-page-bg flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
      <CartBottomBar currency={currency} />
    </div>
  )
}

export default RootLayout