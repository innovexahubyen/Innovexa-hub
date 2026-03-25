import { signIn } from '../auth.js'
import { showToast } from '../app.js'

export function renderLogin(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="logo-area">
          <img src="./assets/logo.png" alt="Innovexa Hub">
          <h2>Innovexa Hub</h2>
          <p>Sign in to your member account</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" placeholder="your@email.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%">Sign In</button>
        </form>
      </div>
    </div>
  `

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.target.querySelector('button[type="submit"]')
    btn.textContent = 'Signing in...'
    btn.disabled = true
    try {
      await signIn(
        document.getElementById('login-email').value,
        document.getElementById('login-password').value
      )
      showToast('Welcome back!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
      btn.textContent = 'Sign In'
      btn.disabled = false
    }
  })
}
