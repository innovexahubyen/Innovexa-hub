import { getNavbar, getFooter, attachNavEvents, formatDate, formatDateTime } from '../app.js'
import { getEvents } from '../db.js'
import { getAnnouncements } from '../db.js'

export async function renderHome(app) {
  let events = [], announcements = []
  try { events = (await getEvents()).slice(0, 3) } catch(e) {}
  try { announcements = (await getAnnouncements()).slice(0, 4) } catch(e) {}

  app.innerHTML = `
    ${getNavbar('home')}

    <section class="hero">
      <div class="hero-content">
        <div class="hero-logo"><img src="./assets/logo.png" alt="Innovexa Hub"></div>
        <h1>System Online: Innovexa Hub</h1>
        <p>A decentralized network for innovation, collective intelligence, and recursive learning.</p>
        <div class="hero-actions">
          <a href="#events" class="btn btn-primary btn-lg">Target Objectives</a>
          <a href="#login" class="btn btn-outline btn-lg">Initialize User</a>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="container">
        <div class="section-header">
          <h2>System Broadcasts</h2>
          <p>Recent packet transmissions from the core network</p>
          <div class="accent-line"></div>
        </div>
        <div class="grid" id="announcements-grid">
          ${announcements.length === 0 ? '<div class="empty-state"><h3>No announcements yet</h3><p>Check back soon for updates!</p></div>' :
            announcements.map(a => `
              <div class="card">
                <div class="card-header">
                  <div class="card-icon">📢</div>
                  <div>
                    <div class="card-title">${a.title}</div>
                    <div class="card-meta">${formatDate(a.created_at)}</div>
                  </div>
                </div>
                <div class="card-body">${a.content || ''}</div>
              </div>
            `).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Target Objectives</h2>
          <p>Upcoming milestones in the hub's roadmap</p>
          <div class="accent-line"></div>
        </div>
        <div class="grid" id="events-grid">
          ${events.length === 0 ? '<div class="empty-state"><h3>No upcoming events</h3><p>Stay tuned for exciting events!</p></div>' :
            events.map(ev => `
              <div class="card">
                <div class="card-header">
                  <div class="card-icon">🗓️</div>
                  <div>
                    <div class="card-title">${ev.title}</div>
                    <div class="card-meta">${formatDateTime(ev.event_date)}${ev.location ? ` · ${ev.location}` : ''}</div>
                  </div>
                </div>
                <div class="card-body">${ev.description || ''}</div>
              </div>
            `).join('')}
        </div>
        <div class="text-center mt-3">
          <a href="#events" class="btn btn-secondary">All Objectives →</a>
        </div>
      </div>
    </section>

    ${getFooter()}
  `
  attachNavEvents()
}
