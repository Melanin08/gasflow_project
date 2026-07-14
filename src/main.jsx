import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Clock3,
  Flame,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  RefreshCcw,
  Route,
  Send,
  ShieldCheck,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import "./styles.css";

const cylinderTypes = [
  { id: "6kg", label: "6kg refill", price: 18000 },
  { id: "15kg", label: "15kg refill", price: 42000 },
  { id: "38kg", label: "38kg refill", price: 115000 },
  { id: "starter", label: "New setup kit", price: 76000 }
];

const stores = [
  { id: "st-01", name: "Stone Town Store", zone: "Stone Town", lat: -6.1629, lng: 39.1926, stock: { "6kg": 19, "15kg": 16, "38kg": 5, starter: 7 }, riders: 4, open: true },
  { id: "st-02", name: "Fuoni Store", zone: "Fuoni", lat: -6.183, lng: 39.25, stock: { "6kg": 28, "15kg": 24, "38kg": 7, starter: 5 }, riders: 3, open: true },
  { id: "st-03", name: "Bububu Store", zone: "Bububu", lat: -6.1003, lng: 39.2172, stock: { "6kg": 20, "15kg": 18, "38kg": 6, starter: 3 }, riders: 3, open: true },
  { id: "st-04", name: "Mwanakwerekwe Store", zone: "Mwanakwerekwe", lat: -6.1759, lng: 39.2288, stock: { "6kg": 14, "15kg": 21, "38kg": 4, starter: 6 }, riders: 2, open: true },
  { id: "st-05", name: "Mombasa Store", zone: "Mombasa", lat: -6.176, lng: 39.246, stock: { "6kg": 17, "15kg": 13, "38kg": 4, starter: 4 }, riders: 2, open: true },
  { id: "st-06", name: "Kisauni Store", zone: "Kisauni", lat: -6.1378, lng: 39.2207, stock: { "6kg": 22, "15kg": 15, "38kg": 3, starter: 4 }, riders: 2, open: true },
  { id: "st-07", name: "Kiembe Samaki Store", zone: "Kiembe Samaki", lat: -6.2234, lng: 39.2212, stock: { "6kg": 11, "15kg": 10, "38kg": 3, starter: 2 }, riders: 1, open: true },
  { id: "st-08", name: "Jang'ombe Store", zone: "Jang'ombe", lat: -6.1752, lng: 39.2145, stock: { "6kg": 15, "15kg": 12, "38kg": 5, starter: 5 }, riders: 2, open: true },
  { id: "st-09", name: "Chukwani Store", zone: "Chukwani", lat: -6.227, lng: 39.2244, stock: { "6kg": 9, "15kg": 8, "38kg": 2, starter: 2 }, riders: 1, open: true }
];

const riders = [
  { id: "rd-01", name: "Asha Khamis", phone: "+255 714 112 233", vehicle: "Bajaj ZNZ 1423", storeId: "st-01" },
  { id: "rd-02", name: "Salum Juma", phone: "+255 765 998 877", vehicle: "Bike ZNZ 9921", storeId: "st-02" },
  { id: "rd-03", name: "Mwanaisha Ali", phone: "+255 688 445 566", vehicle: "Bike ZNZ 7720", storeId: "st-03" },
  { id: "rd-04", name: "Khamis Omar", phone: "+255 712 334 455", vehicle: "Bajaj ZNZ 5534", storeId: "st-04" },
  { id: "rd-05", name: "Yusuf Said", phone: "+255 742 201 404", vehicle: "Bike ZNZ 6201", storeId: "st-05" }
];

