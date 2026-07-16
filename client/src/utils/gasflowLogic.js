import { paymentMethods, promoCodes, riders, stores, zanzibarPlaces, zones, zonePins } from "../data/gasflowData.js";

export const zanzibarBounds = {
  south: -6.55,
  west: 39.05,
  north: -5.65,
  east: 39.75
};

export function money(value) {
  return `TZS ${value.toLocaleString("en-US")}`;
}

export function gasLabel(item, language) {
  return language === "sw" ? item.swLabel : item.label;
}

export function paymentDisplay(method, t) {
  const labels = {
    mpesa: { accountLabel: t.businessTill, providerLabel: t.mpesaCallback },
    airtel: { accountLabel: t.merchantNumber, providerLabel: t.airtelCallback },
    halopesa: { accountLabel: t.merchantNumber, providerLabel: t.halotelCallback },
    card: { accountLabel: t.secureCheckout, providerLabel: t.cardCallback },
    cash: {
      name: t.cashOnDelivery,
      accountLabel: t.collection,
      accountValue: t.riderCollectsCash,
      providerLabel: t.cashReceipt,
      instruction: t.cashReservedInstruction
    }
  };
  const translated = labels[method.id] || {};
  return {
    ...method,
    ...translated,
    accountValue: translated.accountValue || t.scanMyQrToPay,
    instruction: translated.instruction || t.scanMyQrInstruction
  };
}

export function promoDiscount(subtotal, promoCode) {
  const promo = promoCodes[promoCode.trim().toUpperCase()];
  if (!promo) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  return Math.min(subtotal, promo.value);
}

export function loyaltyPointsFor(total) {
  return Math.max(1, Math.floor(total / 1000));
}

export function localTanzaniaPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("255")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export function fullTanzaniaPhone(value) {
  const local = localTanzaniaPhone(value);
  return local ? `+255 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`.trim() : "";
}

export function normalizeSearch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function placeToLocation(place) {
  return {
    lat: place.lat,
    lng: place.lng,
    label: place.name,
    zone: place.zone,
    source: place.source || "local-estimate"
  };
}

export function isZanzibarLocation(location) {
  return Boolean(location)
    && location.lat >= zanzibarBounds.south
    && location.lat <= zanzibarBounds.north
    && location.lng >= zanzibarBounds.west
    && location.lng <= zanzibarBounds.east;
}

export function placeFromMapResult(result) {
  const address = result.address || {};
  const name = result.name || address.road || address.neighbourhood || address.suburb || result.display_name.split(",")[0];
  const areaParts = [
    address.neighbourhood || address.suburb || address.village || address.town || address.city,
    address.state || address.region,
    "Tanzania"
  ].filter(Boolean);

  return {
    id: result.place_id || result.osm_id || result.display_name,
    name,
    area: areaParts.join(", "),
    zone: zones.includes(address.suburb) ? address.suburb : "",
    lat: Number(result.lat),
    lng: Number(result.lon),
    source: "geocoded",
    displayName: result.display_name
  };
}

function zanzibarSearchParams(query, limit = "7") {
  return new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    limit,
    countrycodes: "tz",
    viewbox: `${zanzibarBounds.west},${zanzibarBounds.north},${zanzibarBounds.east},${zanzibarBounds.south}`,
    bounded: "1",
    q: `${query}, Zanzibar, Tanzania`
  });
}

export async function searchTanzaniaPlaces(query, signal) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) return [];

  const params = zanzibarSearchParams(trimmedQuery);
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
    signal
  });

  if (!response.ok) {
    throw new Error("Map search failed");
  }

  return (await response.json())
    .map(placeFromMapResult)
    .filter(isZanzibarLocation);
}

export function getLocalPlaceSuggestions(value) {
  const query = normalizeSearch(value);
  if (query.length < 3) return [];

  return zanzibarPlaces
    .map((place) => {
      const searchable = normalizeSearch([place.name, place.area, place.zone, ...(place.aliases || [])].join(" "));
      const exactStart = normalizeSearch(place.name).startsWith(query) || (place.aliases || []).some((alias) => normalizeSearch(alias).startsWith(query));
      const contains = searchable.includes(query);
      return { ...place, score: exactStart ? 0 : contains ? 1 : 2 };
    })
    .filter((place) => place.score < 2)
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
    .slice(0, 5);
}

export function findLocalPlace(value) {
  const query = normalizeSearch(value);
  if (query.length < 3) return null;
  return getLocalPlaceSuggestions(value).find((place) => {
    const names = [place.name, place.area, ...(place.aliases || [])].map(normalizeSearch);
    return names.some((name) => name === query || name.startsWith(query));
  }) || null;
}

