import { signIn } from '../auth.js'
import { showToast } from '../app.js'

export function renderLogin(app) {
  app.innerHTML = `
    <div class="split-layout">
      <div class="split-visual">
        <div class="visual-bg-mesh"></div>
        <div class="visual-content">
          <h1 class="visual-title">Innovexa Hub</h1>
          <p class="visual-subtitle">Enter a vibrant tech community dedicated to futuristic innovation, dynamic learning, and seamless collaboration.</p>
        </div>
      </div>
      <div class="split-form">
        <div class="form-wrapper">
          <div class="logo-area">
            <img src="./assets/logo.png" alt="Innovexa Hub">
            <h2>Welcome Back</h2>
            <p>Sign in to your member account to continue</p>
          </div>

          <form id="login-form">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="login-email" placeholder="hello@innovexa.com" required>
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%; margin-top: 8px;">Sign In to Portal</button>
          </form>
        </div>
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
