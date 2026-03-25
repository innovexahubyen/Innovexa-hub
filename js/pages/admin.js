import { getState, showToast, showModal, closeModal, formatDate, formatDateTime, navigateTo } from '../app.js'
import { signOut } from '../auth.js'
import * as db from '../db.js'

const TABS = [
  { id: 'admin', label: 'Dashboard', icon: '📊' },
  { id: 'admin-members', label: 'Members', icon: '👥' },
  { id: 'admin-events', label: 'Events', icon: '🗓️' },
  { id: 'admin-posts', label: 'Posts', icon: '📝' },
  { id: 'admin-announcements', label: 'Announcements', icon: '📢' },
]

export async function renderAdmin(app, activeTab) {
  const { currentUser, currentProfile } = getState()
  const initials = (currentProfile?.name || 'A').charAt(0).toUpperCase()

  app.innerHTML = `
    <div class="dashboard-layout">
      <aside class="sidebar">
        <a class="sidebar-brand" onclick="location.hash='home'">
          <img src="/assets/logo.png" alt="Innovexa Hub">
          <span>Innovexa Hub</span>
        </a>
        <ul class="sidebar-nav">
          ${TABS.map(t => `
            <li><a href="#${t.id}" class="${activeTab === t.id ? 'active' : ''}">
              <span>${t.icon}</span> ${t.label}
            </a></li>
          `).join('')}
        </ul>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar">${initials}</div>
            <div class="user-info">
              <div class="user-name">${currentProfile?.name || 'Admin'}</div>
              <div class="user-role">${currentProfile?.role || 'admin'}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm mt-2" id="admin-logout" style="width:100%">Logout</button>
        </div>
      </aside>

      <main class="main-content" id="admin-main"></main>
    </div>
  `

  document.getElementById('admin-logout').addEventListener('click', async () => {
    await signOut()
  })

  const main = document.getElementById('admin-main')
  switch (activeTab) {
    case 'admin': await renderAdminDashboard(main); break
    case 'admin-members': await renderAdminMembers(main); break
    case 'admin-events': await renderAdminEvents(main); break
    case 'admin-posts': await renderAdminPosts(main); break
    case 'admin-announcements': await renderAdminAnnouncements(main); break
  }
}

// ════════════════════ ADMIN DASHBOARD ════════════════════
async function renderAdminDashboard(main) {
  let members = [], events = [], posts = [], announcements = []
  try { members = await db.getMembers() } catch(e) {}
  try { events = await db.getEvents() } catch(e) {}
  try { posts = await db.getPosts() } catch(e) {}
  try { announcements = await db.getAnnouncements() } catch(e) {}

  main.innerHTML = `
    <div class="page-header"><h1>Admin Dashboard</h1></div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon members">👥</div>
        <div class="stat-info"><h3>${members.length}</h3><p>Total Members</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon events">🗓️</div>
        <div class="stat-info"><h3>${events.length}</h3><p>Events</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon posts">📝</div>
        <div class="stat-info"><h3>${posts.length}</h3><p>Posts</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon announcements">📢</div>
        <div class="stat-info"><h3>${announcements.length}</h3><p>Announcements</p></div>
      </div>
    </div>

    <div class="grid">
      <div class="table-container">
        <div class="table-header"><h3>Recent Members</h3></div>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Ticket</th></tr></thead>
          <tbody>
            ${members.slice(0, 5).map(m => `<tr><td>${m.name || '—'}</td><td>${m.email || '—'}</td><td>${m.ticket_no || '—'}</td></tr>`).join('')}
            ${members.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No members</td></tr>' : ''}
          </tbody>
        </table>
      </div>
      <div class="table-container">
        <div class="table-header"><h3>Recent Announcements</h3></div>
        <table>
          <thead><tr><th>Title</th><th>Date</th></tr></thead>
          <tbody>
            ${announcements.slice(0, 5).map(a => `<tr><td>${a.title}</td><td>${formatDate(a.created_at)}</td></tr>`).join('')}
            ${announcements.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No announcements</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    </div>
  `
}

