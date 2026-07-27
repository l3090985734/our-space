import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Share2, Loader2, Map as MapIcon, RefreshCw } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location, Identity } from '../../types'
import { formatTimeAgo } from '../../lib/utils'
import { useToast } from '../ui/Toast'

interface LocationMapProps {
  myLocation: Location | null
  otherLocation: Location | null
  currentIdentity: Identity | null
  onShareLocation: () => Promise<boolean>
  sharing: boolean
  loading: boolean
  onRefresh: () => void
}

function createCustomMarker(color: string, isHe: boolean) {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        ${isHe ? '他' : '她'}
      </div>
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid white;
      "></div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
  })
}

export function LocationMap({
  myLocation,
  otherLocation,
  currentIdentity,
  onShareLocation,
  sharing,
  loading,
  onRefresh,
}: LocationMapProps) {
  const { showToast } = useToast()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const heMarkerRef = useRef<L.Marker | null>(null)
  const sheMarkerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [tileLoadError, setTileLoadError] = useState(false)

  const heLocation = currentIdentity === 'he' ? myLocation : otherLocation
  const sheLocation = currentIdentity === 'she' ? myLocation : otherLocation

  const heMarker = createCustomMarker('#3B82F6', true)
  const sheMarker = createCustomMarker('#F472B6', false)

  const getCenter = (): [number, number] => {
    const points: [number, number][] = []
    if (heLocation) points.push([heLocation.latitude, heLocation.longitude])
    if (sheLocation) points.push([sheLocation.latitude, sheLocation.longitude])

    if (points.length === 0) return [35.8617, 104.1954]
    if (points.length === 1) return points[0]

    return [
      (points[0][0] + points[1][0]) / 2,
      (points[0][1] + points[1][1]) / 2,
    ]
  }

  const polylinePositions: [number, number][] = []
  if (heLocation) polylinePositions.push([heLocation.latitude, heLocation.longitude])
  if (sheLocation) polylinePositions.push([sheLocation.latitude, sheLocation.longitude])

  const calculateDistance = () => {
    if (!heLocation || !sheLocation) return null

    const R = 6371
    const dLat = (sheLocation.latitude - heLocation.latitude) * Math.PI / 180
    const dLon = (sheLocation.longitude - heLocation.longitude) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(heLocation.latitude * Math.PI / 180) *
        Math.cos(sheLocation.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)} 米`
    }
    return `${distance.toFixed(1)} 公里`
  }

  const handleShare = async () => {
    const success = await onShareLocation()
    if (success) {
      showToast('位置共享成功', 'success')
    } else {
      showToast('位置共享失败，请检查定位权限', 'error')
    }
  }

  const distance = calculateDistance()
  const hasLocations = polylinePositions.length > 0

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || loading || !hasLocations) return

    const map = L.map(mapContainerRef.current, {
      center: getCenter(),
      zoom: polylinePositions.length > 1 ? 5 : 11,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2000,
      inertiaMaxSpeed: Infinity,
      easeLinearity: 0.35,
      worldCopyJump: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 100,
      zoomAnimationThreshold: 8,
    })

    const tileLayer = L.tileLayer(
      'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      {
        subdomains: ['1', '2', '3', '4'],
        maxZoom: 18,
        keepBuffer: 6,
        updateWhenIdle: false,
        updateWhenZooming: true,
      }
    )

    let errorCount = 0
    tileLayer.on('tileerror', () => {
      errorCount++
      if (errorCount > 5) {
        setTileLoadError(true)
      }
    })

    tileLayer.on('load', () => {
      setTileLoadError(false)
    })

    tileLayer.addTo(map)

    mapRef.current = map
    setMapReady(true)

    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [loading, hasLocations])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    const map = mapRef.current

    if (heLocation) {
      if (heMarkerRef.current) {
        heMarkerRef.current.setLatLng([heLocation.latitude, heLocation.longitude])
      } else {
        heMarkerRef.current = L.marker([heLocation.latitude, heLocation.longitude], {
          icon: heMarker,
        }).addTo(map)
        heMarkerRef.current.bindPopup(
          `<div style="text-align:center;padding:4px 8px">
            <div style="display:inline-block;padding:2px 10px;background:#DBEAFE;color:#1D4ED8;border-radius:9999px;font-size:12px;font-weight:600;margin-bottom:4px">${currentIdentity === 'he' ? '我在这里' : '他'}</div>
            <div style="font-size:11px;color:#9CA3AF">${formatTimeAgo(heLocation.updated_at)}</div>
          </div>`
        )
      }
    } else if (heMarkerRef.current) {
      heMarkerRef.current.remove()
      heMarkerRef.current = null
    }

    if (sheLocation) {
      if (sheMarkerRef.current) {
        sheMarkerRef.current.setLatLng([sheLocation.latitude, sheLocation.longitude])
      } else {
        sheMarkerRef.current = L.marker([sheLocation.latitude, sheLocation.longitude], {
          icon: sheMarker,
        }).addTo(map)
        sheMarkerRef.current.bindPopup(
          `<div style="text-align:center;padding:4px 8px">
            <div style="display:inline-block;padding:2px 10px;background:#FCE7F3;color:#BE185D;border-radius:9999px;font-size:12px;font-weight:600;margin-bottom:4px">${currentIdentity === 'she' ? '我在这里' : '她'}</div>
            <div style="font-size:11px;color:#9CA3AF">${formatTimeAgo(sheLocation.updated_at)}</div>
          </div>`
        )
      }
    } else if (sheMarkerRef.current) {
      sheMarkerRef.current.remove()
      sheMarkerRef.current = null
    }

    if (polylinePositions.length > 1) {
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(polylinePositions)
      } else {
        polylineRef.current = L.polyline(polylinePositions, {
          color: '#F472B6',
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 8',
        }).addTo(map)
      }
    } else if (polylineRef.current) {
      polylineRef.current.remove()
      polylineRef.current = null
    }

    if (hasLocations) {
      const center = getCenter()
      const zoom = polylinePositions.length > 1 ? 5 : 11
      map.setView(center, zoom, { animate: true })
    }
  }, [heLocation, sheLocation, mapReady])

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sakura to-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700">我们的位置</h2>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {distance && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-2 px-4 bg-gradient-to-r from-sakura-light/50 to-blue-100/50 rounded-xl"
          >
            <p className="text-sm text-gray-500 mb-0.5">我们相距</p>
            <p className="text-xl font-bold bg-gradient-to-r from-sakura-deep to-blue-500 bg-clip-text text-transparent">
              {distance}
            </p>
          </motion.div>
        )}
      </div>

      <div className="relative h-64 bg-gray-100">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sakura-light/20 to-blue-100/20 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-sakura animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">加载地图中...</p>
            </div>
          </div>
        ) : !hasLocations ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sakura-light/10 to-blue-100/10">
            <div className="text-center px-6">
              <MapIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400 mb-3">还没有位置信息</p>
              <p className="text-xs text-gray-400">点击下方按钮共享你的位置吧</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={mapContainerRef} className="w-full h-full" />
            {tileLoadError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
                <div className="text-center px-6">
                  <MapIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">地图加载较慢</p>
                  <p className="text-xs text-gray-400">点击标记可查看位置信息</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {heLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">他</span>
              </div>
            )}
            {sheLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-400" />
                <span className="text-xs text-gray-500">她</span>
              </div>
            )}
          </div>
          {otherLocation && (
            <span className="text-xs text-gray-400">
              更新于 {formatTimeAgo(otherLocation.updated_at)}
            </span>
          )}
        </div>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full py-3 bg-gradient-to-r from-sakura to-blue-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-70"
        >
          {sharing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              获取位置中...
            </>
          ) : (
            <>
              <Share2 className="w-5 h-5" />
              共享我的位置
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 text-center mt-2">
          点击主动共享，不会自动追踪，保护你的隐私 🔒
        </p>
      </div>
    </div>
  )
}
