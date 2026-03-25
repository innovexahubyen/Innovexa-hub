import { getNavbar, getFooter, attachNavEvents, formatDate } from '../app.js'
import { getPosts } from '../db.js'

export async function renderPosts(app) {
  let posts = []
  try { posts = await getPosts() } catch(e) { console.error(e) }

  app.innerHTML = `
    ${getNavbar('posts')}

    <section class="section">
      <div class="container">
        <div class="section-header">
          <h2>Blog & Posts</h2>
          <p>Insights, tutorials, and stories from our community</p>
          <div class="accent-line"></div>
        </div>
        <div class="grid grid-2" id="posts-list">
          ${posts.length === 0 ? '<div class="empty-state"><h3>No posts yet</h3><p>Community posts will show up here.</p></div>' :
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
      </div>
    </section>

    ${getFooter()}
  `
  attachNavEvents()
}