// ════════════════════ MEMBERS CRUD ════════════════════
async function renderAdminMembers(main) {
  let members = []
  try { members = await db.getMembers() } catch(e) { console.error(e) }

  main.innerHTML = `
    <div class="page-header">
      <h1>Manage Members</h1>
      <button class="btn btn-primary" id="add-member-btn">+ Add Member</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Ticket No</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead>
        <tbody id="members-tbody">
          ${members.map(m => `
            <tr>
              <td>${m.name || '—'}</td>
              <td>${m.email || '—'}</td>
              <td>${m.phone_number || '—'}</td>
              <td>${m.ticket_no || '—'}</td>
              <td>${formatDate(m.date_of_joining)}</td>
              <td><span class="badge badge-${m.role === 'admin' ? 'accent' : 'primary'}">${m.role || 'member'}</span></td>
              <td class="table-actions">
                <button class="btn btn-ghost btn-sm edit-member" data-id="${m.id}">Edit</button>
                <button class="btn btn-danger btn-sm del-member" data-id="${m.id}">Del</button>
              </td>
            </tr>
          `).join('')}
          ${members.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No members yet</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `

  document.getElementById('add-member-btn').addEventListener('click', () => showMemberModal())

  main.querySelectorAll('.edit-member').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = members.find(x => x.id === btn.dataset.id)
      if (m) showMemberModal(m)
    })
  })

  main.querySelectorAll('.del-member').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this member?')) return
      try { await db.deleteMember(btn.dataset.id); showToast('Member deleted', 'success'); navigateTo('admin-members') }
      catch(e) { showToast(e.message, 'error') }
    })
  })
}

function showMemberModal(member = null) {
  const isEdit = !!member
  const body = `
    <div class="form-row">
      <div class="form-group"><label>Full Name</label><input id="m-name" value="${member?.name || ''}" required></div>
      <div class="form-group"><label>Email</label><input id="m-email" type="email" value="${member?.email || ''}" ${isEdit ? 'disabled' : ''} required></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Phone Number</label><input id="m-phone" value="${member?.phone_number || ''}"></div>
      <div class="form-group"><label>Ticket No</label><input id="m-ticket" value="${member?.ticket_no || ''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Date of Joining</label><input id="m-doj" type="date" value="${member?.date_of_joining || new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Role</label>
        <select id="m-role"><option value="member" ${member?.role === 'member' ? 'selected' : ''}>Member</option><option value="admin" ${member?.role === 'admin' ? 'selected' : ''}>Admin</option></select>
      </div>
    </div>
    ${!isEdit ? '<div class="form-group"><label>Password</label><input id="m-password" type="password" placeholder="Min 6 chars" minlength="6"></div>' : ''}
  `
  const footer = `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay')?.remove()">Cancel</button>
    <button class="btn btn-primary" id="save-member">${isEdit ? 'Update' : 'Create'} Member</button>`

  showModal(isEdit ? 'Edit Member' : 'Add New Member', body, footer)

  document.getElementById('save-member').addEventListener('click', async () => {
    const data = {
      name: document.getElementById('m-name').value,
      phone_number: document.getElementById('m-phone').value,
      ticket_no: document.getElementById('m-ticket').value,
      date_of_joining: document.getElementById('m-doj').value,
      role: document.getElementById('m-role').value,
    }
    try {
      if (isEdit) {
        await db.updateMember(member.id, data)
        showToast('Member updated!', 'success')
      } else {
        data.email = document.getElementById('m-email').value
        data.password = document.getElementById('m-password')?.value || 'Welcome@123'
        await db.createMember(data)
        showToast('Member created!', 'success')
      }
      closeModal()
      navigateTo('admin-members')
    } catch(e) { showToast(e.message, 'error') }
  })
}

