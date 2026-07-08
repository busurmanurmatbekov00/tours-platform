import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useT } from '../hooks/useT';

// фикс иконки маркера (известная проблема leaflet + бандлеры)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TourMap({ routePoints }) {
  const { lang } = useT();

  if (!routePoints || routePoints.length === 0) return null;

  const sorted = [...routePoints].sort((a, b) => a.sequence_order - b.sequence_order);
  const positions = sorted.map((p) => [parseFloat(p.location.latitude), parseFloat(p.location.longitude)]);
  const center = positions[Math.floor(positions.length / 2)];

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '400px' }}>
      <MapContainer center={center} zoom={9} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#2563eb" />
        {sorted.map((point) => (
          <Marker
            key={point.id}
            position={[parseFloat(point.location.latitude), parseFloat(point.location.longitude)]}
          >
            <Popup>
              <strong>{point.location.name[lang]}</strong>
              {point.day_number && <div>День {point.day_number}</div>}
              {point.notes?.[lang] && <div>{point.notes[lang]}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}