import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  Banknote,
  Bell,
  Bike,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Languages,
  MapPin,
  Megaphone,
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
  UsersRound,
  WalletCards
} from "lucide-react";
import "./styles.css";

const gasTypes = [
  {
    id: "lpg",
    name: "LPG Cylinder",
    price: 28000,
    note: "Fast home delivery",
    options: ["6kg", "13kg", "22kg"]
  },
  {
    id: "natural",
    name: "Natural Gas Refill",
    price: 42000,
    note: "Verified refill depots",
    options: ["Small", "Standard", "Large"]
  },
  {
    id: "bulk",
    name: "Industrial/Bulk Gas",
    price: 185000,
    note: "Scheduled commercial supply",
    options: ["50kg", "100kg", "Bulk"]
  }
];

const depots = [
  { name: "Kariakoo Depot", distance: "1.8 km", status: "Open", stock: 42, rating: 4.8, eta: 18, route: "Ohio St - Morogoro Rd - Lumumba St", lat: -6.8235, lng: 39.2695 },
  { name: "Mikocheni Gas Hub", distance: "3.4 km", status: "Open", stock: 18, rating: 4.6, eta: 29, route: "Old Bagamoyo Rd - Rose Garden Rd", lat: -6.7627, lng: 39.2484 },
  { name: "Airport Road Supply", distance: "6.2 km", status: "Low stock", stock: 5, rating: 4.4, eta: 41, route: "Nyerere Rd - Airport Access Rd", lat: -6.8734, lng: 39.2026 }
];

const deliveryLocations = [
  { name: "Kijitonyama, Dar es Salaam", lat: -6.7838, lng: 39.2413 },
  { name: "Masaki, Dar es Salaam", lat: -6.7469, lng: 39.2823 },
  { name: "Mbezi Beach, Dar es Salaam", lat: -6.7127, lng: 39.2192 },
  { name: "City Centre, Dar es Salaam", lat: -6.8161, lng: 39.2887 }
];

const paymentMethods = [
  { id: "mpesa", name: "M-Pesa", icon: WalletCards },
  { id: "card", name: "Card / Bank", icon: CreditCard },
  { id: "cash", name: "Cash on Delivery", icon: Banknote }
];

const orderStages = ["Confirmed", "Preparing", "On the way", "Delivered"];
const CONTACT_PHONE = "+255777305695";
const CONTACT_DISPLAY = "255 777 305 695";

const customerSteps = [
  { title: "Gas Type", icon: PackageCheck },
  { title: "Size & Qty", icon: Plus },
  { title: "Location", icon: MapPin },
  { title: "Payment", icon: CircleDollarSign },
  { title: "Live Tracking", icon: Truck },
  { title: "Delivered", icon: ReceiptText }
];

const dashboardOrders = [
  { id: "GF-1027", customer: "Amina Juma", product: "13kg LPG x1", status: "New", payment: "M-Pesa", eta: "24 min" },
  { id: "GF-1026", customer: "Bright Foods", product: "Bulk Gas x1", status: "Preparing", payment: "Card", eta: "52 min" },
  { id: "GF-1025", customer: "Daniel M.", product: "6kg LPG x2", status: "On the way", payment: "Cash", eta: "11 min" }
];

const stockRows = [
  { label: "6kg LPG", value: 64, level: 86 },
  { label: "13kg LPG", value: 31, level: 54 },
  { label: "22kg LPG", value: 12, level: 32 },
  { label: "Bulk tanks", value: 7, level: 58 }
];

const processRows = [
  { label: "Customer App", items: ["Browse gas", "Order", "Track", "Rate"], icon: UsersRound },
  { label: "Depot Dashboard", items: ["Receive orders", "Manage stock", "Assign riders", "View revenue"], icon: Store },
  { label: "Admin Control Panel", items: ["Onboard depots", "Monitor orders", "Analytics", "Promotions"], icon: ShieldCheck }
];

