import { getState, showToast, navigateTo, formatDate } from '../app.js'
import { signOut } from '../auth.js'
import { getEvents, getAnnouncements, getPosts, getMessages, createMessage } from '../db.js'
import { supabase } from '../lib/supabase.js'

const MEMBER_TABS = [
  { id: 'dashboard', label: 'Profile', icon: '👤' },
  { id: 'member-events', label: 'Events', icon: '🗓️' },
  { id: 'member-posts', label: 'Posts', icon: '📝' },
  { id: 'member-announcements', label: 'Announcements', icon: '📢' },
  { id: 'member-chat', label: 'Chat', icon: '💬' },
  { id: 'member-contact', label: 'Contact', icon: '📞' },
]

let chatSubscription = null

export async function renderDashboard(app, activeTab = 'dashboard') {
  const { currentUser, currentProfile } = getState()
  const profile = currentProfile || {}
  const initials = (profile.name || currentUser?.email || '?').charAt(0).toUpperCase()
  const isAdmin = profile.role === 'admin'

  app.innerHTML = `
    <div class="dashboard-layout">
      <div class="global-bg-mesh"></div>
      <aside class="sidebar">
        <a class="sidebar-brand" onclick="location.hash='dashboard'">
          <img src="./assets/logo.png" alt="Innovexa Hub">
          <span>Innovexa Hub</span>
        </a>
        <ul class="sidebar-nav">
          ${MEMBER_TABS.map(t => `
            <li><a href="#${t.id}" class="${activeTab === t.id ? 'active' : ''}">
              <span>${t.icon}</span> ${t.label}
            </a></li>
          `).join('')}
          ${isAdmin ? `
            <li style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
              <a href="#admin" class="">
                <span>⚙️</span> Admin Panel
              </a>
            </li>
          ` : ''}
        </ul>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar">${initials}</div>
            <div class="user-info">
              <div class="user-name">${profile.name || 'Member'}</div>
              <div class="user-role">${profile.role || 'member'}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm mt-2" id="dash-logout" style="width:100%">Logout</button>
        </div>
      </aside>

      <main class="main-content">
        <div class="topbar">
          <div></div>
          <div class="topbar-user">
            <span class="avatar-sm">${initials}</span>
            <span>${profile.name || currentUser?.email || 'User'}</span>
          </div>
        </div>
        <div id="dash-main"></div>
        <div class="dash-footer">
          &copy; ${new Date().getFullYear()} Innovexa Hub. All rights reserved.
        </div>
      </main>
    </div>
  `

  document.getElementById('dash-logout').addEventListener('click', async () => {
    await signOut()
  })

  const main = document.getElementById('dash-main')

  // Clean up chat subscription if navigating away
  if (activeTab !== 'member-chat' && chatSubscription) {
    supabase.removeChannel(chatSubscription)
    chatSubscription = null
  }

  switch (activeTab) {
    case 'dashboard': renderProfile(main, profile, currentUser); break
    case 'member-events': await renderMemberEvents(main); break
    case 'member-posts': await renderMemberPosts(main); break
    case 'member-announcements': await renderMemberAnnouncements(main); break
    case 'member-chat': await renderMemberChat(main, currentUser, profile); break
    case 'member-contact': renderContact(main); break
  }
}