const zones = ["Stone Town", "Fuoni", "Bububu", "Mwanakwerekwe", "Mombasa", "Kisauni", "Kiembe Samaki", "Jang'ombe", "Chukwani"];
const zonePins = {
  "Stone Town": { lat: -6.1622, lng: 39.1921 },
  Fuoni: { lat: -6.183, lng: 39.25 },
  Bububu: { lat: -6.1004, lng: 39.217 },
  Mwanakwerekwe: { lat: -6.1758, lng: 39.229 },
  Mombasa: { lat: -6.176, lng: 39.246 },
  Kisauni: { lat: -6.1378, lng: 39.2207 },
  "Kiembe Samaki": { lat: -6.2234, lng: 39.2212 },
  "Jang'ombe": { lat: -6.1752, lng: 39.2145 },
  Chukwani: { lat: -6.227, lng: 39.2244 }
};
const paymentMethods = [
  {
    id: "mpesa",
    name: "M-Pesa",
    accountLabel: "Business till / Lipa number",
    accountValue: "Set your company till number",
    referenceLabel: "M-Pesa receipt code",
    instruction: "Customer pays from M-Pesa, then staff records the SMS receipt code."
  },
  {
    id: "tigopesa",
    name: "Tigo Pesa",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "Tigo Pesa transaction ID",
    instruction: "Customer pays through Tigo Pesa, then staff records the transaction ID."
  },
  {
    id: "airtel",
    name: "Airtel Money",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "Airtel Money reference",
    instruction: "Customer pays through Airtel Money, then staff records the reference."
  },
  {
    id: "halopesa",
    name: "HaloPesa",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "HaloPesa reference",
    instruction: "Customer pays through HaloPesa, then staff records the reference."
  },
  {
    id: "cash",
    name: "Cash on delivery",
    accountLabel: "Collection",
    accountValue: "Rider collects cash at delivery",
    referenceLabel: "Cash receipt",
    instruction: "Order is reserved now. Rider collects cash and marks payment collected."
  }
];
const deliveryStages = ["New", "Accepted", "Rider assigned", "On the way", "Delivered"];

const initialOrders = [];
const emptyOrderForm = {
  customer: "",
  phone: "",
  zone: "",
  address: "",
  cylinder: "",
  quantity: 1,
  payment: "",
  paymentPhone: "",
  paymentReference: "",
  notes: "",
  deliveryLocation: null
};

function money(value) {
  return `TZS ${value.toLocaleString("en-US")}`;
}

function localTanzaniaPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("255")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

function fullTanzaniaPhone(value) {
  const local = localTanzaniaPhone(value);
  return local ? `+255 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`.trim() : "";
}

function zonePin(zone) {
  return zonePins[zone] || zonePins["Stone Town"];
}

function orderDestination(order) {
  const zone = zonePin(order.zone);
  return {
    lat: typeof order.deliveryLat === "number" ? order.deliveryLat : zone.lat,
    lng: typeof order.deliveryLng === "number" ? order.deliveryLng : zone.lng,
    label: order.address
  };
}

function distanceKm(from, to) {
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

function deliveryMinutesEstimate(from, to) {
  const urbanSpeedKmh = 24;
  const routeBuffer = 1.35;
  const loadAndTrafficBufferMinutes = 4;
  const travelMinutes = ((distanceKm(from, to) * routeBuffer) / urbanSpeedKmh) * 60;
  return Math.max(3, Math.ceil(travelMinutes + loadAndTrafficBufferMinutes));
}

async function geocodeDeliveryAddress(address, zone) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "tz",
    q: `${address}, ${zone}, Zanzibar, Tanzania`
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error("Map search failed");
  }

  const results = await response.json();
  const match = results[0];

  if (!match) return null;

  return {
    lat: Number(match.lat),
    lng: Number(match.lon),
    label: address
  };
}

function deliveryStageProgress(status) {
  const index = Math.max(0, deliveryStages.indexOf(status));
  if (status === "Delivered") return 100;
  return [5, 18, 36, 68, 100][index] || 12;
}

function interpolateLocation(from, to, progress) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * clampedProgress,
    lng: from.lng + (to.lng - from.lng) * clampedProgress
  };
}

function trackedRiderLocation(order, store, destination, riderLocation, nowMs) {
  if (riderLocation) return riderLocation;
  const etaMinutes = order.initialEtaMinutes || deliveryMinutesEstimate(store, destination);
  const startedAtMs = order.createdAtMs || nowMs;
  const elapsedMs = Math.max(0, nowMs - startedAtMs);
  const progress = elapsedMs / (etaMinutes * 60 * 1000);
  return interpolateLocation(store, destination, progress);
}

function remainingEtaSeconds(order, currentLocation, destination, nowMs) {
  if (order.status === "Delivered") return 0;
  if (order.createdAtMs && order.initialEtaMinutes) {
    const elapsedSeconds = Math.floor((nowMs - order.createdAtMs) / 1000);
    return Math.max(0, order.initialEtaMinutes * 60 - elapsedSeconds);
  }
  return Math.max(30, Math.ceil(deliveryMinutesEstimate(currentLocation, destination) * 60));
}