const featureChecks = [
  { label: "Live GPS Tracking", icon: MapPin },
  { label: "Mobile Money Payments", icon: WalletCards },
  { label: "One-Tap Reorder", icon: RefreshCcw },
  { label: "Digital Receipts", icon: ReceiptText },
  { label: "Push Notifications", icon: Bell },
  { label: "Loyalty & Promo System", icon: Megaphone },
  { label: "Analytics Dashboard", icon: ChartNoAxesCombined },
  { label: "Swahili + English", icon: Languages }
];

function money(value) {
  return `TZS ${value.toLocaleString("en-US")}`;
}

function riderPoint(progress) {
  const route = [
    { x: 78, y: 18 },
    { x: 66, y: 34 },
    { x: 51, y: 47 },
    { x: 36, y: 61 },
    { x: 18, y: 78 }
  ];
  const value = Math.max(0, Math.min(100, progress));
  const segmentSize = 100 / (route.length - 1);
  const segment = Math.min(route.length - 2, Math.floor(value / segmentSize));
  const segmentProgress = (value - segment * segmentSize) / segmentSize;
  const start = route[segment];
  const end = route[segment + 1];

  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress
  };
}

function mapEmbedUrl(depot, destination) {
  const margin = 0.018;
  const minLng = Math.min(depot.lng, destination.lng) - margin;
  const minLat = Math.min(depot.lat, destination.lat) - margin;
  const maxLng = Math.max(depot.lng, destination.lng) + margin;
  const maxLat = Math.max(depot.lat, destination.lat) + margin;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${destination.lat}%2C${destination.lng}`;
}

function googleDirectionsUrl(depot, destination) {
  return `https://www.google.com/maps/dir/?api=1&origin=${depot.lat},${depot.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

function osmDirectionsUrl(depot, destination) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${depot.lat}%2C${depot.lng}%3B${destination.lat}%2C${destination.lng}`;
}

function App() {
  const [activeView, setActiveView] = useState("customer");
  const [step, setStep] = useState(0);
  const [gasType, setGasType] = useState(gasTypes[0]);
  const [size, setSize] = useState("13kg");
  const [quantity, setQuantity] = useState(1);
  const [depot, setDepot] = useState(depots[0]);
  const [payment, setPayment] = useState(paymentMethods[0]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentReference, setPaymentReference] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(deliveryLocations[0]);
  const [trackingStage, setTrackingStage] = useState(0);
  const [liveTracking, setLiveTracking] = useState(false);
  const [riderProgress, setRiderProgress] = useState(0);

  const total = useMemo(() => gasType.price * quantity, [gasType, quantity]);
  const mapUrl = useMemo(() => mapEmbedUrl(depot, deliveryLocation), [depot, deliveryLocation]);
  const googleUrl = useMemo(() => googleDirectionsUrl(depot, deliveryLocation), [depot, deliveryLocation]);
  const osmUrl = useMemo(() => osmDirectionsUrl(depot, deliveryLocation), [depot, deliveryLocation]);
  const trackingCopy = useMemo(() => {
    const remaining = Math.max(1, Math.ceil(depot.eta * (100 - riderProgress) / 100));
    if (riderProgress >= 98) return { label: "Delivered at customer", eta: "0 min", detail: "Receipt ready" };
    if (riderProgress >= 82) return { label: "Arriving at customer", eta: "1 min", detail: "Rider is on the final street" };
    if (riderProgress >= 55) return { label: "On the way", eta: `${remaining} min`, detail: "Rider is following the selected route" };
    if (riderProgress >= 18) return { label: "Leaving depot", eta: `${remaining} min`, detail: "Cylinder picked and rider dispatched" };
    return { label: "Preparing order", eta: `${depot.eta} min`, detail: "Depot is confirming stock and rider" };
  }, [depot.eta, riderProgress]);
  const mapRiderPoint = useMemo(() => riderPoint(riderProgress), [riderProgress]);

  useEffect(() => {
    if (!liveTracking) return undefined;

    const timer = window.setInterval(() => {
      setRiderProgress((current) => {
        const next = Math.min(100, current + 2);
        if (next >= 100) {
          setLiveTracking(false);
          setTrackingStage(3);
        } else if (next >= 18) {
          setTrackingStage(2);
        } else {
          setTrackingStage(1);
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [liveTracking]);

  function updateGasType(item) {
    setGasType(item);
    setSize(item.options[1] || item.options[0]);
  }

  function updateDepot(item) {
    setDepot(item);
    setRiderProgress(0);
    setTrackingStage(0);
    setLiveTracking(false);
  }

  function updatePayment(item) {
    setPayment(item);
    setPaymentStatus("pending");
    setPaymentReference("");
  }

  function confirmPayment() {
    const prefix = payment.id === "cash" ? "COD" : payment.id.toUpperCase();
    setPaymentReference(`${prefix}-${Math.floor(100000 + Math.random() * 899999)}`);
    setPaymentStatus(payment.id === "cash" ? "reserved" : "paid");
    setTrackingStage(0);
    setRiderProgress(0);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">GasFlow process console</p>
          <h1>Smart gas ordering, fulfilment, and control</h1>
        </div>
        <div className="status-strip" aria-label="Platform status">
          <span><BadgeCheck size={16} /> MVP flow ready</span>
          <span><Clock3 size={16} /> 6-step order</span>
          <a href={`tel:${CONTACT_PHONE}`}><Phone size={16} /> {CONTACT_DISPLAY}</a>
        </div>
      </header>

      <nav className="view-tabs" aria-label="Process views">
        {[
          ["customer", "Customer App"],
          ["depot", "Depot Dashboard"],
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
              <p className="eyebrow">Customer app</p>
              <h2>Order in six checks</h2>
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
                    <strong>{index + 1}. {item.title}</strong>
                  </button>
                );
              })}
            </div>
            <CustomerStep
              step={step}
              gasType={gasType}
              size={size}
              quantity={quantity}
              depot={depot}
              payment={payment}
              paymentStatus={paymentStatus}
              paymentReference={paymentReference}
              deliveryLocation={deliveryLocation}
              deliveryLocations={deliveryLocations}
              mapUrl={mapUrl}
              googleUrl={googleUrl}
              osmUrl={osmUrl}
              trackingStage={trackingStage}
              liveTracking={liveTracking}
              riderProgress={riderProgress}
              trackingCopy={trackingCopy}
              contactPhone={CONTACT_PHONE}
              contactDisplay={CONTACT_DISPLAY}
              total={total}
              onGasType={updateGasType}
              onSize={setSize}
              onQuantity={setQuantity}
              onDepot={updateDepot}
              onPayment={updatePayment}
              onPaymentConfirm={confirmPayment}
              onDeliveryLocation={setDeliveryLocation}
              onTrackingStage={setTrackingStage}
              onLiveTracking={setLiveTracking}
              onRiderProgress={setRiderProgress}
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
            <div className="summary-map real-map">
              <iframe
                title="GasFlow live delivery map"
                src={mapUrl}
                loading="lazy"
              />
              <div className="map-meta">
                <strong>{trackingCopy.label}</strong>
                <span>{depot.name} to {deliveryLocation.name}</span>
              </div>
            </div>
            <div className="map-actions">
              <a className="contact-link" href={googleUrl} target="_blank" rel="noreferrer">
                <Navigation size={16} /> Google directions
              </a>
              <a className="contact-link" href={osmUrl} target="_blank" rel="noreferrer">
                <Route size={16} /> OpenStreetMap
              </a>
            </div>
            <dl className="order-summary">
              <div><dt>Size</dt><dd>{size}</dd></div>
              <div><dt>Quantity</dt><dd>{quantity}</dd></div>
              <div><dt>Depot</dt><dd>{depot.name}</dd></div>
              <div><dt>Direction</dt><dd>{depot.distance} - {trackingCopy.eta}</dd></div>
              <div><dt>Payment</dt><dd>{payment.name}</dd></div>
              <div><dt>Status</dt><dd>{paymentStatus === "paid" ? "Paid" : paymentStatus === "reserved" ? "Cash reserved" : "Not paid"}</dd></div>
              <div><dt>Contact</dt><dd>{CONTACT_DISPLAY}</dd></div>
              <div><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
          </aside>
        </section>
      )}

      {activeView === "depot" && <DepotDashboard />}
      {activeView === "admin" && <AdminPanel />}
      {activeView === "process" && <ProcessCheck />}
    </main>
  );
}

function CustomerStep(props) {
  const {
    step,
    gasType,
    size,
    quantity,
    depot,
    payment,
    paymentStatus,
    paymentReference,
    deliveryLocation,
    deliveryLocations,
    mapUrl,
    googleUrl,
    osmUrl,
    trackingStage,
    liveTracking,
    riderProgress,
    trackingCopy,
    contactPhone,
    contactDisplay,
    total,
    onGasType,
    onSize,
    onQuantity,
    onDepot,
    onPayment,
    onPaymentConfirm,
    onDeliveryLocation,
    onTrackingStage,
    onLiveTracking,
    onRiderProgress
  } = props;

  if (step === 0) {
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

  if (step === 1) {
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

  if (step === 2) {
    return (
      <div className="location-flow">
        <label className="field-label">
          Delivery location
          <select value={deliveryLocation.name} onChange={(event) => onDeliveryLocation(deliveryLocations.find((item) => item.name === event.target.value) || deliveryLocations[0])}>
            {deliveryLocations.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <div className="summary-map real-map inline-map">
          <iframe title="Selected delivery map" src={mapUrl} loading="lazy" />
        </div>
        <div className="depot-list">
          {depots.map((item) => (
            <button className={`depot-row ${depot.name === item.name ? "selected" : ""}`} key={item.name} onClick={() => onDepot(item)}>
              <span className="depot-marker"><Navigation size={18} /></span>
              <span><strong>{item.name}</strong><small>{item.distance} away - {item.status} - ETA {item.eta} min</small></span>
              <b>{item.stock} left</b>
            </button>
          ))}
        </div>
        <div className="route-card">
          <Route size={21} />
          <span>
            <strong>Exact map direction</strong>
            <small>{depot.name} to {deliveryLocation.name}</small>
          </span>
          <a className="contact-link compact" href={googleUrl} target="_blank" rel="noreferrer">Open</a>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="payment-flow">
        <div className="payment-grid">
          {paymentMethods.map((item) => {
            const Icon = item.icon;
            return (
              <button className={`payment-card ${payment.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => onPayment(item)}>
                <Icon size={24} />
                <strong>{item.name}</strong>
                <small>{item.id === "mpesa" ? "Send STK prompt" : item.id === "card" ? "Authorize card" : "Pay rider on delivery"}</small>
              </button>
            );
          })}
        </div>
        <div className="payment-terminal">
          <div>
            <p className="eyebrow">Payment terminal</p>
            <h3>{payment.name}</h3>
            <small>{payment.id === "cash" ? `Cash order is reserved. Rider contact: ${contactDisplay}.` : "This simulates a successful payment confirmation for the demo."}</small>
          </div>
          <div className="terminal-row">
            <span>Amount</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="primary-action full-width" onClick={onPaymentConfirm}>
            {payment.id === "cash" ? "Reserve cash order" : "Confirm payment"} <Send size={17} />
          </button>
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

  if (step === 4) {
    return (
      <div className="tracking-card">
        <div className="rider-strip">
          <span className="avatar">JM</span>
          <span><strong>Joseph M.</strong><small><Star size={14} fill="currentColor" /> 4.9 rider rating - {trackingCopy.label}</small></span>
          <a className="icon-button" href={`tel:${contactPhone}`} aria-label="Call rider"><Phone size={18} /></a>
        </div>
        <div className="live-route-panel">
          <div className="live-route-track" style={{ "--rider-progress": `${riderProgress}%` }}>
            <span style={{ left: `${riderProgress}%` }}><Truck size={17} /></span>
          </div>
          <div className="terminal-row">
            <span>{depot.name} to {deliveryLocation.name}</span>
            <strong>{trackingCopy.eta}</strong>
          </div>
          <div className="tracking-detail">
            <Navigation size={18} />
            <span>{trackingCopy.detail}</span>
          </div>
          <a className="contact-link" href={`tel:${contactPhone}`}>
            <Phone size={16} /> Call {contactDisplay}
          </a>
          <div className="live-actions">
            <button className="primary-action" onClick={() => onLiveTracking(!liveTracking)}>
              {liveTracking ? "Pause live tracking" : "Start live tracking"}
            </button>
            <button
              className="icon-button wide"
              onClick={() => {
                onRiderProgress(0);
                onTrackingStage(0);
                onLiveTracking(false);
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="tracking-stages">
          {orderStages.map((stage, index) => (
            <button
              className={index <= trackingStage ? "stage active" : "stage"}
              key={stage}
              onClick={() => onTrackingStage(index)}
            >
              <span />
              {stage}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="delivered-panel">
      <ReceiptText size={34} />
      <h3>Delivery confirmed</h3>
      <p>Digital receipt saved to order history. Customer can rate depot and rider, then reorder in one tap.</p>
      <div className="rating-row">
        {[1, 2, 3, 4, 5].map((item) => <Star key={item} size={22} fill="currentColor" />)}
      </div>
    </div>
  );
}

function DepotDashboard() {
  return (
    <section className="workspace depot-grid">
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Supplier dashboard</p>
          <h2>Orders arriving now</h2>
        </div>
        <div className="order-table">
          {dashboardOrders.map((order) => (
            <div className="order-row" key={order.id}>
              <span><strong>{order.id}</strong><small>{order.customer}</small></span>
              <span>{order.product}</span>
              <span className="pill">{order.status}</span>
              <span>{order.payment}</span>
              <b>{order.eta}</b>
            </div>
          ))}
        </div>
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
        <Metric icon={CircleDollarSign} label="Daily revenue" value="TZS 4.82M" />
        <Metric icon={Bike} label="Active riders" value="12" />
        <Metric icon={ClipboardCheck} label="Completed" value="138" />
      </div>
    </section>
  );
}

function AdminPanel() {
  return (
    <section className="workspace admin-layout">
      <div className="panel analytics-panel">
        <div className="section-heading">
          <p className="eyebrow">Admin control panel</p>
          <h2>Company-wide oversight</h2>
        </div>
        <div className="analytics-chart" aria-label="Weekly order volume chart">
          {[46, 68, 54, 82, 76, 94, 88].map((height, index) => (
            <span key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div className="panel admin-actions">
        {[
          [Store, "Onboard depots", "Verify documents and activate service zones."],
          [Truck, "Manage riders", "Track accountability, ratings, and delivery time."],
          [Megaphone, "Promotions", "Push discounts, loyalty points, and campaigns."],
          [ChartNoAxesCombined, "Reports", "Review revenue, stock, and depot performance."]
        ].map(([Icon, title, copy]) => (
          <div className="admin-action" key={title}>
            <Icon size={22} />
            <span><strong>{title}</strong><small>{copy}</small></span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProcessCheck() {
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
          <p className="eyebrow">Feature checklist</p>
          <h2>Proposal coverage</h2>
        </div>
        <div className="feature-grid">
          {featureChecks.map((item) => {
            const Icon = item.icon;
            return (
              <div className="feature-item" key={item.label}>
                <Icon size={19} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
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
