import { geocodeAddress } from './nominatim'

export async function getDistanceKmByCoords(origin: { lon: number; lat: number }, dest: { lon: number; lat: number }): Promise<number | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${dest.lon},${dest.lat}?overview=false`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  const meters = data?.routes?.[0]?.distance
  if (typeof meters !== 'number') return null
  return meters / 1000
}

export async function getDistanceKmByAddresses(origin: string, dest: string): Promise<{ km: number | null; origin?: { lat: number; lon: number }; dest?: { lat: number; lon: number } }> {
  const o = await geocodeAddress(origin)
  const d = await geocodeAddress(dest)
  if (!o || !d) return { km: null }
  const km = await getDistanceKmByCoords({ lon: o.lon, lat: o.lat }, { lon: d.lon, lat: d.lat })
  return { km, origin: { lat: o.lat, lon: o.lon }, dest: { lat: d.lat, lon: d.lon } }
}