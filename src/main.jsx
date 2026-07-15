import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Bell,
  Bike,
  CheckCircle2,
  Clock3,
  Flame,
  Gift,
  Languages,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Receipt,
  Route,
  Send,
  Star,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import "./styles.css";

const cylinderTypes = [
  { id: "6kg", category: "LPG Cylinder", label: "6kg refill", swLabel: "Kujaza 6kg", price: 18000 },
  { id: "15kg", category: "LPG Cylinder", label: "15kg refill", swLabel: "Kujaza 15kg", price: 42000 },
  { id: "38kg", category: "LPG Cylinder", label: "38kg refill", swLabel: "Kujaza 38kg", price: 115000 },
  { id: "starter", category: "LPG Cylinder", label: "New setup kit", swLabel: "Seti mpya", price: 76000 },
  { id: "natural-refill", category: "Natural Gas Refill", label: "Natural gas refill", swLabel: "Kujaza gesi asilia", price: 52000 },
  { id: "industrial-bulk", category: "Industrial/Bulk", label: "Industrial bulk order", swLabel: "Oda kubwa ya kiwanda", price: 185000 }
];

const gasCategories = ["LPG Cylinder", "Natural Gas Refill", "Industrial/Bulk"];

const stores = [
  { id: "st-01", name: "Stone Town Store", zone: "Stone Town", lat: -6.1629, lng: 39.1926, stock: { "6kg": 19, "15kg": 16, "38kg": 5, starter: 7, "natural-refill": 8, "industrial-bulk": 2 }, riders: 4, open: true },
  { id: "st-02", name: "Fuoni Store", zone: "Fuoni", lat: -6.183, lng: 39.25, stock: { "6kg": 28, "15kg": 24, "38kg": 7, starter: 5, "natural-refill": 9, "industrial-bulk": 2 }, riders: 3, open: true },
  { id: "st-03", name: "Bububu Store", zone: "Bububu", lat: -6.1003, lng: 39.2172, stock: { "6kg": 20, "15kg": 18, "38kg": 6, starter: 3, "natural-refill": 6, "industrial-bulk": 1 }, riders: 3, open: true },
  { id: "st-04", name: "Mwanakwerekwe Store", zone: "Mwanakwerekwe", lat: -6.1759, lng: 39.2288, stock: { "6kg": 14, "15kg": 21, "38kg": 4, starter: 6, "natural-refill": 7, "industrial-bulk": 2 }, riders: 2, open: true },
  { id: "st-05", name: "Mombasa Store", zone: "Mombasa", lat: -6.176, lng: 39.246, stock: { "6kg": 17, "15kg": 13, "38kg": 4, starter: 4, "natural-refill": 5, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-06", name: "Kisauni Store", zone: "Kisauni", lat: -6.1378, lng: 39.2207, stock: { "6kg": 22, "15kg": 15, "38kg": 3, starter: 4, "natural-refill": 5, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-07", name: "Kiembe Samaki Store", zone: "Kiembe Samaki", lat: -6.2234, lng: 39.2212, stock: { "6kg": 11, "15kg": 10, "38kg": 3, starter: 2, "natural-refill": 4, "industrial-bulk": 1 }, riders: 1, open: true },
  { id: "st-08", name: "Jang'ombe Store", zone: "Jang'ombe", lat: -6.1752, lng: 39.2145, stock: { "6kg": 15, "15kg": 12, "38kg": 5, starter: 5, "natural-refill": 6, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-09", name: "Chukwani Store", zone: "Chukwani", lat: -6.227, lng: 39.2244, stock: { "6kg": 9, "15kg": 8, "38kg": 2, starter: 2, "natural-refill": 3, "industrial-bulk": 1 }, riders: 1, open: true }
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
    instruction: "Pay from M-Pesa, then enter the SMS receipt code."
  },
  {
    id: "tigopesa",
    name: "Tigo Pesa",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "Tigo Pesa transaction ID",
    instruction: "Pay through Tigo Pesa, then enter the transaction ID."
  },
  {
    id: "airtel",
    name: "Airtel Money",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "Airtel Money reference",
    instruction: "Pay through Airtel Money, then enter the reference."
  },
  {
    id: "halopesa",
    name: "HaloPesa",
    accountLabel: "Merchant number",
    accountValue: "Set your company merchant number",
    referenceLabel: "HaloPesa reference",
    instruction: "Pay through HaloPesa, then enter the reference."
  },
  {
    id: "cash",
    name: "Cash on delivery",
    accountLabel: "Collection",
    accountValue: "Rider collects cash at delivery",
    referenceLabel: "Cash receipt",
    instruction: "Order is reserved now. Rider collects cash and marks payment collected."
  },
  {
    id: "card",
    name: "Card / Bank",
    accountLabel: "Secure checkout",
    accountValue: "Card or bank transfer",
    referenceLabel: "Bank/card reference",
    instruction: "Pay by card or bank transfer, then enter the payment reference."
  }
];
const deliveryStages = ["New", "Accepted", "Rider assigned", "On the way", "Delivered"];
const promoCodes = {
  GAS10: { type: "percent", value: 10, label: "10% off" },
  KARIBU: { type: "fixed", value: 5000, label: "TZS 5,000 off" }
};

const initialOrders = [];
const emptyOrderForm = {
  customer: "",
  phone: "",
  zone: "",
  address: "",
  category: "LPG Cylinder",
  cylinder: "",
  quantity: 1,
  payment: "",
  paymentPhone: "",
  paymentReference: "",
  promoCode: "",
  notes: "",
  deliveryLocation: null
};

const text = {
  en: {
    eyebrow: "GasFlow customer app",
    hero: "Fast gas delivery to your door",
    placeOrder: "Place order",
    trackOrder: "Track order",
    orderGas: "Order gas",
    chooseGas: "Choose your gas and delivery point",
    customerName: "Customer name",
    phoneNumber: "Phone number",
    deliveryZone: "Delivery zone",
    chooseDeliveryZone: "Choose delivery zone",
    exactAddress: "Exact address",
    gasCategory: "Gas category",
    gasType: "Gas type",
    chooseGasType: "Choose gas type",
    notes: "Notes",
    quantity: "Quantity",
    paymentConfirmation: "Payment confirmation",
    choosePayment: "Choose how you will pay",
    paidBeforeDispatch: "Paid before delivery",
    collectOnDelivery: "Collect on delivery",
    paymentPhone: "Payment phone",
    promo: "Promo code",
    total: "Total",
    findingMap: "Finding map...",
    deliveryPoint: "Delivery point",
    noDeliveryPoint: "No delivery point yet",
    nearestDepot: "Nearest available depot",
    liveTrackingStarts: "Live tracking starts when the order is placed",
    available: "Available",
    noStock: "No stock",
    placeToTrack: "Place an order to track your gas.",
    receipt: "Digital receipt",
    confirmDelivered: "Confirm delivered",
    reorder: "Reorder",
    ratingTitle: "Rate depot and rider",
    loyalty: "Loyalty points",
    enableNotifications: "Enable notifications",
    notificationsOn: "Notifications on",
    currentLocation: "Current location"
  },
  sw: {
    eyebrow: "Programu ya mteja GasFlow",
    hero: "Gesi haraka mpaka mlangoni",
    placeOrder: "Agiza",
    trackOrder: "Fuatilia oda",
    orderGas: "Agiza gesi",
    chooseGas: "Chagua gesi na eneo la kufikishiwa",
    customerName: "Jina la mteja",
    phoneNumber: "Namba ya simu",
    deliveryZone: "Eneo la kufikishiwa",
    chooseDeliveryZone: "Chagua eneo",
    exactAddress: "Anwani kamili",
    gasCategory: "Aina ya gesi",
    gasType: "Ukubwa wa gesi",
    chooseGasType: "Chagua gesi",
    notes: "Maelezo",
    quantity: "Idadi",
    paymentConfirmation: "Uthibitisho wa malipo",
    choosePayment: "Chagua njia ya malipo",
    paidBeforeDispatch: "Lipa kabla ya delivery",
    collectOnDelivery: "Lipa ukipokea",
    paymentPhone: "Simu ya malipo",
    promo: "Kodi ya punguzo",
    total: "Jumla",
    findingMap: "Inatafuta ramani...",
    deliveryPoint: "Eneo la kufikishiwa",
    noDeliveryPoint: "Hakuna eneo bado",
    nearestDepot: "Depo iliyo karibu",
    liveTrackingStarts: "Ufuatiliaji utaanza baada ya kuagiza",
    available: "Ipo",
    noStock: "Haipo",
    placeToTrack: "Agiza ili ufuatilie gesi yako.",
    receipt: "Risiti ya kidigitali",
    confirmDelivered: "Thibitisha kupokea",
    reorder: "Agiza tena",
    ratingTitle: "Kadiria depo na dereva",
    loyalty: "Pointi za uaminifu",
    enableNotifications: "Washa taarifa",
    notificationsOn: "Taarifa zimewashwa",
    currentLocation: "Eneo lako"
  }
};

function money(value) {
  return `TZS ${value.toLocaleString("en-US")}`;
}

function gasLabel(item, language) {
  return language === "sw" ? item.swLabel : item.label;
}

function promoDiscount(subtotal, promoCode) {
  const promo = promoCodes[promoCode.trim().toUpperCase()];
  if (!promo) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  return Math.min(subtotal, promo.value);
}

function loyaltyPointsFor(total) {
  return Math.max(1, Math.floor(total / 1000));
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
  const stockPenalty = (store.stock[cylinder] || 0) < quantity ? 1000 : 0;
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
  const [riderLocations] = useState({});
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(emptyOrderForm);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [language, setLanguage] = useState("en");
  const [notificationStatus, setNotificationStatus] = useState("off");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  const t = text[language];
  const filteredCylinderTypes = cylinderTypes.filter((item) => item.category === form.category);
  const selectedCylinder = cylinderTypes.find((item) => item.id === form.cylinder);
  const selectedPayment = form.payment ? getPaymentMethod(form.payment) : null;
  const hasMappedDeliveryPlace = Boolean(form.deliveryLocation);
  const canMatchStore = hasMappedDeliveryPlace && Boolean(form.cylinder);
  const subtotal = (selectedCylinder?.price || 0) * form.quantity;
  const discount = promoDiscount(subtotal, form.promoCode);
  const total = Math.max(0, subtotal - discount);
  const activePromo = promoCodes[form.promoCode.trim().toUpperCase()];
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
        canServe: (store.stock[form.cylinder] || 0) >= form.quantity && store.riders > 0
      }))
      .sort((a, b) => getStoreScore(a, formDestination, form.cylinder, form.quantity) - getStoreScore(b, formDestination, form.cylinder, form.quantity));
  }, [form.cylinder, form.quantity, formDestination]);

  const trackingOrder = orders[0];

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "category" ? { cylinder: "" } : {}),
      ...(["address", "zone"].includes(key) ? { deliveryLocation: null } : {})
    }));
    setDispatchMessage({ type: "", text: "" });
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      setDispatchMessage({ type: "error", text: "This browser does not support push notifications." });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission === "granted" ? "on" : "blocked");
    setDispatchMessage({
      type: permission === "granted" ? "success" : "error",
      text: permission === "granted" ? "Push notifications are enabled." : "Notifications were not enabled."
    });
  }

  function notifyCustomer(title, body) {
    if (notificationStatus === "on" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
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
    const earnedPoints = loyaltyPointsFor(total);
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
      subtotal,
      discount,
      total,
      earnedPoints,
      rating: 0,
      storeId: store.id,
      riderId: rider.id,
      createdAtMs,
      initialEtaMinutes,
      createdAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
    };
    order.deliveryLat = deliveryLocation.lat;
    order.deliveryLng = deliveryLocation.lng;

    setOrders((current) => [order, ...current]);
    setLoyaltyPoints((current) => current + earnedPoints);
    setForm(emptyOrderForm);
    setDispatchMessage({
      type: "success",
      text: `${order.id} placed. You earned ${earnedPoints} loyalty points.`
    });
    notifyCustomer("GasFlow order placed", `${order.id} is assigned to ${rider.name}.`);
    setView("tracking");
  }

  function confirmDelivered(orderId) {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: "Delivered",
          paymentStatus: order.payment === "cash" ? "Paid" : order.paymentStatus,
          deliveredAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
        };
      })
    );
    notifyCustomer("Gas delivered", "Your GasFlow order was marked delivered.");
  }

  function rateOrder(orderId, rating) {
    setOrders((current) =>
      current.map((order) => order.id === orderId ? { ...order, rating } : order)
    );
  }

  function reorder(order) {
    setForm({
      ...emptyOrderForm,
      customer: order.customer,
      phone: order.phone,
      zone: order.zone,
      address: order.address,
      category: order.category || "LPG Cylinder",
      cylinder: order.cylinder,
      quantity: order.quantity,
      payment: order.payment,
      deliveryLocation: {
        lat: order.deliveryLat,
        lng: order.deliveryLng,
        label: order.address
      }
    });
    setView("dispatch");
    setDispatchMessage({ type: "info", text: "Previous order details loaded. Check payment and place the reorder." });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Flame size={26} /></div>
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.hero}</h1>
        </div>
        <div className="top-actions">
          <button className="icon-text-action" type="button" onClick={() => setLanguage((current) => current === "en" ? "sw" : "en")}>
            <Languages size={18} /> {language === "en" ? "SW" : "EN"}
          </button>
          <button className="icon-text-action" type="button" onClick={requestNotifications}>
            <Bell size={18} /> {notificationStatus === "on" ? t.notificationsOn : t.enableNotifications}
          </button>
          <div className="customer-app-card">
            <Gift size={20} />
            <span>{t.loyalty}</span>
            <strong>{loyaltyPoints}</strong>
          </div>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Main views">
        {[
          ["dispatch", t.placeOrder],
          ["tracking", t.trackOrder]
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
                <p className="eyebrow">{t.orderGas}</p>
                <h2>{t.chooseGas}</h2>
              </div>
              <span className="status-pill">
                <Clock3 size={16} />
                {canMatchStore ? "Delivery match ready" : hasMappedDeliveryPlace ? t.chooseGasType : "Waiting for your location"}
              </span>
            </div>

            <div className="order-form">
              <label>
                {t.customerName}
                <input value={form.customer} onChange={(event) => updateForm("customer", event.target.value)} placeholder="Example: Amina Juma" />
              </label>
              <label>
                {t.phoneNumber}
                <TanzaniaPhoneInput value={form.phone} onChange={(value) => updateForm("phone", value)} />
              </label>
              <label>
                {t.deliveryZone}
                <select value={form.zone} onChange={(event) => updateForm("zone", event.target.value)}>
                  <option value="">{t.chooseDeliveryZone}</option>
                  {zones.map((zone) => <option key={zone}>{zone}</option>)}
                </select>
              </label>
              <label>
                {t.exactAddress}
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
                {t.gasCategory}
                <select value={form.category} onChange={(event) => updateForm("category", event.target.value)}>
                  {gasCategories.map((category) => <option value={category} key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                {t.gasType}
                <select value={form.cylinder} onChange={(event) => updateForm("cylinder", event.target.value)}>
                  <option value="">{t.chooseGasType}</option>
                  {filteredCylinderTypes.map((item) => <option value={item.id} key={item.id}>{gasLabel(item, language)}</option>)}
                </select>
              </label>
              <label>
                {t.notes}
                <input value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} placeholder="Empty cylinder exchange, urgent, call before arrival" />
              </label>
              <div className="quantity-card">
                <span>{t.quantity}</span>
                <button onClick={() => updateForm("quantity", Math.max(1, form.quantity - 1))} aria-label="Decrease quantity"><Minus size={18} /></button>
                <strong>{form.quantity}</strong>
                <button onClick={() => updateForm("quantity", form.quantity + 1)} aria-label="Increase quantity"><Plus size={18} /></button>
              </div>
            </div>

            <div className="payment-panel">
              <div className="payment-heading">
                <div>
                  <p className="eyebrow">{t.paymentConfirmation}</p>
                  <h3>{t.choosePayment}</h3>
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
                    <span>{method.id === "cash" ? t.collectOnDelivery : t.paidBeforeDispatch}</span>
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
                    {t.paymentPhone}
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
                  <span>Cash orders are paid to the rider when the gas is delivered.</span>
                </div>
              )}
              <div className="promo-row">
                <label>
                  {t.promo}
                  <input
                    value={form.promoCode}
                    onChange={(event) => updateForm("promoCode", event.target.value.toUpperCase())}
                    placeholder="GAS10 or KARIBU"
                  />
                </label>
                <div className={activePromo ? "promo-result active" : "promo-result"}>
                  <Gift size={17} />
                  <span>{activePromo ? `${activePromo.label} applied` : "Promo optional"}</span>
                </div>
              </div>
            </div>

            <div className="checkout-row">
              <div>
                <span>{t.total}</span>
                <strong>{money(total)}</strong>
                {discount > 0 && <small>Saved {money(discount)}</small>}
              </div>
              <button className="primary-action" onClick={placeOrder} disabled={isSubmittingOrder}>
                <Send size={18} /> {isSubmittingOrder ? t.findingMap : t.placeOrder}
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
                <p className="eyebrow">{t.deliveryPoint}</p>
                <h2>{hasMappedDeliveryPlace ? t.chooseGasType : t.noDeliveryPoint}</h2>
                  <p>{hasMappedDeliveryPlace ? "Select the gas type. The app will then choose the nearest available depot for your order." : "Tap the location pin in the exact address field first. The app will not choose a depot before the real location is available."}</p>
              </div>
            )}
            {canMatchStore && bestStore && (
              <>
                <p className="eyebrow">{t.nearestDepot}</p>
                <h2>{bestStore.name}</h2>
                <div className="route-box">
                  <Store size={22} />
                  <span>{bestStore.zone}</span>
                  <Route size={20} />
                  <span>{form.zone || t.currentLocation}</span>
                </div>
                <div className="eta-number">
                  <strong>{deliveryMinutesEstimate(bestStore, formDestination)} min</strong>
                  <span>{t.liveTrackingStarts}</span>
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
                      <strong>{store.canServe ? t.available : t.noStock}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </section>
      )}

      {view === "tracking" && (
        <section className="workspace customer-tracking-layout">
          <div className="tracking-experience">
            {trackingOrder && (
              <LiveMap
                order={trackingOrder}
                riderLocation={riderLocations[trackingOrder.riderId]}
                nowMs={nowMs}
                language={language}
                t={t}
                onConfirmDelivered={confirmDelivered}
                onRate={rateOrder}
                onReorder={reorder}
              />
            )}
            {!trackingOrder && <div className="empty-state"><CheckCircle2 size={28} /> {t.placeToTrack}</div>}
          </div>
        </section>
      )}
    </main>
  );
}

