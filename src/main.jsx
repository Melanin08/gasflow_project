import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Banknote,
  Bike,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  Minus,
  ReceiptText,
  RefreshCcw,
  Route,
  Send,
  ShieldCheck,
  Star,
  Store,
  Truck,
  UserPlus,
  UsersRound,
  WalletCards
} from "lucide-react";
import "./styles.css";
import { getTrackingStageFromElapsed } from "./trackingLogic.js";

const gasTypes = [
  {
    id: "lpg",
    name: "LPG Cylinder Refill",
    price: 28000,
    note: "Same-day Zanzibar delivery",
    options: ["6kg", "15kg", "38kg"]
  },
  {
    id: "starter",
    name: "New Cylinder Setup",
    price: 76000,
    note: "Cylinder, regulator, and hose",
    options: ["6kg kit", "15kg kit", "Regulator"]
  },
  {
    id: "bulk",
    name: "Commercial LPG Supply",
    price: 185000,
    note: "Hotels, cafes, and shops",
    options: ["38kg", "2 x 38kg", "Scheduled"]
  }
];

const depots = [
  { name: "Fuoni Gas Store, Zanzibar", distance: "Selected store", status: "Open", stock: 36, rating: 4.8, eta: 18, route: "Fuoni service area, Zanzibar", lat: -6.183, lng: 39.250 },
  { name: "Bububu Gas Store, Zanzibar", distance: "Selected store", status: "Open", stock: 42, rating: 4.8, eta: 15, route: "Bububu service area, Zanzibar", lat: -6.100, lng: 39.217 },
  { name: "Mombasa Gas Store, Zanzibar", distance: "Selected store", status: "Open", stock: 28, rating: 4.7, eta: 20, route: "Mombasa service area, Zanzibar", lat: -6.176, lng: 39.246 }
];

const riders = [
  { id: "r1", name: "Asha Khamis", phone: "+255714112233", vehicleType: "Bajaj", vehicleNumber: "TZ-1423", store: "Fuoni Gas Store, Zanzibar", status: "Available", eta: 7 },
  { id: "r2", name: "Salum Juma", phone: "+255765998877", vehicleType: "Motorbike", vehicleNumber: "TZ-9921", store: "Bububu Gas Store, Zanzibar", status: "Available", eta: 5 },
  { id: "r3", name: "Mwanaisha Ali", phone: "+255688445566", vehicleType: "Motorbike", vehicleNumber: "TZ-7720", store: "Mombasa Gas Store, Zanzibar", status: "Available", eta: 9 },
  { id: "r4", name: "Khamis Omar", phone: "+255712334455", vehicleType: "Bajaj", vehicleNumber: "TZ-5534", store: "Fuoni Gas Store, Zanzibar", status: "Busy", eta: 12 }
];

const paymentMethods = [
  { id: "mpesa", name: "M-Pesa", icon: WalletCards, prompt: "Enter customer phone and M-Pesa transaction code." },
  { id: "tigopesa", name: "Tigo Pesa", icon: WalletCards, prompt: "Enter customer phone and Tigo Pesa transaction code." },
  { id: "card", name: "Card", icon: CreditCard, prompt: "Enter the card payment authorization reference." },
  { id: "cash", name: "Cash on Delivery", icon: Banknote, prompt: "Reserve the order. Rider collects cash on delivery." }
];

const orderStages = ["At store", "Picked up", "On the way", "Near delivery", "Delivered"];
const CONTACT_PHONE = "+255777305695";
const CONTACT_DISPLAY = "255 777 305 695";
const USERS_KEY = "gasflow-users";
const SESSION_KEY = "gasflow-session";

const customerSteps = [
  { title: "Call Details", icon: Phone },
  { title: "Gas Type", icon: PackageCheck },
  { title: "Size & Qty", icon: Plus },
  { title: "Delivered To", icon: MapPin },
  { title: "Payment", icon: CircleDollarSign },
  { title: "Live Tracking", icon: Truck },
  { title: "Delivered", icon: ReceiptText }
];

const stockRows = [
  { label: "6kg LPG", value: 64, level: 86 },
  { label: "15kg LPG", value: 31, level: 54 },
  { label: "38kg LPG", value: 12, level: 32 },
  { label: "Regulators", value: 18, level: 58 }
];

const processRows = [
  { label: "Phone Order", items: ["Receive call", "Record customer", "Select gas", "Track route"], icon: UsersRound },
  { label: "Store Dashboard", items: ["Receive orders", "Manage stock", "Assign riders", "View revenue"], icon: Store },
  { label: "Admin Control Panel", items: ["Monitor order", "Review payment", "Check transport", "Confirm delivered time"], icon: ShieldCheck }
];

function money(value) {
  return `TZS ${value.toLocaleString("en-US")}`;
}

function arrivalTime(minutes, now) {
  if (minutes === null) return "--";
  return new Intl.DateTimeFormat("en-TZ", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(now.getTime() + minutes * 60000));
}

