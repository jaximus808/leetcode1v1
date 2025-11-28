export default function NotFoundPage() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 56px)', padding: 16 }}>
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, maxWidth: 520 }}>
        <h1 style={{ marginTop: 0 }}>404 - Not Found</h1>
        <p style={{ color: '#b3b3b3' }}>The page you’re looking for doesn’t exist.</p>
        <a href="/" style={{ color: '#eab308' }}>Go back home</a>
      </div>
    </div>
  )
}


