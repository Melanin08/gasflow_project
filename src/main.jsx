import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  Banknote,
  Bell,
  Bike,
  Boxes,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Languages,
  MapPin,
  Megaphone,
  PackageCheck,
  Phone,
  Plus,
  Minus,
  ReceiptText,
  RefreshCcw,
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
  { name: "Kariakoo Depot", distance: "1.8 km", status: "Open", stock: 42, rating: 4.8 },
  { name: "Mikocheni Gas Hub", distance: "3.4 km", status: "Open", stock: 18, rating: 4.6 },
  { name: "Airport Road Supply", distance: "6.2 km", status: "Low stock", stock: 5, rating: 4.4 }
];

const paymentMethods = [
  { id: "mpesa", name: "M-Pesa", icon: WalletCards },
  { id: "card", name: "Card / Bank", icon: CreditCard },
  { id: "cash", name: "Cash on Delivery", icon: Banknote }
];

const orderStages = ["Confirmed", "Preparing", "On the way", "Delivered"];

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

function App() {
  const [activeView, setActiveView] = useState("customer");
  const [step, setStep] = useState(0);
  const [gasType, setGasType] = useState(gasTypes[0]);
  const [size, setSize] = useState("13kg");
  const [quantity, setQuantity] = useState(1);
  const [depot, setDepot] = useState(depots[0]);
  const [payment, setPayment] = useState(paymentMethods[0]);
  const [trackingStage, setTrackingStage] = useState(2);

  const total = useMemo(() => gasType.price * quantity, [gasType, quantity]);

  function updateGasType(item) {
    setGasType(item);
    setSize(item.options[1] || item.options[0]);
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
              trackingStage={trackingStage}
              total={total}
              onGasType={updateGasType}
              onSize={setSize}
              onQuantity={setQuantity}
              onDepot={setDepot}
              onPayment={setPayment}
              onTrackingStage={setTrackingStage}
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
            <div className="summary-map">
              <div className="route-line" />
              <span className="pin customer-pin">You</span>
              <span className="pin depot-pin">Depot</span>
              <span className="pin rider-pin">Rider</span>
            </div>
            <dl className="order-summary">
              <div><dt>Size</dt><dd>{size}</dd></div>
              <div><dt>Quantity</dt><dd>{quantity}</dd></div>
              <div><dt>Depot</dt><dd>{depot.name}</dd></div>
              <div><dt>Payment</dt><dd>{payment.name}</dd></div>
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
    trackingStage,
    total,
    onGasType,
    onSize,
    onQuantity,
    onDepot,
    onPayment,
    onTrackingStage
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
      <div className="depot-list">
        {depots.map((item) => (
          <button className={`depot-row ${depot.name === item.name ? "selected" : ""}`} key={item.name} onClick={() => onDepot(item)}>
            <span className="depot-marker"><MapPin size={18} /></span>
            <span><strong>{item.name}</strong><small>{item.distance} away - {item.status}</small></span>
            <b>{item.stock} left</b>
          </button>
        ))}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="payment-grid">
        {paymentMethods.map((item) => {
          const Icon = item.icon;
          return (
            <button className={`payment-card ${payment.id === item.id ? "selected" : ""}`} key={item.id} onClick={() => onPayment(item)}>
              <Icon size={24} />
              <strong>{item.name}</strong>
            </button>
          );
        })}
        <div className="receipt-line">
          <span>Order summary</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="tracking-card">
        <div className="rider-strip">
          <span className="avatar">JM</span>
          <span><strong>Joseph M.</strong><small><Star size={14} fill="currentColor" /> 4.9 rider rating</small></span>
          <button className="icon-button" aria-label="Call rider"><Phone size={18} /></button>
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
