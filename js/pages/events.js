import { getNavbar, getFooter, attachNavEvents, formatDateTime } from '../app.js'
import { getEvents } from '../db.js'

export async function renderEvents(app) {
  let events = []
  try { events = await getEvents() } catch(e) { console.error(e) }

  app.innerHTML = `
    ${getNavbar('events')}

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>All Events</h2>
          <p>Discover workshops, hackathons, meetups, and more</p>
          <div class="accent-line"></div>
        </div>
        <div class="grid" id="events-list">
          ${events.length === 0 ? '<div class="empty-state"><h3>No events scheduled</h3><p>Check back soon for upcoming events!</p></div>' :
            events.map(ev => `
              <div class="card">
                <div class="card-header">
                  <div class="card-icon">🗓️</div>
                  <div>
                    <div class="card-title">${ev.title}</div>
                    <div class="card-meta">${formatDateTime(ev.event_date)}${ev.location ? ` · 📍 ${ev.location}` : ''}</div>
                  </div>
                </div>
                <div class="card-body">${ev.description || 'No description available.'}</div>
                <div class="card-footer">
                  <span class="badge badge-primary">${new Date(ev.event_date) > new Date() ? 'Upcoming' : 'Past'}</span>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </section>

    ${getFooter()}
  `
  attachNavEvents()
}