// ════════════════════ EVENTS CRUD ════════════════════
async function renderAdminEvents(main) {
  let events = []
  try { events = await db.getEvents() } catch(e) {}

  main.innerHTML = `
    <div class="page-header">
      <h1>Manage Events</h1>
      <button class="btn btn-primary" id="add-event-btn">+ Add Event</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Actions</th></tr></thead>
        <tbody>
          ${events.map(ev => `<tr>
            <td>${ev.title}</td><td>${formatDateTime(ev.event_date)}</td><td>${ev.location || '—'}</td>
            <td class="table-actions">
              <button class="btn btn-ghost btn-sm edit-event" data-id="${ev.id}">Edit</button>
              <button class="btn btn-danger btn-sm del-event" data-id="${ev.id}">Del</button>
            </td>
          </tr>`).join('')}
          ${events.length === 0 ? '<tr><td colspan="4" class="text-center text-muted">No events</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `

  document.getElementById('add-event-btn').addEventListener('click', () => showEventModal())
  main.querySelectorAll('.edit-event').forEach(btn => {
    btn.addEventListener('click', () => { const ev = events.find(x => x.id === btn.dataset.id); if (ev) showEventModal(ev) })
  })
  main.querySelectorAll('.del-event').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this event?')) return
      try { await db.deleteEvent(btn.dataset.id); showToast('Event deleted', 'success'); navigateTo('admin-events') }
      catch(e) { showToast(e.message, 'error') }
    })
  })
}

function showEventModal(event = null) {
  const isEdit = !!event
  const body = `
    <div class="form-group"><label>Title</label><input id="ev-title" value="${event?.title || ''}" required></div>
    <div class="form-group"><label>Description</label><textarea id="ev-desc">${event?.description || ''}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Date & Time</label><input id="ev-date" type="datetime-local" value="${event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : ''}"></div>
      <div class="form-group"><label>Location</label><input id="ev-loc" value="${event?.location || ''}"></div>
    </div>
  `
  const footer = `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay')?.remove()">Cancel</button>
    <button class="btn btn-primary" id="save-event">${isEdit ? 'Update' : 'Create'}</button>`

  showModal(isEdit ? 'Edit Event' : 'New Event', body, footer)

  document.getElementById('save-event').addEventListener('click', async () => {
    const data = {
      title: document.getElementById('ev-title').value,
      description: document.getElementById('ev-desc').value,
      event_date: document.getElementById('ev-date').value,
      location: document.getElementById('ev-loc').value,
    }
    try {
      if (isEdit) { await db.updateEvent(event.id, data); showToast('Event updated!', 'success') }
      else { await db.createEvent(data); showToast('Event created!', 'success') }
      closeModal(); navigateTo('admin-events')
    } catch(e) { showToast(e.message, 'error') }
  })
}

// ════════════════════ POSTS CRUD ════════════════════
async function renderAdminPosts(main) {
  let posts = []
  try { posts = await db.getPosts() } catch(e) {}

  main.innerHTML = `
    <div class="page-header">
      <h1>Manage Posts</h1>
      <button class="btn btn-primary" id="add-post-btn">+ New Post</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${posts.map(p => `<tr>
            <td>${p.title}</td><td>${formatDate(p.created_at)}</td>
            <td class="table-actions">
              <button class="btn btn-ghost btn-sm edit-post" data-id="${p.id}">Edit</button>
              <button class="btn btn-danger btn-sm del-post" data-id="${p.id}">Del</button>
            </td>
          </tr>`).join('')}
          ${posts.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No posts</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `

  document.getElementById('add-post-btn').addEventListener('click', () => showPostModal())
  main.querySelectorAll('.edit-post').forEach(btn => {
    btn.addEventListener('click', () => { const p = posts.find(x => x.id === btn.dataset.id); if (p) showPostModal(p) })
  })
  main.querySelectorAll('.del-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return
      try { await db.deletePost(btn.dataset.id); showToast('Post deleted', 'success'); navigateTo('admin-posts') }
      catch(e) { showToast(e.message, 'error') }
    })
  })
}