function exactTime(value) {
  if (!value) return "Not delivered";
  return new Intl.DateTimeFormat("en-TZ", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function localTanzaniaPhone(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("255")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

function fullTanzaniaPhone(value) {
  const local = localTanzaniaPhone(value);
  return local ? `+255${local}` : "";
}

function isValidTanzaniaPhone(value) {
  return /^[67]\d{8}$/.test(localTanzaniaPhone(value));
}

function mapViewport(depot, destination) {
  const margin = 0.018;
  const minLng = Math.min(depot.lng, destination.lng) - margin;
  const minLat = Math.min(depot.lat, destination.lat) - margin;
  const maxLng = Math.max(depot.lng, destination.lng) + margin;
  const maxLat = Math.max(depot.lat, destination.lat) + margin;

  function point(location) {
    const x = ((location.lng - minLng) / (maxLng - minLng)) * 100;
    const y = (1 - (location.lat - minLat) / (maxLat - minLat)) * 100;

    return {
      left: `${x}%`,
      top: `${y}%`,
      x,
      y
    };
  }

  const depotPoint = point(depot);
  const destinationPoint = point(destination);

  return {
    embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${destination.lat}%2C${destination.lng}`,
    depotPoint,
    destinationPoint,
    routeLine: {
      x1: depotPoint.x,
      y1: depotPoint.y,
      x2: destinationPoint.x,
      y2: destinationPoint.y
    }
  };
}

function googleDirectionsUrl(depot, destination) {
  return `https://www.google.com/maps/dir/?api=1&origin=${depot.lat},${depot.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

function osmDirectionsUrl(depot, destination) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${depot.lat}%2C${depot.lng}%3B${destination.lat}%2C${destination.lng}`;
}

function readStoredUsers() {
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStoredUsers(users) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function verificationCode() {
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

function captchaChallenge() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint32Array(6);
  window.crypto.getRandomValues(values);
  const answer = Array.from(values, (value) => alphabet[value % alphabet.length]).join("");

  return {
    question: answer,
    answer
  };
}

async function sendVerificationEmail(email, code, purpose) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const emailKeys = [serviceId, templateId, publicKey];
  const hasPlaceholderKeys = emailKeys.some((value) => !value || value.startsWith("your_"));

  if (hasPlaceholderKeys) {
    return {
      ok: false,
      error: "Email service keys are still placeholders. Replace them in .env with real EmailJS values."
    };
  }

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          verification_code: code,
          verification_purpose: purpose,
          app_name: "Gas supply in Zanzibar"
        }
      })
    });

    if (response.ok) {
      return { ok: true };
    }

    const responseText = await response.text();
    return {
      ok: false,
      error: responseText || "Verification email could not be sent. Check your EmailJS service, template, and public key."
    };
  } catch {
    return {
      ok: false,
      error: "Verification email could not be sent. Check your internet connection and EmailJS setup."
    };
  }
}

function TanzaniaPhoneInput({ value, onChange, placeholder = "777305695" }) {
  return (
    <span className="phone-input">
      <span>+255</span>
      <input
        value={localTanzaniaPhone(value)}
        onChange={(event) => onChange(fullTanzaniaPhone(event.target.value))}
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={9}
      />
    </span>
  );
}

function App() {
  const [activeView, setActiveView] = useState("customer");
  const [selectedRiderId, setSelectedRiderId] = useState(riders[0].id);
  const [step, setStep] = useState(0);
  const [gasType, setGasType] = useState(gasTypes[0]);
  const [size, setSize] = useState("15kg");
  const [quantity, setQuantity] = useState(1);
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [callerNotes, setCallerNotes] = useState("");
  const [depot, setDepot] = useState(depots[0]);
  const [payment, setPayment] = useState(paymentMethods[0]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [trackingStage, setTrackingStage] = useState(0);
  const [trackingStartedAt, setTrackingStartedAt] = useState(null);
  const [deliveredAt, setDeliveredAt] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const total = useMemo(() => gasType.price * quantity, [gasType, quantity]);
  const destinationName = deliveredTo.trim() || "Delivery place not typed";
  const availableRiders = useMemo(() => {
    const nearby = riders.filter((rider) => rider.store === depot.name && rider.status === "Available");
    return nearby.length ? nearby : riders.filter((rider) => rider.status === "Available");
  }, [depot.name]);
  const selectedRider = useMemo(() => {
    return availableRiders.find((rider) => rider.id === selectedRiderId) || availableRiders[0] || riders[0];
  }, [availableRiders, selectedRiderId]);
  const destination = useMemo(() => ({
    lat: depot.lat,
    lng: depot.lng,
    name: destinationName
  }), [depot.lat, depot.lng, destinationName]);
  const mapView = useMemo(() => mapViewport(depot, destination), [depot, destination]);
  const googleUrl = useMemo(() => googleDirectionsUrl(depot, destination), [depot, destination]);
  const osmUrl = useMemo(() => osmDirectionsUrl(depot, destination), [depot, destination]);
  const currentOrder = useMemo(() => ({
    id: paymentReference || "NEW-ORDER",
    customer: callerName.trim() || "Phone customer",
    phone: callerPhone.trim() || "No phone recorded",
    notes: callerNotes.trim() || "No call notes",
    product: `${size} ${gasType.name} x${quantity}`,
    status: deliveredAt
      ? "Delivered"
      : paymentStatus === "paid" || paymentStatus === "reserved"
        ? orderStages[Math.min(trackingStage, orderStages.length - 1)]
        : "Draft order",
    payment: payment.name,
    total,
    destination: destination.name,
    store: depot.name,
    eta: `${depot.eta} min`,
    deliveredAt,
    deliveredTime: exactTime(deliveredAt),
    riderName: riderName.trim() || "Not assigned",
    riderPhone: riderPhone.trim() || "No rider phone",
    vehicle: [vehicleType.trim(), vehicleNumber.trim()].filter(Boolean).join(" - ") || "No vehicle recorded",
    deliveredBy: riderName.trim() ? `${riderName.trim()} (${[vehicleType.trim(), vehicleNumber.trim()].filter(Boolean).join(" - ") || "vehicle not recorded"})` : "Not assigned",
    reference: paymentReference || "Not confirmed"
  }), [callerName, callerNotes, callerPhone, deliveredAt, depot, destination.name, gasType, payment, paymentReference, paymentStatus, quantity, riderName, riderPhone, size, total, trackingStage, vehicleNumber, vehicleType]);
  const trackingCopy = useMemo(() => {
    if (paymentStatus === "pending") {
      return {
        label: "Payment needed",
        eta: "--",
        etaMinutes: null,
        arrival: "--",
        progress: 0,
        position: "Waiting for payment or cash reservation",
        detail: "Record payment before dispatching this order"
      };
    }

    const stageData = [
      { label: "At store", eta: depot.eta, progress: 8, position: depot.name, detail: "Cylinder is ready at the selected gas store" },
      { label: "Picked up", eta: Math.max(1, depot.eta - 3), progress: 25, position: "Leaving store area", detail: "Rider has collected the cylinder" },
      { label: "On the way", eta: Math.max(1, Math.ceil(depot.eta * 0.55)), progress: 58, position: "On route to delivery place", detail: "The rider route from store to delivery place is visible on the map" },
      { label: "Near delivery", eta: 3, progress: 86, position: destination.name, detail: "Rider is close to the delivery location" },
      { label: "Delivered", eta: 0, progress: 100, position: destination.name, detail: "Delivery completed and receipt ready" }
    ];
    const current = stageData[Math.min(trackingStage, stageData.length - 1)];
    return {
      ...current,
      eta: current.eta === 0 ? "0 min" : `${current.eta} min`,
      etaMinutes: current.eta,
      arrival: current.eta === 0 ? "Delivered" : arrivalTime(current.eta, now)
    };
  }, [depot, destination.name, now, paymentStatus, trackingStage]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedRider) {
      return;
    }

    setRiderName(selectedRider.name);
    setRiderPhone(selectedRider.phone);
    setVehicleType(selectedRider.vehicleType);
    setVehicleNumber(selectedRider.vehicleNumber);
  }, [selectedRider]);

  useEffect(() => {
    if (paymentStatus === "pending" || !trackingStartedAt || trackingStage >= orderStages.length - 1) {
      return;
    }

    const timer = window.setInterval(() => {
      const elapsedMs = Date.now() - trackingStartedAt;
      const nextStage = getTrackingStageFromElapsed(depot.eta, elapsedMs, orderStages.length);
      setTrackingStage((current) => (current < nextStage ? nextStage : current));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [depot.eta, paymentStatus, trackingStartedAt]);

  useEffect(() => {
    if (trackingStage === orderStages.length - 1) {
      setDeliveredAt((current) => current || new Date().toISOString());
      return;
    }

    if (deliveredAt) {
      setDeliveredAt(null);
    }
  }, [deliveredAt, trackingStage]);

  function updateGasType(item) {
    setGasType(item);
    setSize(item.options[1] || item.options[0]);
  }

  function updateDepot(item) {
    setDepot(item);
    setTrackingStage(0);
    setTrackingStartedAt(null);
    setDeliveredAt(null);
  }

  function updatePayment(item) {
    setPayment(item);
    setPaymentStatus("pending");
    setPaymentReference("");
    setPaymentPhone("");
    setPaymentProof("");
    setPaymentError("");
    setTrackingStage(0);
    setTrackingStartedAt(null);
    setDeliveredAt(null);
  }

  function updateTrackingStage(index) {
    setTrackingStage(index);
    if (index === orderStages.length - 1) {
      setDeliveredAt((current) => current || new Date().toISOString());
      return;
    }

    setDeliveredAt(null);
  }

  function confirmPayment() {
    const recordedPhone = paymentPhone.trim() || callerPhone.trim();
    const phoneOk = isValidTanzaniaPhone(recordedPhone);
    const needsPhone = payment.id === "mpesa" || payment.id === "tigopesa";
    const needsReference = payment.id !== "cash";

    if (needsPhone && !phoneOk) {
      setPaymentError("Enter a valid Tanzania phone number after +255, for example 777305695.");
      return;
    }

    if (needsReference && paymentProof.trim().length < 5) {
      setPaymentError(payment.id === "card" ? "Enter the card authorization reference." : "Enter the mobile money transaction reference from the payment message.");
      return;
    }

    const prefix = payment.id === "cash" ? "COD" : payment.id.toUpperCase();
    setPaymentReference(payment.id === "cash" ? `${prefix}-${Date.now().toString().slice(-6)}` : paymentProof.trim().toUpperCase());
    setPaymentStatus(payment.id === "cash" ? "reserved" : "paid");
    setPaymentError("");
    setTrackingStage(0);
    setTrackingStartedAt(Date.now());
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Gas supply in Zanzibar</h1>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Process views">
        {[
          ["customer", "Phone Order"],
          ["depot", "Store Dashboard"],
          ["admin", "Admin Panel"],
          ["process", "Process Check"]
        ].map(([id, label]) => (
          <button
            className={activeView === id ? "active" : ""}
            key={id}
            onClick={() => setActiveView(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeView === "customer" && (
        <section className="workspace two-column">
          <div className="panel process-panel">
            <div className="section-heading">
              <p className="eyebrow">Manager phone order</p>
            </div>
            <div className="delivery-briefing">
              <div className="briefing-card">
                <p className="eyebrow">Fast dispatch overview</p>
                <h3>Nearby stores and riders</h3>
                <div className="briefing-stats">
                  <div>
                    <strong>{depots.length}</strong>
                    <span>Nearby gas stores</span>
                  </div>
                  <div>
                    <strong>{riders.length}</strong>
                    <span>Company riders</span>
                  </div>
                  <div>
                    <strong>{availableRiders.length}</strong>
                    <span>Available now</span>
                  </div>
                </div>
              </div>
              <div className="briefing-card compact-card">
                <p className="eyebrow">Assigned rider</p>
                <h3>{selectedRider?.name || "No rider"}</h3>
                <p>{selectedRider?.vehicleType} • {selectedRider?.vehicleNumber}</p>
                <p>{selectedRider?.phone}</p>
              </div>
            </div>
            <div className="store-list">
              {depots.map((store) => (
                <button
                  key={store.name}
                  className={store.name === depot.name ? "store-chip active" : "store-chip"}
                  onClick={() => updateDepot(store)}
                  type="button"
                >
                  <strong>{store.name}</strong>
                  <span>{store.eta} min • {store.stock} cylinders</span>
                </button>
              ))}
            </div>
            <div className="rider-list">
              {availableRiders.map((rider) => (
                <button
                  key={rider.id}
                  className={selectedRider?.id === rider.id ? "rider-chip active" : "rider-chip"}
                  onClick={() => setSelectedRiderId(rider.id)}
                  type="button"
                >
                  <div>
                    <strong>{rider.name}</strong>
                    <span>{rider.vehicleType} • {rider.vehicleNumber}</span>
                  </div>
                  <small>{rider.eta} min away</small>
                </button>
              ))}
            </div>
            <div className="stepper" aria-label="Customer ordering steps">
              {customerSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    className={`step-dot ${index === step ? "active" : ""} ${index < step ? "done" : ""}`}
                    key={item.title}
                    onClick={() => setStep(index)}
                  >
                    <span><Icon size={17} /></span>
                    <strong>{item.title}</strong>
                  </button>
                );
              })}
            </div>
            <CustomerStep
              step={step}
              gasType={gasType}
              size={size}
              quantity={quantity}
              callerName={callerName}
              callerPhone={callerPhone}
              callerNotes={callerNotes}
              depot={depot}
              payment={payment}
              paymentStatus={paymentStatus}
              paymentReference={paymentReference}
              paymentPhone={paymentPhone}
              paymentProof={paymentProof}
              paymentError={paymentError}
              deliveredTo={deliveredTo}
              destination={destination}
              mapView={mapView}
              googleUrl={googleUrl}
              osmUrl={osmUrl}
              trackingStage={trackingStage}
              trackingCopy={trackingCopy}
              now={now}
              contactPhone={CONTACT_PHONE}
              contactDisplay={CONTACT_DISPLAY}
              riderName={riderName}
              riderPhone={riderPhone}
              vehicleType={vehicleType}
              vehicleNumber={vehicleNumber}
              total={total}
              onGasType={updateGasType}
              onSize={setSize}
              onQuantity={setQuantity}
              onCallerName={setCallerName}
              onCallerPhone={setCallerPhone}
              onCallerNotes={setCallerNotes}
              onDepot={updateDepot}
              onPayment={updatePayment}
              onPaymentConfirm={confirmPayment}
              onPaymentPhone={setPaymentPhone}
              onPaymentProof={setPaymentProof}
              onDeliveredTo={setDeliveredTo}
              onRiderName={setRiderName}
              onRiderPhone={setRiderPhone}
              onVehicleType={setVehicleType}
              onVehicleNumber={setVehicleNumber}
              onTrackingStage={updateTrackingStage}
            />
            <div className="step-actions">
              <button className="icon-button" onClick={() => setStep(Math.max(0, step - 1))} aria-label="Previous step">
                <ChevronLeft size={18} />
              </button>
              <button className="primary-action" onClick={() => setStep(Math.min(customerSteps.length - 1, step + 1))}>
                Next check <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <aside className="panel summary-panel">
            <p className="eyebrow">Live order preview</p>
            <h2>{gasType.name}</h2>
            <ExactMap
              className="summary-map"
              title="Zanzibar LPG store delivery map"
              mapView={mapView}
              depot={depot}
              destination={destination}
              metaTitle={trackingCopy.label}
            />
            <div className="selected-rider-card">
              <p className="eyebrow">Assigned rider</p>
              <h3>{selectedRider?.name || "No rider"}</h3>
              <p>{selectedRider?.phone}</p>
              <p>{selectedRider?.vehicleType} • {selectedRider?.vehicleNumber}</p>
            </div>
            <dl className="order-summary">
              <div><dt>Size</dt><dd>{size}</dd></div>
              <div><dt>Quantity</dt><dd>{quantity}</dd></div>
              <div><dt>Customer</dt><dd>{callerName || "Not recorded"}</dd></div>
              <div><dt>Phone</dt><dd>{callerPhone || "Not recorded"}</dd></div>
              <div><dt>Store</dt><dd>{depot.name}</dd></div>
              <div><dt>Direction</dt><dd>{trackingCopy.eta}</dd></div>
              <div><dt>Payment</dt><dd>{payment.name}</dd></div>
              <div><dt>Status</dt><dd>{paymentStatus === "paid" ? "Paid" : paymentStatus === "reserved" ? "Cash reserved" : "Not paid"}</dd></div>
              <div><dt>Contact</dt><dd>{CONTACT_DISPLAY}</dd></div>
              <div><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
          </aside>
        </section>
      )}

      {activeView === "depot" && <DepotDashboard currentOrder={currentOrder} riders={riders} availableRiders={availableRiders} />}
      {activeView === "admin" && (
        <AdminPanel
          currentOrder={currentOrder}
          mapView={mapView}
          depot={depot}
          destination={destination}
          riders={riders}
          availableRiders={availableRiders}
        />
      )}
      {activeView === "process" && <ProcessCheck currentOrder={currentOrder} />}
    </main>
  );
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verification, setVerification] = useState("");
  const [captcha, setCaptcha] = useState(() => captchaChallenge());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [pendingReset, setPendingReset] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function resetFeedback(nextMode) {
    setMode(nextMode);
    setMessage("");
    setError("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setVerification("");
    setCaptcha(captchaChallenge());
    setCaptchaAnswer("");
    setPendingReset(null);
  }

  function cleanEmail() {
    return email.trim().toLowerCase();
  }

  async function submitAuth(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const normalizedEmail = cleanEmail();
    const users = readStoredUsers();
    const existingUser = users.find((user) => user.email === normalizedEmail);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (mode === "login") {
      if (!password) {
        setError("Enter email and password.");
        return;
      }

      if (!existingUser || existingUser.password !== password) {
        setError("Email or password is incorrect.");
        return;
      }

      onAuth({ name: existingUser.name, email: existingUser.email });
      return;
    }

    if (mode === "register") {
      if (!password) {
        setError("Enter email and password.");
        return;
      }

      if (!name.trim()) {
        setError("Enter your name.");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      if (existingUser) {
        setError("This email is already registered. Login instead.");
        return;
      }

      if (captchaAnswer.trim().toUpperCase() !== captcha.answer) {
        setError("Complete the CAPTCHA correctly.");
        setCaptcha(captchaChallenge());
        setCaptchaAnswer("");
        return;
      }

      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        password,
        verified: true
      };

      writeStoredUsers([...users, newUser]);
      onAuth({ name: newUser.name, email: newUser.email });
      return;
    }

    if (!existingUser) {
      setError("No account found with this email.");
      return;
    }

    if (!pendingReset || pendingReset.email !== normalizedEmail) {
      const code = verificationCode();
      const emailResult = await sendVerificationEmail(normalizedEmail, code, "reset password");

      if (!emailResult.ok) {
        setError(emailResult.error);
        return;
      }

      setPendingReset({
        email: normalizedEmail,
        code
      });
      setMessage(`Verification code sent to ${normalizedEmail}. Check your email.`);
      return;
    }

    if (verification.trim() !== pendingReset.code) {
      setError("Verification code is incorrect.");
      return;
    }

    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    writeStoredUsers(users.map((user) => (
      user.email === normalizedEmail ? { ...user, password } : user
    )));
    setMessage("Password reset. You can login now.");
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setVerification("");
    setPendingReset(null);
  }

  const actionLabel = mode === "login"
    ? "Login"
    : mode === "register"
      ? "Register"
      : pendingReset ? "Verify and reset password" : "Send verification email";
  const authTitle = mode === "login" ? "Login" : mode === "register" ? "Register" : "Forgot password";

  return (
    <main className={`auth-shell auth-shell-${mode}`}>
      <section className={`auth-panel auth-panel-${mode}`}>
        <div className="auth-brand">
          <span><Store size={24} /></span>
          <h1>Gas supply in Zanzibar</h1>
        </div>

        <h2 className="auth-title">{authTitle}</h2>

        <form className={`auth-form auth-form-${mode}`} onSubmit={submitAuth}>
          {mode === "register" && (
            <label className="field-label">
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Example: Amina Juma" />
            </label>
          )}

          <label className="field-label">
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" />
          </label>

          {mode === "register" && (
            <label className="field-label">
              Phone
              <TanzaniaPhoneInput value={phone} onChange={setPhone} />
            </label>
          )}

          {(mode !== "forgot" || pendingReset) && (
            <label className="field-label">
              {mode === "forgot" ? "New password" : "Password"}
              <span className="password-input">
                <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" type={showPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}

          {mode === "register" && (
            <label className="field-label">
              Confirm password
              <span className="password-input">
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" type={showConfirmPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}

          {mode === "register" && (
            <label className="field-label">
              CAPTCHA
              <span className="captcha-row">
                <strong aria-label="CAPTCHA code">
                  {captcha.question.split("").map((character, index) => (
                    <span key={`${character}-${index}`}>{character}</span>
                  ))}
                </strong>
                <input value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} placeholder="6 letters/numbers" autoCapitalize="characters" maxLength={6} />
                <button className="icon-button" type="button" onClick={() => {
                  setCaptcha(captchaChallenge());
                  setCaptchaAnswer("");
                }} aria-label="Refresh CAPTCHA">
                  <RefreshCcw size={17} />
                </button>
              </span>
            </label>
          )}

          {mode === "forgot" && pendingReset && (
            <label className="field-label">
              Verification code
              <input value={verification} onChange={(event) => setVerification(event.target.value)} placeholder="Enter the 6-digit code" inputMode="numeric" />
            </label>
          )}

          {mode === "forgot" && pendingReset && (
            <label className="field-label">
              Confirm new password
              <span className="password-input">
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat new password" type={showConfirmPassword ? "text" : "password"} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                  {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          )}

          <div className={`auth-feedback ${!error && !message ? "empty" : ""}`}>
            {error && <div className="payment-error">{error}</div>}
            {message && <div className="payment-success"><CheckCircle2 size={20} /><span><strong>{message}</strong></span></div>}
          </div>

          <button className="primary-action full-width" type="submit">
            {mode === "login" && <KeyRound size={17} />}
            {mode === "register" && <UserPlus size={17} />}
            {mode === "forgot" && <Mail size={17} />}
            {actionLabel}
          </button>

          <div className="auth-switch">
            <button type="button" onClick={() => resetFeedback(mode === "register" ? "login" : "register")}>
              {mode === "register" ? "Login" : "Register"}
            </button>
            <button type="button" onClick={() => resetFeedback(mode === "forgot" ? "login" : "forgot")}>
              {mode === "forgot" ? "Login" : "Forgot password"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function CustomerStep(props) {
  const {
    step,
    gasType,
    size,
    quantity,
    callerName,
    callerPhone,
    callerNotes,
    depot,
    payment,
    paymentStatus,
    paymentReference,
    paymentPhone,
    paymentProof,
    paymentError,
    deliveredTo,
    destination,
    mapView,
    googleUrl,
    osmUrl,
    trackingStage,
    trackingCopy,
    now,
    contactPhone,
    contactDisplay,
    riderName,
    riderPhone,
    vehicleType,
    vehicleNumber,
    total,
    onGasType,
    onSize,
    onQuantity,
    onCallerName,
    onCallerPhone,
    onCallerNotes,
    onDepot,
    onPayment,
    onPaymentConfirm,
    onPaymentPhone,
    onPaymentProof,
    onDeliveredTo,
    onRiderName,
    onRiderPhone,
    onVehicleType,
    onVehicleNumber,
    onTrackingStage
  } = props;

  if (step === 0) {
    return (
      <div className="call-form">
        <label className="field-label">
          Customer name
          <input
            value={callerName}
            onChange={(event) => onCallerName(event.target.value)}
            placeholder="Example: Amina Juma"
          />
        </label>
        <label className="field-label">
          Customer phone
          <TanzaniaPhoneInput value={callerPhone} onChange={onCallerPhone} />
        </label>
        <label className="field-label full-span">
          Call notes
          <input
            value={callerNotes}
            onChange={(event) => onCallerNotes(event.target.value)}
            placeholder="Example: needs 15kg cylinder today, pay by M-Pesa"
          />
        </label>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="choice-grid">
        {gasTypes.map((item) => (
          <button className={`choice-card ${gasType.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => onGasType(item)}>
            <strong>{item.name}</strong>
            <span>{item.note}</span>
            <b>{money(item.price)}</b>
          </button>
        ))}
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flow-content">
        <div className="size-row">
          {gasType.options.map((option, index) => (
            <button className={`size-chip ${size === option ? "selected" : ""}`} key={option} onClick={() => onSize(option)}>
              {option}
              {index === 1 && <span>Popular</span>}
            </button>
          ))}
        </div>
        <div className="quantity-control">
          <button className="icon-button" onClick={() => onQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity"><Minus size={18} /></button>
          <strong>{quantity}</strong>
          <button className="icon-button" onClick={() => onQuantity(quantity + 1)} aria-label="Increase quantity"><Plus size={18} /></button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="location-flow">
        <label className="field-label">
          Delivered to
          <input
            value={deliveredTo}
            onChange={(event) => onDeliveredTo(event.target.value)}
            placeholder="Example: Amina Juma, Bububu Cafe, or Stone Town shop"
          />
        </label>
        <div className="field-label">
          Taken from gas store
        </div>
        <div className="depot-list">
          {depots.map((item) => (
            <button className={`depot-row ${depot.name === item.name ? "selected" : ""}`} key={item.name} onClick={() => onDepot(item)}>
              <span className="depot-marker"><Navigation size={18} /></span>
              <span><strong>{item.name}</strong><small>{item.status} - ETA {item.eta} min - {item.route}</small></span>
              <b>{item.stock} left</b>
            </button>
          ))}
        </div>
        <div className="route-card">
          <Route size={21} />
          <span>
            <strong>Store to delivery route</strong>
            <small>Gas is taken from {depot.name} and delivered to {destination.name}.</small>
          </span>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="payment-flow">
        <div className="payment-grid">
          {paymentMethods.map((item) => {
            const Icon = item.icon;
            return (
              <button className={`payment-card ${payment.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => onPayment(item)}>
                <Icon size={24} />
                <strong>{item.name}</strong>
                <small>{item.id === "cash" ? "Pay rider on delivery" : "Record transaction reference"}</small>
              </button>
            );
          })}
        </div>
        <div className="payment-terminal">
          <div>
            <p className="eyebrow">Payment terminal</p>
            <h3>{payment.name}</h3>
            <small>{payment.prompt}</small>
          </div>
          {payment.id !== "cash" && (
            <div className="payment-form">
              {payment.id !== "card" && (
                <label className="field-label">
                  Customer phone
                  <TanzaniaPhoneInput value={paymentPhone} onChange={onPaymentPhone} />
                </label>
              )}
              <label className="field-label">
                {payment.id === "card" ? "Authorization reference" : "Transaction reference"}
                <input
                  value={paymentProof}
                  onChange={(event) => onPaymentProof(event.target.value)}
                  placeholder={payment.id === "card" ? "Example: AUTH-48291" : "Example: QG45T7K2"}
                />
              </label>
            </div>
          )}
          {payment.id === "cash" && (
            <div className="cash-note">
              <Banknote size={20} />
              <span>Cash will be collected by the rider on delivery. Store contact: {contactDisplay}.</span>
            </div>
          )}
          <div className="terminal-row">
            <span>Amount</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="primary-action full-width" onClick={onPaymentConfirm}>
            {payment.id === "cash" ? "Reserve cash order" : "Record received payment"} <Send size={17} />
          </button>
          {paymentError && <div className="payment-error">{paymentError}</div>}
          {paymentStatus !== "pending" && (
            <div className="payment-success">
              <CheckCircle2 size={20} />
              <span>
                <strong>{paymentStatus === "paid" ? "Payment confirmed" : "Cash order reserved"}</strong>
                <small>Reference {paymentReference}</small>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 5) {
    const trackingLocked = paymentStatus === "pending";
    const riderInitials = riderName.trim()
      ? riderName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
      : "RD";
    const riderPhoneLink = riderPhone.trim() || contactPhone;
    return (
      <div className="tracking-card">
        <div className="call-form">
          <label className="field-label">
            Rider name
            <input value={riderName} onChange={(event) => onRiderName(event.target.value)} placeholder="Example: Joseph M." />
          </label>
          <label className="field-label">
            Rider phone
            <TanzaniaPhoneInput value={riderPhone} onChange={onRiderPhone} />
          </label>
          <label className="field-label">
            Vehicle type
            <input value={vehicleType} onChange={(event) => onVehicleType(event.target.value)} placeholder="Example: Motorcycle" />
          </label>
          <label className="field-label">
            Vehicle number
            <input value={vehicleNumber} onChange={(event) => onVehicleNumber(event.target.value)} placeholder="Example: ZNZ 123 AB" />
          </label>
        </div>
        <div className="rider-strip">
          <span className="avatar">{riderInitials}</span>
          <span>
            <strong>{riderName || "Transport not assigned"}</strong>
            <small><Star size={14} fill="currentColor" /> {vehicleType || "Vehicle type not recorded"} {vehicleNumber && `- ${vehicleNumber}`} - {trackingCopy.label}</small>
          </span>
          <a className="icon-button" href={`tel:${riderPhoneLink}`} aria-label="Call rider"><Phone size={18} /></a>
        </div>
        <ExactMap
          className="summary-map inline-map tracking-map"
          title="Real delivery route map"
          mapView={mapView}
          depot={depot}
          destination={destination}
          metaTitle={trackingCopy.label}
          routeProgress={trackingCopy.progress}
        />
        <div className="live-route-panel">
          <div className="dispatch-status">
            <div>
              <span>Current rider position</span>
              <strong>{trackingCopy.position}</strong>
            </div>
            <div>
              <span>ETA</span>
              <strong>{trackingCopy.eta}</strong>
            </div>
            <div>
              <span>Estimated arrival</span>
              <strong>{trackingCopy.arrival}</strong>
            </div>
          </div>
          <div className="dispatch-progress" style={{ "--delivery-progress": `${trackingCopy.progress}%` }}>
            <span />
          </div>
          <div className="terminal-row">
            <span>Store: {depot.name}</span>
            <strong>{trackingCopy.eta}</strong>
          </div>
          <div className="tracking-detail">
            <MapPin size={18} />
            <span>Delivery location: {destination.name}</span>
          </div>
          <div className="tracking-detail">
            <Navigation size={18} />
            <span>{trackingCopy.detail}</span>
          </div>
          <div className="tracking-detail">
            <Clock3 size={18} />
            <span>Manager updated: {arrivalTime(0, now)}</span>
          </div>
          <a className="contact-link" href={`tel:${riderPhoneLink}`}>
            <Phone size={16} /> Call {riderPhone || contactDisplay}
          </a>
        </div>
        <div className="tracking-stages">
          {orderStages.map((stage, index) => (
            <button
              className={index <= trackingStage ? "stage active" : "stage"}
              key={stage}
              disabled
            >
              <span />
              {stage}
            </button>
          ))}
        </div>
        {trackingLocked && (
          <div className="payment-error">
            Record mobile money payment or reserve cash order before dispatch tracking.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="delivered-panel">
      <ReceiptText size={34} />
      <h3>Delivery confirmed</h3>
      <p>Digital receipt saved with customer, store, transport, and delivered time details.</p>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={22} fill="currentColor" />)}
      </div>
    </div>
  );
}

function ExactMap({ className, title, mapView, depot, destination, metaTitle, routeProgress = null }) {
  const riderPoint = routeProgress === null ? null : {
    left: `${mapView.routeLine.x1 + ((mapView.routeLine.x2 - mapView.routeLine.x1) * routeProgress) / 100}%`,
    top: `${mapView.routeLine.y1 + ((mapView.routeLine.y2 - mapView.routeLine.y1) * routeProgress) / 100}%`
  };

  return (
    <div className={`${className} real-map`}>
      <iframe title={title} src={mapView.embedUrl} loading="lazy" />
      <svg className="route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line
          x1={mapView.routeLine.x1}
          y1={mapView.routeLine.y1}
          x2={mapView.routeLine.x2}
          y2={mapView.routeLine.y2}
        />
      </svg>
      <span className="exact-map-pin depot-pin" style={mapView.depotPoint}>
        Store
      </span>
      <span className="exact-map-pin customer-pin" style={mapView.destinationPoint}>
        Delivery
      </span>
      {riderPoint && (
        <span className="rider-map-pin" style={riderPoint}>
          <Truck size={15} />
        </span>
      )}
      <div className="map-meta">
        <strong>{metaTitle}</strong>
        <span>Store: {depot.name}</span>
        <span>Delivery location: {destination.name}</span>
      </div>
    </div>
  );
}

function DepotDashboard({ currentOrder, riders, availableRiders }) {
  return (
    <section className="workspace depot-grid">
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Zanzibar LPG Stores</p>
          <h2>Current order</h2>
        </div>
        <div className="active-order">
          <span>
            <strong>{currentOrder.id}</strong>
            <small>{currentOrder.customer} - {currentOrder.phone}</small>
          </span>
          <span>{currentOrder.product}</span>
          <span>{currentOrder.destination}</span>
          <span className="pill">{currentOrder.status}</span>
          <b>{money(currentOrder.total)}</b>
        </div>
        <dl className="order-summary">
          <div><dt>Payment</dt><dd>{currentOrder.payment}</dd></div>
          <div><dt>Store</dt><dd>{currentOrder.store}</dd></div>
          <div><dt>Delivered by</dt><dd>{currentOrder.deliveredBy}</dd></div>
          <div><dt>Rider phone</dt><dd>{currentOrder.riderPhone}</dd></div>
          <div><dt>Delivered time</dt><dd>{currentOrder.deliveredTime}</dd></div>
          <div><dt>Reference</dt><dd>{currentOrder.reference}</dd></div>
        </dl>
      </div>
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Stock control</p>
          <h2>Cylinder availability</h2>
        </div>
        <div className="stock-list">
          {stockRows.map((row) => (
            <div className="stock-row" key={row.label}>
              <div><strong>{row.label}</strong><span>{row.value} units</span></div>
              <div className="stock-bar"><span style={{ width: `${row.level}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel metric-band">
        <Metric icon={CircleDollarSign} label="Daily revenue" value="TZS 1.24M" />
        <Metric icon={Bike} label="Available riders" value={`${availableRiders.length}`} />
        <Metric icon={ClipboardCheck} label="Company riders" value={`${riders.length}`} />
      </div>
    </section>
  );
}

function AdminPanel({ currentOrder, mapView, depot, destination, riders, availableRiders }) {
  return (
    <section className="workspace admin-layout">
      <div className="panel analytics-panel">
        <div className="section-heading">
          <p className="eyebrow">Admin control panel</p>
          <h2>Store oversight</h2>
        </div>
        <ExactMap
          className="summary-map admin-map"
          title="Admin service area map"
          mapView={mapView}
          depot={depot}
          destination={destination}
          metaTitle="Active Zanzibar delivery route"
        />
        <dl className="order-summary admin-summary">
          <div><dt>Customer</dt><dd>{currentOrder.customer}</dd></div>
          <div><dt>Phone</dt><dd>{currentOrder.phone}</dd></div>
          <div><dt>Store</dt><dd>{currentOrder.store}</dd></div>
          <div><dt>Destination</dt><dd>{currentOrder.destination}</dd></div>
          <div><dt>Order</dt><dd>{currentOrder.product}</dd></div>
          <div><dt>Payment</dt><dd>{currentOrder.payment}</dd></div>
          <div><dt>Status</dt><dd>{currentOrder.status}</dd></div>
          <div><dt>Delivered by</dt><dd>{currentOrder.deliveredBy}</dd></div>
          <div><dt>Rider phone</dt><dd>{currentOrder.riderPhone}</dd></div>
          <div><dt>Available riders</dt><dd>{availableRiders.length}</dd></div>
          <div><dt>Company riders</dt><dd>{riders.length}</dd></div>
          <div><dt>Vehicle</dt><dd>{currentOrder.vehicle}</dd></div>
          <div><dt>Delivered time</dt><dd>{currentOrder.deliveredTime}</dd></div>
          <div><dt>Reference</dt><dd>{currentOrder.reference}</dd></div>
          <div><dt>Call notes</dt><dd>{currentOrder.notes}</dd></div>
        </dl>
      </div>
    </section>
  );
}

function ProcessCheck({ currentOrder }) {
  return (
    <section className="workspace process-check">
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">End-to-end process</p>
          <h2>How the platform moves work</h2>
        </div>
        <div className="lane-grid">
          {processRows.map((lane) => {
            const Icon = lane.icon;
            return (
              <div className="lane" key={lane.label}>
                <h3><Icon size={20} /> {lane.label}</h3>
                {lane.items.map((item, index) => (
                  <div className="lane-item" key={item}>
                    <span>{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Current order status</p>
          <h2>{currentOrder.status}</h2>
        </div>
        <dl className="order-summary">
          <div><dt>Customer</dt><dd>{currentOrder.customer}</dd></div>
          <div><dt>Phone</dt><dd>{currentOrder.phone}</dd></div>
          <div><dt>Product</dt><dd>{currentOrder.product}</dd></div>
          <div><dt>Destination</dt><dd>{currentOrder.destination}</dd></div>
          <div><dt>ETA</dt><dd>{currentOrder.eta}</dd></div>
          <div><dt>Delivered by</dt><dd>{currentOrder.deliveredBy}</dd></div>
          <div><dt>Delivered time</dt><dd>{currentOrder.deliveredTime}</dd></div>
          <div><dt>Total</dt><dd>{money(currentOrder.total)}</dd></div>
        </dl>
      </div>
    </section>
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
