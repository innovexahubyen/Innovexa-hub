import { getSession, onAuthStateChange, signOut, getUserProfile } from './auth.js'
import { supabase } from './lib/supabase.js'
import { ensureProfile } from './db.js'

// ── State ──
let currentUser = null
let currentProfile = null
let currentPage = 'login'
let announcementSubscription = null

// ── Initialize ──
export async function initApp() {
  const session = await getSession()
  if (session) {
    currentUser = session.user
    try {
      currentProfile = await ensureProfile(session.user)
    } catch (e) { console.warn('No profile yet') }
  }

  onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user
      try { currentProfile = await ensureProfile(session.user) } catch(e) {}
      setupRealtimeNotifications()
      navigateTo(currentProfile?.role === 'admin' ? 'admin' : 'dashboard')
    } else if (event === 'SIGNED_OUT') {
      currentUser = null
      currentProfile = null
      if (announcementSubscription) {
        await supabase.removeChannel(announcementSubscription)
        announcementSubscription = null
      }
      navigateTo('login')
    }
  })

  // Hash router
  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}

function setupRealtimeNotifications() {
  if (announcementSubscription) return
  announcementSubscription = supabase
    .channel('public:announcements')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, payload => {
      showToast(`📢 New Announcement: ${payload.new.title}`, 'info')
    })
    .subscribe()
}

export function getState() {
  return { currentUser, currentProfile, currentPage }
}

export function navigateTo(page) {
  window.location.hash = page
}

async function handleRoute() {
  const hash = window.location.hash.slice(1) || 'login'
  currentPage = hash

  const app = document.getElementById('app')
  app.innerHTML = '<div class="page-loading"><div class="spinner"></div><p>Loading...</p></div>'

  // If logged in and on login page, redirect to dashboard/admin
  if (currentUser && hash === 'login') {
    navigateTo(currentProfile?.role === 'admin' ? 'admin' : 'dashboard')
    return
  }

  try {
    switch (hash) {
      case 'login': {
        const { renderLogin } = await import('./pages/login.js')
        renderLogin(app)
        break
      }
      case 'dashboard':
      case 'member-events':
      case 'member-posts':
      case 'member-chat':
      case 'member-announcements':
      case 'member-contact': {
        if (!currentUser) { navigateTo('login'); return }
        const { renderDashboard } = await import('./pages/dashboard.js')
        renderDashboard(app, hash)
        break
      }
      case 'admin':
      case 'admin-members':
      case 'admin-events':
      case 'admin-posts':
      case 'admin-announcements': {
        if (!currentUser) { navigateTo('login'); return }
        const { renderAdmin } = await import('./pages/admin.js')
        renderAdmin(app, hash)
        break
      }
      default:
        navigateTo('login')
    }
  } catch (err) {
    console.error('Route error:', err)
    app.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${err.message}</p></div>`
  }
}

// ── Nav bar HTML ──
export function getNavbar(activePage) {
  const isLoggedIn = !!currentUser
  const isAdmin = currentProfile?.role === 'admin'

  return `
  <nav class="navbar">
    <div class="container" style="display:flex;justify-content:space-between;align-items:center;height:64px;">
      <a class="nav-brand" onclick="location.hash='${isAdmin ? 'admin' : 'dashboard'}'">
        <img src="/assets/logo.png" alt="Innovexa Hub">
        <span>Innovexa Hub</span>
      </a>
      <ul class="nav-links">
        ${isLoggedIn ? `
          <li><a href="#dashboard" class="${activePage === 'dashboard' ? 'active' : ''}">My Profile</a></li>
          ${isAdmin ? `<li><a href="#admin" class="${activePage.startsWith('admin') ? 'active' : ''}">Admin Panel</a></li>` : ''}
          <li><a href="#" id="logout-btn">Logout</a></li>
        ` : ''}
      </ul>
    </div>
  </nav>`
}

export function attachNavEvents() {
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      await signOut()
    })
  }
}

// ── Footer HTML ──
export function getFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="./assets/logo.png" alt="Innovexa Hub">
          <p>Innovexa Hub is a tech community dedicated to innovation, learning, and collaboration. Join us to explore the future of technology.</p>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#events">Events</a></li>
            <li><a href="#posts">Posts</a></li>
          </ul>
        </div>
        <div>
          <h4>Connect</h4>
          <ul class="footer-links">
            <li><a href="#login">Member Login</a></li>
            <li><a href="mailto:innovexahub.bangalore@gmail.com">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${new Date().getFullYear()} Innovexa Hub. All rights reserved.
      </div>
    </div>
  </footer>`
}

// ── Toast ──
export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container')
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast-container'
    document.body.appendChild(container)
  }
  const toast = document.createElement('div')
  toast.className = `toast ${type}`
  toast.innerHTML = `<span class="toast-message">${message}</span>`
  container.appendChild(toast)
  setTimeout(() => { toast.remove() }, 3500)
}

// ── Modal ──
export function showModal(title, bodyHTML, footerHTML = '') {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="btn btn-ghost btn-icon close-modal">&times;</button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>`
  document.body.appendChild(overlay)
  overlay.querySelector('.close-modal').addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })
  return overlay
}

export function closeModal() {
  document.querySelector('.modal-overlay')?.remove()
}

// ── Date formatting ──
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Start
document.addEventListener('DOMContentLoaded', initApp)