function LiveMap({ order, riderLocation, nowMs, language, t, onConfirmDelivered, onRate, onReorder }) {
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
  const receiptText = [
    "GasFlow Digital Receipt",
    `Order: ${order.id}`,
    `Customer: ${order.customer}`,
    `Gas: ${order.quantity} x ${cylinder ? gasLabel(cylinder, language) : ""}`,
    `Delivery: ${order.address}, ${order.zone}`,
    `Depot: ${store.name}`,
    `Rider: ${rider.name}`,
    `Payment: ${payment.name} - ${order.paymentStatus}`,
    `Subtotal: ${money(order.subtotal || 0)}`,
    `Discount: ${money(order.discount || 0)}`,
    `Total: ${money(order.total || 0)}`,
    `Loyalty points earned: ${order.earnedPoints || 0}`
  ].join("\n");
  const receiptHref = `data:text/plain;charset=utf-8,${encodeURIComponent(receiptText)}`;

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
            <div><span>Gas</span><strong>{order.quantity} x {cylinder ? gasLabel(cylinder, language) : ""}</strong></div>
            <div><span>Dropoff</span><strong>Your selected delivery point</strong></div>
            <div><span>Payment</span><strong>{payment.name} - {order.paymentStatus}</strong></div>
            <div><span>From</span><strong>{store.name}</strong></div>
            <div><span>Total</span><strong>{money(order.total || 0)}</strong></div>
          </div>

          <div className="receipt-panel">
            <div>
              <p className="eyebrow">{t.receipt}</p>
              <strong>{order.id}</strong>
              <span>{money(order.total || 0)} paid by {payment.name}</span>
            </div>
            <a className="ghost-action" href={receiptHref} download={`${order.id}-receipt.txt`}>
              <Receipt size={17} /> {t.receipt}
            </a>
          </div>

          <div className="tracking-actions">
            {order.status !== "Delivered" && (
              <button className="primary-action" type="button" onClick={() => onConfirmDelivered(order.id)}>
                <CheckCircle2 size={17} /> {t.confirmDelivered}
              </button>
            )}
            <button className="ghost-action" type="button" onClick={() => onReorder(order)}>
              <Plus size={17} /> {t.reorder}
            </button>
          </div>

          {order.status === "Delivered" && (
            <div className="rating-panel">
              <div>
                <p className="eyebrow">{t.ratingTitle}</p>
                <strong>{order.rating ? `${order.rating}/5` : "No rating yet"}</strong>
              </div>
              <div className="star-row" aria-label="Rate order">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    type="button"
                    className={rating <= (order.rating || 0) ? "active" : ""}
                    key={rating}
                    onClick={() => onRate(order.id, rating)}
                    aria-label={`Rate ${rating} stars`}
                  >
                    <Star size={19} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
