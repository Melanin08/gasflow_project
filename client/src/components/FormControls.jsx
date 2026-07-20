import { MapPin, Store } from "lucide-react";
import paymentQrImage from "../../assets/payment-my-qr.jpeg";
import {
  createTrackingMapView,
  deliveryEtaEstimate,
  distanceText,
  fullTanzaniaPhone,
  localTanzaniaPhone,
} from "../utils/gasflowLogic.js";

export function TanzaniaPhoneInput({ value, onChange }) {
  return (
    <span className="phone-input">
      <span>+255</span>
      <input
        value={localTanzaniaPhone(value)}
        onChange={(event) => onChange(fullTanzaniaPhone(event.target.value))}
        placeholder="777305695"
        inputMode="numeric"
        pattern="[67][0-9]{8}"
        title="Enter a valid Tanzania mobile number, for example 777305695"
        maxLength={9}
      />
    </span>
  );
}

export function PaymentQrCard({ method }) {
  return (
    <div className="payment-qr-card">
      <img src={paymentQrImage} alt={`${method.name} payment QR for ${method.qrName}`} />
    </div>
  );
}

export function RoutePreviewMap({ store, destination, quantity }) {
  const mapView = createTrackingMapView(store, destination, store);
  const eta = deliveryEtaEstimate(store, destination, quantity);

  return (
    <div className="preview-route-map">
      <div className="map-tile-grid" aria-hidden="true">
        {mapView.tiles.map((tile) => (
          <img
            className="map-tile"
            key={tile.key}
            src={tile.url}
            style={tile.style}
            alt=""
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        ))}
      </div>
      <svg className="route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path className="route-shadow" d={mapView.remainingPath} />
        <path className="route-completed" d={mapView.remainingPath} />
      </svg>
      <span className="map-pin store-pin" style={mapView.storePoint}><Store size={15} /></span>
      <span className="map-pin customer-pin" style={mapView.destinationPoint}><MapPin size={15} /></span>
      <div className="preview-map-facts">
        <strong>{distanceText(eta.roadKm)}</strong>
        <span>road estimate</span>
      </div>
    </div>
  );
}