export function zonePin(zone) {
  return zonePins[zone] || zonePins["Stone Town"];
}

export function orderDestination(order) {
  const zone = zonePin(order.zone);
  const savedLocation = {
    lat: typeof order.deliveryLat === "number" ? order.deliveryLat : zone.lat,
    lng: typeof order.deliveryLng === "number" ? order.deliveryLng : zone.lng
  };
  const location = isZanzibarLocation(savedLocation) ? savedLocation : zone;
  return {
    lat: location.lat,
    lng: location.lng,
    label: order.address
  };
}

export function distanceKm(from, to) {
  const earthRadiusKm = 6371;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function roadDistanceKm(from, to) {
  return distanceKm(from, to) * 1.45;
}

export function deliveryEtaEstimate(from, to, quantity = 1) {
  const roadKm = roadDistanceKm(from, to);
  const prepMinutes = 8 + Math.max(0, quantity - 1) * 2;
  const fastTrafficKmh = 22;
  const slowTrafficKmh = 13;
  const fastMinutes = (roadKm / fastTrafficKmh) * 60 + prepMinutes;
  const slowMinutes = (roadKm / slowTrafficKmh) * 60 + prepMinutes + 5;
  const min = Math.max(10, Math.ceil(fastMinutes));
  const max = Math.max(min + 4, Math.ceil(slowMinutes));
  return { min, max, roadKm };
}

export function deliveryMinutesEstimate(from, to, quantity = 1) {
  return deliveryEtaEstimate(from, to, quantity).max;
}

export function etaRangeText(from, to, quantity = 1) {
  const eta = deliveryEtaEstimate(from, to, quantity);
  return `${eta.min}-${eta.max} min`;
}

export function distanceText(kilometers) {
  if (kilometers < 1) return `${Math.round(kilometers * 1000)} m`;
  return `${kilometers.toFixed(1)} km`;
}

export async function geocodeDeliveryAddress(address, zone) {
  const query = zone ? `${address}, ${zone}` : address;
  const params = zanzibarSearchParams(query, "1");
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Map search failed");
  }

  const results = await response.json();
  const match = results[0];

  if (!match) return null;

  const place = placeFromMapResult(match);
  return isZanzibarLocation(place) ? placeToLocation(place) : null;
}

export async function resolveDeliveryLocation(address, zone, currentLocation) {
  if (currentLocation && currentLocation.source !== "local-estimate") return currentLocation;

  try {
    const geocoded = await geocodeDeliveryAddress(address, zone);
    if (geocoded) return geocoded;
  } catch {
    if (!currentLocation) throw new Error("Map search failed");
  }

  return null;
}

export function remainingEtaSeconds(order, currentLocation, destination, nowMs) {
  if (order.status === "Delivered") return 0;
  if (order.createdAtMs && order.initialEtaMinutes) {
    const elapsedSeconds = Math.floor((nowMs - order.createdAtMs) / 1000);
    return Math.max(0, order.initialEtaMinutes * 60 - elapsedSeconds);
  }
  return Math.max(30, Math.ceil(deliveryMinutesEstimate(currentLocation, destination, order.quantity || 1) * 60));
}

