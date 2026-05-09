import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import api from '../../services/api'
import Spinner from '../shared/Spinner'

interface Store {
  name: string; address: string; city: string
  lat: number; lon: number; distance_m: number; opening_hours: string
}

function makeStoreIcon(emoji: string) {
  return L.divIcon({
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6))">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

const STORE_EMOJI: Record<string, string> = {
  lidl: '🟡', aldi: '🔵', leclerc: '🔴', carrefour: '🔵', intermarché: '🟠',
  monoprix: '🟣', franprix: '🟠', super: '🏪', market: '🏪',
}

function getStoreEmoji(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(STORE_EMOJI)) {
    if (lower.includes(key)) return emoji
  }
  return '🏪'
}

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export default function StoreMap() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['nearby-stores', coords],
    queryFn: () => api.get('/api/v1/prices/nearby-stores', {
      params: { lat: coords!.lat, lon: coords!.lon, radius: 3000 },
    }).then(r => r.data),
    enabled: !!coords,
  })

  const locate = () => {
    setLocating(true)
    setGeoError(false)
    navigator.geolocation.getCurrentPosition(
      pos => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocating(false) },
      () => { setLocating(false); setGeoError(true) }
    )
  }

  const stores: Store[] = data?.stores ?? []

  if (!coords) return (
    <div style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>🗺️</p>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 6 }}>Trouve les supermarchés les moins chers autour de toi</p>
      {geoError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 10 }}>Géolocalisation refusée. Vérifie les permissions du navigateur.</p>}
      <button onClick={locate} disabled={locating}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 14, background: locating ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: locating ? 'wait' : 'pointer', opacity: locating ? 0.7 : 1 }}>
        {locating ? <Spinner size={16} /> : '📍'}
        {locating ? 'Localisation...' : 'Me géolocaliser'}
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Map */}
      <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', height: 300, position: 'relative' }}>
        <MapContainer
          center={[coords.lat, coords.lon]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={19}
          />
          <InvalidateSize />
          <CircleMarker
            center={[coords.lat, coords.lon]}
            radius={10}
            pathOptions={{ color: '#6366f1', fillColor: '#818cf8', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <span style={{ fontSize: 13, fontWeight: 700 }}>📍 Vous êtes ici</span>
            </Popup>
          </CircleMarker>
          {stores.map((store, i) => (
            <Marker key={i} position={[store.lat, store.lon]} icon={makeStoreIcon(getStoreEmoji(store.name))}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{store.name}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{store.address}</p>
                  <p style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>
                    {store.distance_m < 1000 ? `${store.distance_m} m` : `${(store.distance_m / 1000).toFixed(1)} km`}
                  </p>
                  {store.opening_hours && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>🕐 {store.opening_hours.slice(0, 50)}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <Spinner />
        </div>
      )}

      {stores.length > 0 && (
        <>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '10px 14px' }}>
            <p style={{ fontSize: 12, color: '#64748b' }}>{stores.length} commerce{stores.length > 1 ? 's' : ''} dans un rayon de 3 km</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stores.map((store, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {getStoreEmoji(store.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{store.name}</p>
                  <p style={{ fontSize: 11, color: '#475569' }}>{store.address} {store.city}</p>
                  {store.opening_hours && <p style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>🕐 {store.opening_hours.slice(0, 40)}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#818cf8' }}>
                    {store.distance_m < 1000 ? `${store.distance_m} m` : `${(store.distance_m / 1000).toFixed(1)} km`}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setCoords(null)}
            style={{ padding: '10px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: 12, cursor: 'pointer', width: '100%' }}>
            Changer de position
          </button>
        </>
      )}

      {!isLoading && coords && stores.length === 0 && data && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: 13 }}>
          Aucun commerce trouvé dans un rayon de 3 km.
        </div>
      )}
    </div>
  )
}
