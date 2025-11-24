export type GeocodeResult = { lat: number; lon: number; display_name: string }

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  const item = data[0]
  return { lat: Number(item.lat), lon: Number(item.lon), display_name: item.display_name }
}