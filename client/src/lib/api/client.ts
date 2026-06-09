import axios from 'axios'

// withCredentials ensures the httpOnly auth cookies travel with every request.
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let queue: Array<() => void> = []

function flushQueue() {
  queue.forEach((cb) => cb())
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url: string = original?.url || ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push(() => client(original).then(resolve).catch(reject))
        })
      }

      isRefreshing = true
      try {
        // Refresh rotates the cookies server-side; nothing is read in JS.
        await axios.post('/api/auth/refresh', undefined, { withCredentials: true })
        flushQueue()
        return client(original)
      } catch (e) {
        queue = []
        // Помечаем причину, чтобы middleware не вернул обратно на дашборд (анти-петля)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?session=expired'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default client