export function etaText(seconds) {
  if (seconds <= 0) return "Arriving";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function latLngToWorld(location, zoom) {
  const scale = 256 * 2 ** zoom;
  const sinLat = Math.sin((location.lat * Math.PI) / 180);
  return {
    x: ((location.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

export function mapZoomForDistance(distance) {
  if (distance > 18) return 11;
  if (distance > 7) return 12;
  if (distance > 2.5) return 13;
  return 14;
}

export function createTrackingMapView(store, destination, riderPosition, routeLocations = []) {
  const points = [store, destination, ...(riderPosition ? [riderPosition] : []), ...routeLocations];
  const maxDistance = Math.max(...points.map((point) => distanceKm(store, point)), distanceKm(store, destination));
  const zoom = mapZoomForDistance(maxDistance);
  const projectedPoints = points.map((point) => latLngToWorld(point, zoom));
  const padding = 180;
  let minX = Math.min(...projectedPoints.map((point) => point.x)) - padding;
  let maxX = Math.max(...projectedPoints.map((point) => point.x)) + padding;
  let minY = Math.min(...projectedPoints.map((point) => point.y)) - padding;
  let maxY = Math.max(...projectedPoints.map((point) => point.y)) + padding;
  const targetAspect = 1.62;
  const width = maxX - minX;
  const height = maxY - minY;

  if (width / height > targetAspect) {
    const targetHeight = width / targetAspect;
    const extra = (targetHeight - height) / 2;
    minY -= extra;
    maxY += extra;
  } else {
    const targetWidth = height * targetAspect;
    const extra = (targetWidth - width) / 2;
    minX -= extra;
    maxX += extra;
  }

  function point(location) {
    const world = latLngToWorld(location, zoom);
    const x = ((world.x - minX) / (maxX - minX)) * 100;
    const y = ((world.y - minY) / (maxY - minY)) * 100;
    return { left: `${x}%`, top: `${y}%`, x, y };
  }

  const tileMinX = Math.floor(minX / 256);
  const tileMaxX = Math.floor(maxX / 256);
  const tileMinY = Math.floor(minY / 256);
  const tileMaxY = Math.floor(maxY / 256);
  const tiles = [];
  const tilesPerAxis = 2 ** zoom;

  for (let x = tileMinX; x <= tileMaxX; x += 1) {
    for (let y = tileMinY; y <= tileMaxY; y += 1) {
      if (y < 0 || y >= tilesPerAxis) continue;
      const wrappedX = ((x % tilesPerAxis) + tilesPerAxis) % tilesPerAxis;
      tiles.push({
        key: `${zoom}-${x}-${y}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        style: {
          left: `${((x * 256 - minX) / (maxX - minX)) * 100}%`,
          top: `${((y * 256 - minY) / (maxY - minY)) * 100}%`,
          width: `${(256 / (maxX - minX)) * 100}%`,
          height: `${(256 / (maxY - minY)) * 100}%`
        }
      });
    }
  }

  const storePoint = point(store);
  const riderPoint = riderPosition ? point(riderPosition) : null;
  const destinationPoint = point(destination);
  const routePath = (from, to) => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const bend = Math.max(4, Math.min(12, Math.abs(from.x - to.x) * 0.2));
    const controlA = { x: midX - bend, y: from.y + (midY - from.y) * 0.75 };
    const controlB = { x: midX + bend, y: to.y - (to.y - midY) * 0.75 };
    return `M ${from.x} ${from.y} C ${controlA.x} ${controlA.y}, ${controlB.x} ${controlB.y}, ${to.x} ${to.y}`;
  };

  return {
    tiles,
    storePoint,
    riderPoint,
    destinationPoint,
    completedPath: riderPoint ? routePath(storePoint, riderPoint) : "",
    remainingPath: routeLocations.length > 1
      ? routeLocations.map((location, index) => {
        const routePoint = point(location);
        return `${index === 0 ? "M" : "L"} ${routePoint.x} ${routePoint.y}`;
      }).join(" ")
      : routePath(riderPoint || storePoint, destinationPoint)
  };
}

export function getStoreScore(store, destination, cylinder, quantity) {
  const stockPenalty = (store.stock[cylinder] || 0) < quantity ? 1000 : 0;
  const riderPenalty = store.riders < 1 ? 400 : 0;
  return distanceKm(store, destination) + stockPenalty + riderPenalty;
}

export function recommendStore(destination, cylinder, quantity) {
  return [...stores]
    .filter((store) => store.open)
    .sort((a, b) => getStoreScore(a, destination, cylinder, quantity) - getStoreScore(b, destination, cylinder, quantity))[0];
}

export function pickRider(storeId) {
  return riders.find((rider) => rider.storeId === storeId) || riders[0];
}

export function getPaymentMethod(paymentId) {
  return paymentMethods.find((method) => method.id === paymentId) || paymentMethods[0];
}

export function providerConfirmationReference(methodId) {
  const prefix = {
    mpesa: "MPESA",
    airtel: "AIRTEL",
    halopesa: "HALOTEL",
    card: "CARD"
  }[methodId] || "PAY";
  return `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
}

export function routeApiUrl(from, to) {
  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=true&steps=false`;
}

export function routeCoordinatesToLocations(route) {
  return route?.geometry?.coordinates?.map(([lng, lat]) => ({ lat, lng })) || [];
}

export function isZanzibarRoadRoute(locations, from, to) {
  if (!isZanzibarLocation(from) || !isZanzibarLocation(to) || locations.length < 2) return false;
  if (!locations.every(isZanzibarLocation)) return false;
  const routeDistance = locations.reduce((total, location, index) => {
    if (index === 0) return total;
    return total + distanceKm(locations[index - 1], location);
  }, 0);
  const directDistance = distanceKm(from, to);
  return routeDistance <= Math.max(2.5, directDistance * 4 + 2);
}