function etaText(seconds) {
  if (seconds <= 0) return "Arriving";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes <= 0) return `${remainingSeconds}s`;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function latLngToWorld(location, zoom) {
  const scale = 256 * 2 ** zoom;
  const sinLat = Math.sin((location.lat * Math.PI) / 180);
  return {
    x: ((location.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale
  };
}

function mapZoomForDistance(distance) {
  if (distance > 18) return 11;
  if (distance > 7) return 12;
  if (distance > 2.5) return 13;
  return 14;
}

function createTrackingMapView(store, destination, riderPosition) {
  const rider = riderPosition || store;
  const points = [store, destination, rider];
  const zoom = mapZoomForDistance(Math.max(distanceKm(store, destination), distanceKm(rider, destination)));
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
  const riderPoint = point(rider);
  const destinationPoint = point(destination);

  return {
    tiles,
    storePoint,
    riderPoint,
    destinationPoint,
    completedPath: [
      storePoint,
      riderPoint
    ].map((item, index) => `${index === 0 ? "M" : "L"} ${item.x} ${item.y}`).join(" "),
    remainingPath: [
      riderPoint,
      destinationPoint
    ].map((item, index) => `${index === 0 ? "M" : "L"} ${item.x} ${item.y}`).join(" ")
  };
}

function TanzaniaPhoneInput({ value, onChange }) {
  return (
    <span className="phone-input">
      <span>+255</span>
      <input
        value={localTanzaniaPhone(value)}
        onChange={(event) => onChange(fullTanzaniaPhone(event.target.value))}
        placeholder="777305695"
        inputMode="numeric"
        maxLength={9}
      />
    </span>
  );
}

function getStoreScore(store, destination, cylinder, quantity) {
  const stockPenalty = store.stock[cylinder] < quantity ? 1000 : 0;
  const riderPenalty = store.riders < 1 ? 400 : 0;
  return distanceKm(store, destination) + stockPenalty + riderPenalty;
}

function recommendStore(destination, cylinder, quantity) {
  return [...stores]
    .filter((store) => store.open)
    .sort((a, b) => getStoreScore(a, destination, cylinder, quantity) - getStoreScore(b, destination, cylinder, quantity))[0];
}

function pickRider(storeId) {
  return riders.find((rider) => rider.storeId === storeId) || riders[0];
}

function getPaymentMethod(paymentId) {
  return paymentMethods.find((method) => method.id === paymentId) || paymentMethods[0];
}

function App() {
  const [view, setView] = useState("dispatch");
  const [orders, setOrders] = useState(initialOrders);
  const [riderLocations, setRiderLocations] = useState({});
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(emptyOrderForm);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const riderWatchers = useRef({});

  const selectedCylinder = cylinderTypes.find((item) => item.id === form.cylinder);
  const selectedPayment = form.payment ? getPaymentMethod(form.payment) : null;
  const hasDeliveryRequest = form.address.trim().length > 0;
  const hasMappedDeliveryPlace = Boolean(form.deliveryLocation);
  const canMatchStore = hasMappedDeliveryPlace && Boolean(form.cylinder);
  const formDestination = useMemo(() => {
    const fallback = form.deliveryLocation;
    if (!fallback) return null;
    return {
      lat: fallback.lat,
      lng: fallback.lng,
      label: fallback.label || form.address
    };
  }, [form.address, form.deliveryLocation, form.zone]);
  const bestStore = useMemo(() => {
    if (!formDestination || !form.cylinder) return null;
    return recommendStore(formDestination, form.cylinder, form.quantity);
  }, [form.cylinder, form.quantity, formDestination]);
  const storeOptions = useMemo(() => {
    if (!formDestination || !form.cylinder) return [];
    return stores
      .map((store) => ({
        ...store,
        distance: distanceKm(store, formDestination),
        canServe: store.stock[form.cylinder] >= form.quantity && store.riders > 0
      }))
      .sort((a, b) => getStoreScore(a, formDestination, form.cylinder, form.quantity) - getStoreScore(b, formDestination, form.cylinder, form.quantity));
  }, [form.cylinder, form.quantity, formDestination]);

  const activeOrders = orders.filter((order) => order.status !== "Delivered");
  const trackingOrder = orders[0];
  const deliveredToday = orders.filter((order) => order.status === "Delivered").length;
  const lowStockStores = stores.filter((store) => Object.values(store.stock).some((value) => value <= 3));
  const revenue = orders.reduce((sum, order) => {
    const item = cylinderTypes.find((type) => type.id === order.cylinder);
    return sum + (item?.price || 0) * order.quantity;
  }, 0);

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(["address", "zone"].includes(key) ? { deliveryLocation: null } : {})
    }));
    setDispatchMessage({ type: "", text: "" });
  }

  function useCustomerCurrentLocation() {
    if (!navigator.geolocation) {
      setDispatchMessage({ type: "error", text: "This browser cannot use current location." });
      return;
    }

    setIsSubmittingOrder(true);
    setDispatchMessage({ type: "info", text: "Waiting for location permission..." });

    navigator.geolocation.getCurrentPosition((position) => {
      setForm((current) => ({
        ...current,
        address: current.address || "My current location",
        deliveryLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: current.address || "My current location"
        }
      }));
      setIsSubmittingOrder(false);
      setDispatchMessage({ type: "success", text: "Current location added. Store match is ready." });
    }, () => {
      setIsSubmittingOrder(false);
      setDispatchMessage({ type: "error", text: "Location permission was denied or unavailable." });
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  }

  async function placeOrder() {
    if (!form.customer.trim()) {
      setDispatchMessage({ type: "error", text: "Enter the customer name before dispatching." });
      return;
    }

    if (localTanzaniaPhone(form.phone).length !== 9) {
      setDispatchMessage({ type: "error", text: "Enter the customer phone number after +255, for example 777305695." });
      return;
    }

    if (!form.address.trim()) {
      setDispatchMessage({ type: "error", text: "Enter the exact delivery address before dispatching." });
      return;
    }

    if (!form.cylinder) {
      setDispatchMessage({ type: "error", text: "Choose the gas type before placing the order." });
      return;
    }

    if (!selectedPayment) {
      setDispatchMessage({ type: "error", text: "Choose the mode of payment before placing the order." });
      return;
    }

    const isCashOrder = selectedPayment.id === "cash";
    const paymentPhone = form.paymentPhone.trim() || form.phone.trim();

    if (!isCashOrder && localTanzaniaPhone(paymentPhone).length !== 9) {
      setDispatchMessage({ type: "error", text: `Enter the phone that paid by ${selectedPayment.name}.` });
      return;
    }

    if (!isCashOrder && form.paymentReference.trim().length < 6) {
      setDispatchMessage({ type: "error", text: `Enter the ${selectedPayment.referenceLabel.toLowerCase()} from the payment message.` });
      return;
    }

    setIsSubmittingOrder(true);
    setDispatchMessage({ type: "info", text: "Finding the delivery place on the map..." });

    let deliveryLocation = form.deliveryLocation;
    try {
      if (!deliveryLocation) {
        deliveryLocation = await geocodeDeliveryAddress(form.address.trim(), form.zone);
      }

      if (!deliveryLocation) {
        setDispatchMessage({
          type: "error",
          text: "I could not find that typed place on the map. Add a clearer landmark, street, shop, or building name."
        });
        return;
      }
    } catch {
      setDispatchMessage({
        type: "error",
        text: "Map search is not available now. Check the internet connection and try again."
      });
      return;
    } finally {
      setIsSubmittingOrder(false);
    }

    const store = recommendStore(deliveryLocation, form.cylinder, form.quantity);
    const rider = pickRider(store.id);
    const createdAtMs = Date.now();
    const initialEtaMinutes = deliveryMinutesEstimate(store, deliveryLocation);
    const order = {
      ...form,
      id: `GF-${Math.floor(9000 + Math.random() * 900)}`,
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      payment: selectedPayment.id,
      paymentStatus: isCashOrder ? "Cash pending" : "Paid",
      paymentReference: isCashOrder ? `COD-${Date.now().toString().slice(-5)}` : form.paymentReference.trim().toUpperCase(),
      paymentPhone: isCashOrder ? "" : fullTanzaniaPhone(paymentPhone),
      status: "Rider assigned",
      storeId: store.id,
      riderId: rider.id,
      createdAtMs,
      initialEtaMinutes,
      createdAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
    };
    order.deliveryLat = deliveryLocation.lat;
    order.deliveryLng = deliveryLocation.lng;

    setOrders((current) => [order, ...current]);
    setForm(emptyOrderForm);
    setDispatchMessage({
      type: "success",
      text: `${order.id} placed with real map location. Rider: ${rider.name}.`
    });
    setView("tracking");
  }

  function advanceOrder(orderId) {
    const currentOrder = orders.find((order) => order.id === orderId);
    const currentIndex = deliveryStages.indexOf(currentOrder?.status);
    const nextStatus = deliveryStages[Math.min(deliveryStages.length - 1, currentIndex + 1)];

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return { ...order, status: nextStatus };
      })
    );

    if (nextStatus === "Delivered") {
      setView("tracking");
    }
  }

  function resetDemo() {
    Object.values(riderWatchers.current).forEach((watchId) => navigator.geolocation?.clearWatch?.(watchId));
    riderWatchers.current = {};
    setOrders(initialOrders);
    setRiderLocations({});
  }

  function updateRiderLocation(riderId, location) {
    setRiderLocations((current) => ({
      ...current,
      [riderId]: {
        lat: location.lat,
        lng: location.lng,
        updatedAt: new Date().toISOString()
      }
    }));
  }

  function useRiderBrowserGps(orderId) {
    const order = orders.find((item) => item.id === orderId);
    if (!order) return;
    if (!navigator.geolocation) {
      setDispatchMessage({ type: "error", text: "This device/browser does not support GPS sharing." });
      return;
    }

    if (riderWatchers.current[order.riderId]) {
      navigator.geolocation.clearWatch(riderWatchers.current[order.riderId]);
    }

    const watchId = navigator.geolocation.watchPosition((position) => {
      const riderPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      const remainingKm = distanceKm(riderPosition, orderDestination(order));

      updateRiderLocation(order.riderId, riderPosition);
      setOrders((current) =>
        current.map((item) => {
          if (item.id !== orderId) return item;
          return { ...item, status: remainingKm <= 0.08 ? "Delivered" : "On the way" };
        })
      );

      if (remainingKm <= 0.08) {
        navigator.geolocation.clearWatch(watchId);
        delete riderWatchers.current[order.riderId];
      }
    }, () => {
      setDispatchMessage({ type: "error", text: "GPS permission was denied or unavailable on this device." });
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });

    riderWatchers.current[order.riderId] = watchId;
    setDispatchMessage({ type: "success", text: "Live rider GPS is active. ETA will reduce as the rider gets closer." });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Flame size={26} /></div>
        <div>
          <p className="eyebrow">GasFlow dispatch network</p>
          <h1>Fast gas delivery across stores</h1>
        </div>
        <div className="manager-card">
          <ShieldCheck size={20} />
          <span>Customer app</span>
          <strong>Order and track gas</strong>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Main views">
        {[
          ["dispatch", "Place order"],
          ["tracking", "Track order"],
          ["rider", "Rider app"],
          ["manager", "Manager board"],
          ["stores", "Across stores"]
        ].map(([id, label]) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
            {label}
          </button>
        ))}
      </nav>

      {view === "dispatch" && (
        <section className="workspace dispatch-grid">
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Customer problem solved here</p>
                <h2>Customer service order desk</h2>
              </div>
              <span className="status-pill">
                <Clock3 size={16} />
                {canMatchStore ? "Store match ready" : hasMappedDeliveryPlace ? "Choose gas type" : "Waiting for customer location"}
              </span>
            </div>

            <div className="order-form">
              <label>
                Customer name
                <input value={form.customer} onChange={(event) => updateForm("customer", event.target.value)} placeholder="Example: Amina Juma" />
              </label>
              <label>
                Phone number
                <TanzaniaPhoneInput value={form.phone} onChange={(value) => updateForm("phone", value)} />
              </label>
              <label>
                Delivery zone
                <select value={form.zone} onChange={(event) => updateForm("zone", event.target.value)}>
                  <option value="">Choose delivery zone</option>
                  {zones.map((zone) => <option key={zone}>{zone}</option>)}
                </select>
              </label>
              <label>
                Exact address
                <span className="address-location-input">
                  <input
                    value={form.address}
                    onChange={(event) => updateForm("address", event.target.value)}
                    placeholder="Street, shop, landmark, or house number"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    name="gasflow-dropoff-location"
                  />
                  <button type="button" onClick={useCustomerCurrentLocation} disabled={isSubmittingOrder} aria-label="Use current location">
                    <MapPin size={21} />
                  </button>
                </span>
              </label>
              <label>
                Gas type
                <select value={form.cylinder} onChange={(event) => updateForm("cylinder", event.target.value)}>
                  <option value="">Choose gas type</option>
                  {cylinderTypes.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                Notes
                <input value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Empty cylinder exchange, urgent, call before arrival" />
              </label>
              <div className="quantity-card">
                <span>Quantity</span>
                <button onClick={() => updateForm("quantity", Math.max(1, form.quantity - 1))} aria-label="Decrease quantity"><Minus size={18} /></button>
                <strong>{form.quantity}</strong>
                <button onClick={() => updateForm("quantity", form.quantity + 1)} aria-label="Increase quantity"><Plus size={18} /></button>
              </div>
            </div>

            <div className="payment-panel">
              <div className="payment-heading">
                <div>
                  <p className="eyebrow">Payment confirmation</p>
                  <h3>Choose how the customer will pay</h3>
                </div>
                <WalletCards size={22} />
              </div>
              <div className="payment-options">
                {paymentMethods.map((method) => (
                  <button
                    className={form.payment === method.id ? "payment-option active" : "payment-option"}
                    key={method.id}
                    onClick={() => updateForm("payment", method.id)}
                    type="button"
                  >
                    <strong>{method.name}</strong>
                    <span>{method.id === "cash" ? "Collect on delivery" : "Paid before dispatch"}</span>
                  </button>
                ))}
              </div>
              <div className="payment-detail">
                {selectedPayment ? (
                  <>
                    <div>
                      <span>{selectedPayment.accountLabel}</span>
                      <strong>{selectedPayment.accountValue}</strong>
                    </div>
                    <p>{selectedPayment.instruction}</p>
                  </>
                ) : (
                  <p>Choose a payment method before placing the order.</p>
                )}
              </div>
              {selectedPayment && selectedPayment.id !== "cash" && (
                <div className="payment-fields">
                  <label>
                    Payment phone
                    <TanzaniaPhoneInput value={form.paymentPhone || form.phone} onChange={(value) => updateForm("paymentPhone", value)} />
                  </label>
                  <label>
                    {selectedPayment.referenceLabel}
                    <input
                      value={form.paymentReference}
                      onChange={(event) => updateForm("paymentReference", event.target.value)}
                      placeholder="Example: QG45T7K2"
                    />
                  </label>
                </div>
              )}
              {selectedPayment?.id === "cash" && (
                <div className="cash-warning">
                  <AlertTriangle size={18} />
                  <span>Cash orders dispatch as cash pending. Manager must confirm rider collection after delivery.</span>
                </div>
              )}
            </div>

            <div className="checkout-row">
              <div>
                <span>Total</span>
                <strong>{money((selectedCylinder?.price || 0) * form.quantity)}</strong>
              </div>
              <button className="primary-action" onClick={placeOrder} disabled={isSubmittingOrder}>
                <Send size={18} /> {isSubmittingOrder ? "Finding map..." : "Place order"}
              </button>
            </div>
            {dispatchMessage.text && (
              <div className={`dispatch-feedback ${dispatchMessage.type}`}>
                {dispatchMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                <span>{dispatchMessage.text}</span>
              </div>
            )}
          </div>

          <aside className="panel recommendation-panel">
            {!canMatchStore && (
              <div className="service-waiting">
                <Clock3 size={34} />
                <p className="eyebrow">Customer service</p>
                <h2>{hasMappedDeliveryPlace ? "Choose gas type" : "No store selected yet"}</h2>
                  <p>{hasMappedDeliveryPlace ? "Select the gas type. The app will then choose the nearest store that can serve the order." : "Tap the location pin in the exact address field first. The app will not choose any store before the real location is available."}</p>
              </div>
            )}
            {canMatchStore && bestStore && (
              <>
                <p className="eyebrow">Dispatch match</p>
                <h2>{bestStore.name}</h2>
                <div className="route-box">
                  <Store size={22} />
                  <span>{bestStore.zone}</span>
                  <Route size={20} />
                  <span>{form.zone || "Current location"}</span>
                </div>
                <div className="eta-number">
                  <strong>{deliveryMinutesEstimate(bestStore, formDestination)} min</strong>
                  <span>Live tracking starts when the order is placed</span>
                </div>
                <div className="assignment-card">
                  <Bike size={20} />
                  <div>
                    <strong>{pickRider(bestStore.id).name}</strong>
                    <span>{pickRider(bestStore.id).vehicle}</span>
                  </div>
                </div>
                <div className="mini-list">
                  {storeOptions.slice(0, 4).map((store) => (
                    <div className={store.canServe ? "mini-row" : "mini-row blocked"} key={store.id}>
                      <span>{store.name}</span>
                      <strong>{store.canServe ? "Available" : "No stock"}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </section>
      )}

      {view === "manager" && (
        <section className="workspace manager-grid">
          <Metric icon={PackageCheck} label="Active orders" value={activeOrders.length} />
          <Metric icon={CheckCircle2} label="Delivered today" value={deliveredToday} />
          <Metric icon={WalletCards} label="Revenue today" value={money(revenue)} />
          <Metric icon={AlertTriangle} label="Low stock alerts" value={lowStockStores.length} />

          <div className="panel orders-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Dispatch queue</p>
                <h2>Orders that must not be late</h2>
              </div>
              <button className="ghost-action" onClick={resetDemo}><RefreshCcw size={16} /> Reset demo</button>
            </div>
            <OrderTable orders={orders} onAdvance={advanceOrder} />
          </div>
        </section>
      )}

      {view === "rider" && (
        <RiderApp
          orders={orders}
          riderLocations={riderLocations}
          onUseGps={useRiderBrowserGps}
          onAdvance={advanceOrder}
        />
      )}

      {view === "stores" && (
        <section className="workspace stores-grid">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </section>
      )}

      {view === "tracking" && (
        <section className="workspace customer-tracking-layout">
          <div className="tracking-experience">
            {trackingOrder && <LiveMap order={trackingOrder} riderLocation={riderLocations[trackingOrder.riderId]} nowMs={nowMs} />}
            {!trackingOrder && <div className="empty-state"><CheckCircle2 size={28} /> Place an order to track your gas.</div>}
          </div>
        </section>
      )}
    </main>
  );
}

function LiveMap({ order, riderLocation, nowMs }) {
  const store = stores.find((item) => item.id === order.storeId) || stores[0];
  const rider = riders.find((item) => item.id === order.riderId) || riders[0];
  const cylinder = cylinderTypes.find((item) => item.id === order.cylinder);
  const payment = getPaymentMethod(order.payment);
  const destination = orderDestination(order);
  const hasLiveGps = Boolean(riderLocation);
  const liveRiderLocation = trackedRiderLocation(order, store, destination, riderLocation, nowMs);
  const mapView = createTrackingMapView(store, destination, liveRiderLocation);
  const etaSeconds = remainingEtaSeconds(order, liveRiderLocation, destination, nowMs);
  const etaDisplay = order.status === "Delivered" ? "Delivered" : etaText(etaSeconds);
  const etaSourceLabel = hasLiveGps ? "live GPS active" : "live tracking";
  const etaLabel = etaDisplay;
  const statusTitle = order.status === "Delivered" ? "Gas delivered" : "Your gas is on the way";
  const trackingNote = order.status === "Delivered"
    ? "Delivery completed."
    : hasLiveGps
      ? "Rider location is updating on the map."
      : "Tracking route from pickup to your dropoff.";
  const riderInitials = rider.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");

  return (
    <div className="live-map-stack">
      <div className="real-tracking-map">
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
          <path className="route-remaining" d={mapView.remainingPath} />
          <path className="route-completed" d={mapView.completedPath} />
        </svg>
        <span className="map-pin store-pin" style={mapView.storePoint}><Store size={15} /></span>
        <span className="map-pin customer-pin" style={mapView.destinationPoint}><MapPin size={15} /></span>
        <span className="rider-pin" style={mapView.riderPoint}><Truck size={17} /></span>
        <div className="map-watermark">Live gas tracking</div>
        <div className="map-eta-card">
          <span>{order.status === "Delivered" ? "Arrived" : "Estimated arrival"}</span>
          <strong>{etaDisplay}</strong>
          {order.status !== "Delivered" && <small>{etaSourceLabel}</small>}
        </div>

        <div className="tracking-bottom-sheet">
          <span className="sheet-handle" />
          <div className="tracking-hero-row">
            <div>
              <p className="eyebrow">Gas delivery</p>
              <h2>{statusTitle}</h2>
              <span>{trackingNote}</span>
            </div>
            <strong className="eta-badge">{etaLabel}</strong>
          </div>

          <div className="tracking-steps">
            {deliveryStages.slice(1).map((stage) => (
              <span className={deliveryStages.indexOf(stage) <= deliveryStages.indexOf(order.status) ? "active" : ""} key={stage}>
                {stage}
              </span>
            ))}
          </div>

          <div className="rider-card">
            <span className="rider-avatar">{riderInitials}</span>
            <div>
              <strong>{rider.name}</strong>
              <span>{rider.vehicle}</span>
            </div>
            <a className="round-action" href={`tel:${rider.phone}`} aria-label="Call rider"><Phone size={17} /></a>
            <a className="round-action" href={`sms:${rider.phone}`} aria-label="Message rider"><MessageCircle size={17} /></a>
          </div>

          <div className="customer-summary-list compact">
            <div><span>Order</span><strong>{order.id}</strong></div>
            <div><span>Gas</span><strong>{order.quantity} x {cylinder?.label}</strong></div>
            <div><span>Dropoff</span><strong>Your selected delivery point</strong></div>
            <div><span>Payment</span><strong>{payment.name} - {order.paymentStatus}</strong></div>
            <div><span>From</span><strong>{store.name}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiderApp({ orders, riderLocations, onUseGps, onAdvance }) {
  const activeRiderOrders = orders.filter((order) => order.status !== "Delivered");

  return (
    <section className="workspace rider-app">
      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Rider GPS</p>
            <h2>Update live delivery location</h2>
          </div>
        </div>
        {!activeRiderOrders.length && (
          <div className="empty-state"><Truck size={28} /> No active delivery assigned.</div>
        )}
        <div className="rider-order-list">
          {activeRiderOrders.map((order) => {
            const rider = riders.find((item) => item.id === order.riderId);
            const store = stores.find((item) => item.id === order.storeId);
            const location = riderLocations[order.riderId];
            return (
              <article className="rider-order-card" key={order.id}>
                <div>
                  <span className="order-id">{order.id}</span>
                  <h3>{order.address}, {order.zone}</h3>
                  <p>{rider?.name} - {rider?.vehicle}</p>
                  <p>Pickup: {store?.name}</p>
                  <p>{location ? `Last GPS: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "GPS not shared yet"}</p>
                </div>
                <div className="rider-actions">
                  <button className="primary-action" onClick={() => onUseGps(order.id)}>
                    <MapPin size={17} /> Share my GPS
                  </button>
                  <button className="ghost-action" onClick={() => onAdvance(order.id)}>
                    <CheckCircle2 size={17} /> Next status
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OrderTable({ orders, onAdvance, compact = false }) {
  if (!orders.length) {
    return <div className="empty-state"><CheckCircle2 size={28} /> All deliveries are complete.</div>;
  }

  return (
    <div className={compact ? "order-stack compact" : "order-stack"}>
      {orders.map((order) => {
        const store = stores.find((item) => item.id === order.storeId);
        const rider = riders.find((item) => item.id === order.riderId);
        const cylinder = cylinderTypes.find((item) => item.id === order.cylinder);
        const payment = getPaymentMethod(order.payment);
        const stageIndex = deliveryStages.indexOf(order.status);
        return (
          <article className="order-card" key={order.id}>
            <div className="order-main">
              <span className="order-id">{order.id}</span>
              <strong>{order.customer}</strong>
              <span>{order.phone}</span>
            </div>
            <div>
              <strong>{order.quantity} x {cylinder?.label}</strong>
              <span>{order.address}, {order.zone}</span>
            </div>
            <div>
              <strong>{payment.name} - {order.paymentStatus}</strong>
              <span>{order.paymentReference}</span>
            </div>
            <div>
              <strong>{store?.name}</strong>
              <span>{rider?.name} - {rider?.vehicle}</span>
            </div>
            <div className="progress-cell">
              <span className="status-pill">{order.status}</span>
              <div className="stage-bar" style={{ "--stage": `${Math.max(12, (stageIndex / (deliveryStages.length - 1)) * 100)}%` }}><span /></div>
            </div>
            <button className="primary-action small" onClick={() => onAdvance(order.id)} disabled={order.status === "Delivered"}>
              Next status
            </button>
          </article>
        );
      })}
    </div>
  );
}

function StoreCard({ store }) {
  const totalStock = Object.values(store.stock).reduce((sum, value) => sum + value, 0);
  const low = Object.entries(store.stock).filter(([, value]) => value <= 3).map(([key]) => key);

  return (
    <article className="store-card">
      <div className="store-card-head">
        <span><Store size={20} /></span>
        <div>
          <strong>{store.name}</strong>
          <small>{store.zone}</small>
        </div>
      </div>
      <div className="store-metrics">
        <div><span>Stock</span><strong>{totalStock}</strong></div>
        <div><span>Riders</span><strong>{store.riders}</strong></div>
        <div><span>Area</span><strong>{store.zone}</strong></div>
      </div>
      <div className="stock-lines">
        {Object.entries(store.stock).map(([key, value]) => (
          <div key={key}>
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {low.length > 0 && <div className="stock-alert"><AlertTriangle size={16} /> Restock {low.join(", ")}</div>}
    </article>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="metric">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