// ════════════ PROFILE ════════════
function renderProfile(main, profile, currentUser) {
  const initials = (profile.name || '?').charAt(0).toUpperCase()
  main.innerHTML = `
    <div class="page-header"><h1>My Profile</h1></div>
    <div class="profile-card">
      <div class="profile-banner"></div>
      <div style="position:relative">
        <div class="profile-avatar">${initials}</div>
      </div>
      <div class="profile-info">
        <h2>${profile.name || 'Member'}</h2>
        <span class="badge badge-primary">${profile.role || 'member'}</span>
        <div class="profile-details">
          <div class="profile-detail">
            <label>Email</label>
            <span>${profile.email || currentUser?.email || '—'}</span>
          </div>
          <div class="profile-detail">
            <label>Phone</label>
            <span>${profile.phone_number || '—'}</span>
          </div>
          <div class="profile-detail">
            <label>Ticket No</label>
            <span>${profile.ticket_no || '—'}</span>
          </div>
          <div class="profile-detail">
            <label>Date of Joining</label>
            <span>${formatDate(profile.date_of_joining)}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

// ════════════ EVENTS ════════════
async function renderMemberEvents(main) {
  let events = []
  try { events = await getEvents() } catch(e) {}
  main.innerHTML = `
    <div class="page-header"><h1>Events</h1></div>
    <div class="grid">
      ${events.length === 0 ? '<div class="empty-state"><h3>No events yet</h3><p>Check back soon for upcoming events!</p></div>' :
        events.map(ev => `
          <div class="card">
            <div class="card-header">
              <div class="card-icon">🗓️</div>
              <div>
                <div class="card-title">${ev.title}</div>
                <div class="card-meta">${formatDate(ev.event_date)}${ev.location ? ` · 📍 ${ev.location}` : ''}</div>
              </div>
            </div>
            <div class="card-body">${ev.description || ''}</div>
          </div>
        `).join('')}
    </div>
  `
}

// ════════════ POSTS ════════════
async function renderMemberPosts(main) {
  let posts = []
  try { posts = await getPosts() } catch(e) {}
  main.innerHTML = `
    <div class="page-header"><h1>Posts</h1></div>
    <div class="grid">
      ${posts.length === 0 ? '<div class="empty-state"><h3>No posts yet</h3><p>Community posts will appear here.</p></div>' :
        posts.map(p => `
          <div class="card">
            <div class="card-header">
              <div class="card-icon">📝</div>
              <div>
                <div class="card-title">${p.title}</div>
                <div class="card-meta">By ${p.profiles?.name || 'Anonymous'} · ${formatDate(p.created_at)}</div>
              </div>
            </div>
            <div class="card-body">${p.content || ''}</div>
          </div>
        `).join('')}
    </div>
  `
}

// ════════════ ANNOUNCEMENTS ════════════
async function renderMemberAnnouncements(main) {
  let announcements = []
  try { announcements = await getAnnouncements() } catch(e) {}
  main.innerHTML = `
    <div class="page-header"><h1>Announcements</h1></div>
    <div class="grid">
      ${announcements.length === 0 ? '<div class="empty-state"><h3>No announcements yet</h3><p>Stay tuned for updates!</p></div>' :
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
  `
}

// ════════════ CONTACT ════════════
function renderContact(main) {
  main.innerHTML = `
    <div class="page-header"><h1>Contact</h1></div>
    <div class="contact-card">
      <div class="contact-header">Get in Touch</div>
      <div class="contact-body">
        <div class="contact-row">
          <span class="contact-label">📧 Email ID:</span>
          <span class="contact-value">innovexahub.bangalore@gmail.com</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">📞 Contact Number:</span>
          <span class="contact-value">None</span>
        </div>
        <div class="contact-row">
          <span class="contact-label">📍 Address:</span>
          <span class="contact-value">None</span>
        </div>
      </div>
    </div>
  `
}

// ════════════ CHAT ════════════
async function renderMemberChat(main, currentUser, profile) {
  main.innerHTML = `
    <div class="page-header"><h1>Community Chat</h1></div>
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        <div class="spinner"></div>
      </div>
      <form class="chat-input-form" id="chat-form">
        <input type="text" id="chat-input" placeholder="Type a message..." required autocomplete="off">
        <button type="submit" class="btn btn-primary" id="chat-send">Send</button>
      </form>
    </div>
  `

  const messagesContainer = document.getElementById('chat-messages')
  const chatForm = document.getElementById('chat-form')
  const chatInput = document.getElementById('chat-input')
  const sendBtn = document.getElementById('chat-send')

  const appendMessage = (msg) => {
    const isMe = msg.sender_id === currentUser.id
    const senderName = msg.profiles?.name || 'Member'
    const roleBadge = msg.profiles?.role === 'admin' ? '<span class="chat-badge admin">Admin</span>' : ''
    
    // Check if scrolled to bottom before adding
    const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 50

    const div = document.createElement('div')
    div.className = `chat-message ${isMe ? 'me' : 'other'}`
    div.innerHTML = `
      ${!isMe ? `<div class="chat-sender">${senderName} ${roleBadge}</div>` : ''}
      <div class="chat-bubble">${msg.content}</div>
      <div class="chat-time">${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `
    messagesContainer.appendChild(div)

    // Auto-scroll if it was at the bottom
    if (isScrolledToBottom || isMe) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  }

  // Initial load
  try {
    const messages = await getMessages(50)
    messagesContainer.innerHTML = ''
    if (messages.length === 0) {
      messagesContainer.innerHTML = '<div class="empty-state">No messages yet. Start the conversation!</div>'
    } else {
      messages.forEach(appendMessage)
      messagesContainer.scrollTop = messagesContainer.scrollHeight
    }
  } catch (err) {
    console.error("Chat Error: Failed to load messages:", err)
    messagesContainer.innerHTML = `<div class="empty-state" style="color:red">Failed to load messages. Check console.</div>`
  }

  // Subscribe to new messages
  if (!chatSubscription) {
    chatSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        // Fetch the sender's profile because payload.new doesn't join profiles
        const { data: senderProfile } = await supabase.from('profiles').select('name, role').eq('id', payload.new.sender_id).single()
        const fullMessage = { ...payload.new, profiles: senderProfile }
        appendMessage(fullMessage)
        
        // Remove empty state if present
        const empty = messagesContainer.querySelector('.empty-state')
        if (empty) empty.remove()
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to real-time chat!')
        }
        if (err) {
          console.error('Real-time subscription error:', err)
        }
      })
  }

  // Sending a message
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = chatInput.value.trim()
    if (!text) return

    chatInput.disabled = true
    sendBtn.disabled = true
    try {
      await createMessage(text, currentUser.id)
      chatInput.value = ''
    } catch (err) {
      console.error("Chat Error:", err)
      showToast(`Failed: ${err.message || 'Unknown error'}`, 'error')
    } finally {
      chatInput.disabled = false
      sendBtn.disabled = false
      chatInput.focus()
    }
  })
}