function showPostModal(post = null) {
  const isEdit = !!post
  const { currentUser } = getState()
  const body = `
    <div class="form-group"><label>Title</label><input id="p-title" value="${post?.title || ''}" required></div>
    <div class="form-group"><label>Content</label><textarea id="p-content" style="min-height:150px">${post?.content || ''}</textarea></div>
  `
  const footer = `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay')?.remove()">Cancel</button>
    <button class="btn btn-primary" id="save-post">${isEdit ? 'Update' : 'Publish'}</button>`

  showModal(isEdit ? 'Edit Post' : 'New Post', body, footer)

  document.getElementById('save-post').addEventListener('click', async () => {
    const data = {
      title: document.getElementById('p-title').value,
      content: document.getElementById('p-content').value,
    }
    if (!isEdit) data.author_id = currentUser?.id
    try {
      if (isEdit) { await db.updatePost(post.id, data); showToast('Post updated!', 'success') }
      else { await db.createPost(data); showToast('Post published!', 'success') }
      closeModal(); navigateTo('admin-posts')
    } catch(e) { showToast(e.message, 'error') }
  })
}

// ════════════════════ ANNOUNCEMENTS CRUD ════════════════════
async function renderAdminAnnouncements(main) {
  let announcements = []
  try { announcements = await db.getAnnouncements() } catch(e) {}

  main.innerHTML = `
    <div class="page-header">
      <h1>Manage Announcements</h1>
      <button class="btn btn-primary" id="add-ann-btn">+ New Announcement</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${announcements.map(a => `<tr>
            <td>${a.title}</td><td>${formatDate(a.created_at)}</td>
            <td class="table-actions">
              <button class="btn btn-ghost btn-sm edit-ann" data-id="${a.id}">Edit</button>
              <button class="btn btn-danger btn-sm del-ann" data-id="${a.id}">Del</button>
            </td>
          </tr>`).join('')}
          ${announcements.length === 0 ? '<tr><td colspan="3" class="text-center text-muted">No announcements</td></tr>' : ''}
        </tbody>
      </table>
    </div>
  `

  document.getElementById('add-ann-btn').addEventListener('click', () => showAnnModal())
  main.querySelectorAll('.edit-ann').forEach(btn => {
    btn.addEventListener('click', () => { const a = announcements.find(x => x.id === btn.dataset.id); if (a) showAnnModal(a) })
  })
  main.querySelectorAll('.del-ann').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this announcement?')) return
      try { await db.deleteAnnouncement(btn.dataset.id); showToast('Deleted', 'success'); navigateTo('admin-announcements') }
      catch(e) { showToast(e.message, 'error') }
    })
  })
}

function showAnnModal(ann = null) {
  const isEdit = !!ann
  const body = `
    <div class="form-group"><label>Title</label><input id="a-title" value="${ann?.title || ''}" required></div>
    <div class="form-group"><label>Content</label><textarea id="a-content">${ann?.content || ''}</textarea></div>
  `
  const footer = `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay')?.remove()">Cancel</button>
    <button class="btn btn-primary" id="save-ann">${isEdit ? 'Update' : 'Publish'}</button>`

  showModal(isEdit ? 'Edit Announcement' : 'New Announcement', body, footer)

  document.getElementById('save-ann').addEventListener('click', async () => {
    const data = {
      title: document.getElementById('a-title').value,
      content: document.getElementById('a-content').value,
    }
    try {
      if (isEdit) { await db.updateAnnouncement(ann.id, data); showToast('Updated!', 'success') }
      else { await db.createAnnouncement(data); showToast('Published!', 'success') }
      closeModal(); navigateTo('admin-announcements')
    } catch(e) { showToast(e.message, 'error') }
  })
}
