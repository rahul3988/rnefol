import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm hover:bg-white/10 ${isActive ? 'bg-white/10' : ''}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid grid-cols-12">
        <aside className="col-span-12 border-b border-white/10 bg-slate-900/60 p-4 md:col-span-2 md:border-b-0 md:border-r md:p-6">
          <div className="mb-6">
            <h1 className="text-lg font-semibold">Nefol Admin</h1>
            <p className="text-xs text-white/60">Control Panel</p>
          </div>
          <nav className="space-y-1">
            <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
            <NavLink to="/products" className={linkClass}>Products</NavLink>
            <NavLink to="/orders" className={linkClass}>Orders</NavLink>
            <NavLink to="/customers" className={linkClass}>Customers</NavLink>
            <NavLink to="/categories" className={linkClass}>Categories</NavLink>
            <NavLink to="/settings" className={linkClass}>Settings</NavLink>
          </nav>
        </aside>
        <section className="col-span-12 md:col-span-10">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-8">
            <div className="text-sm text-white/70">Welcome</div>
            <div className="space-x-2 text-sm">
              <button onClick={logout} className="rounded bg-white/10 px-3 py-1 hover:bg-white/15">Logout</button>
            </div>
          </header>
          <main className="p-4 md:p-8">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  )
}


