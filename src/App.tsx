import { PhotoMetadataApp } from './components/PhotoMetadataApp'
import { Analytics } from '@vercel/analytics/react'

function App() {
  return (
    <>
      <PhotoMetadataApp />
      <Analytics />
    </>
  )
}

export default App
