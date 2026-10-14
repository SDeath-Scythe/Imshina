import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

/** Full-screen pages with no navigation: welcome, sign-in, the stamp camera, a coupon. */
export default function AuthLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return <main id="main" className="bare"><Outlet /></main>
}
