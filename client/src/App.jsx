import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Bike,
  CheckCircle2,
  Clock3,
  Flame,
  Gift,
  Languages,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Route,
  Send,
  Share2,
  Star,
  Store,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import DispatchPage from "./pages/DispatchPage.jsx";
import RiderGpsPage from "./pages/RiderGpsPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import { PaymentQrCard, RoutePreviewMap, TanzaniaPhoneInput } from "./components/FormControls.jsx";
import {
  cylinderTypes,
  deliveryStages,
  emptyOrderForm,
  gasCategories,
  initialOrders,
  paymentMethods,
  promoCodes,
  riders,
  stores,
  zones,
} from "./data/gasflowData.js";
import { text } from "./i18n/translations.js";
import {
  deliveryEtaEstimate,
  distanceKm,
  distanceText,
  etaRangeText,
  etaText,
  fullTanzaniaPhone,
  gasLabel,
  getPaymentMethod,
  getStoreScore,
  isZanzibarRoadRoute,
  localTanzaniaPhone,
  loyaltyPointsFor,
  money,
  orderDestination,
  paymentDisplay,
  pickRider,
  placeToLocation,
  promoDiscount,
  providerConfirmationReference,
  recommendStore,
  remainingEtaSeconds,
  resolveDeliveryLocation,
  roadDistanceKm,
  routeApiUrl,
  routeCoordinatesToLocations,
  searchTanzaniaPlaces,
} from "./utils/gasflowLogic.js";
import "./styles.css";

const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
let leafletLoadPromise;

const roleCredentials = {
  rider: {
    label: "Rider",
    usernameLabel: "Rider email",
    passwordLabel: "PIN",
    username: "rider@iitmz.ac.in"
  },
  admin: {
    label: "Admin",
    usernameLabel: "Admin email",
    passwordLabel: "Password",
    username: "admin@iitmz.ac.in"
  }
};

const STAFF_EMAIL_DOMAIN = "@iitmz.ac.in";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5001";

function portalFromHash() {
  const portal = window.location.hash.replace("#", "").toLowerCase();
  return portal === "admin" || portal === "rider" ? portal : "customer";
}

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS_URL;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${LEAFLET_JS_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.L), { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return leafletLoadPromise;
}

export default function App() {
  const [portal, setPortal] = useState(portalFromHash);
  const [sessions, setSessions] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("gasflowSessions")) || {};
    } catch {
      return {};
    }
  });
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [view, setView] = useState("dispatch");
  const [orderStep, setOrderStep] = useState("details");
  const [orders, setOrders] = useState(initialOrders);
  const [riderLocations, setRiderLocations] = useState({});
  const [riderGpsStatus, setRiderGpsStatus] = useState({ sharing: false, message: "" });
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const [dispatchMessage, setDispatchMessage] = useState({ type: "", text: "" });
  const [form, setForm] = useState(emptyOrderForm);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [language, setLanguage] = useState("en");
  const [notificationStatus, setNotificationStatus] = useState("off");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [welcomeNotice, setWelcomeNotice] = useState("");
  const [mapAddressSuggestions, setMapAddressSuggestions] = useState([]);
  const [addressSearchStatus, setAddressSearchStatus] = useState("idle");

  const t = text[language];
  const filteredCylinderTypes = cylinderTypes.filter((item) => item.category === form.category);
  const selectedCylinder = cylinderTypes.find((item) => item.id === form.cylinder);
  const selectedPayment = form.payment ? getPaymentMethod(form.payment) : null;
  const selectedPaymentText = selectedPayment ? paymentDisplay(selectedPayment, t) : null;
  const hasMappedDeliveryPlace = Boolean(form.deliveryLocation);
  const hasDeliveryZone = Boolean(form.zone);
  const canMatchStore = hasMappedDeliveryPlace && hasDeliveryZone && Boolean(form.cylinder);
  const subtotal = (selectedCylinder?.price || 0) * form.quantity;
  const discount = promoDiscount(subtotal, form.promoCode);
  const total = Math.max(0, subtotal - discount);
  const activePromo = promoCodes[form.promoCode.trim().toUpperCase()];
  const addressSuggestions = mapAddressSuggestions;
  const formDestination = useMemo(() => {
    const fallback = form.deliveryLocation;
    if (!fallback) return null;
    return {
      lat: fallback.lat,
      lng: fallback.lng,
      label: fallback.label || form.address
    };
  }, [form.address, form.deliveryLocation]);
  const bestStore = useMemo(() => {
    if (!formDestination || !form.cylinder) return null;
    return recommendStore(formDestination, form.cylinder, form.quantity);
  }, [form.cylinder, form.quantity, formDestination]);
  const isOrderSummaryReady = Boolean(selectedCylinder && bestStore && selectedPayment);
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
  const assignedRider = trackingOrder ? riders.find((item) => item.id === trackingOrder.riderId) : null;
  const activeRiderLocation = trackingOrder ? riderLocations[trackingOrder.riderId] : null;
  const portalTitle = portal === "admin" ? "GasFlow Admin" : portal === "rider" ? "GasFlow Rider" : t.hero;
  const portalEyebrow = portal === "admin" ? "Operations dashboard" : portal === "rider" ? t.riderLocationSender : t.eyebrow;
  const visibleViews = portal === "admin"
    ? [["admin", "Admin"]]
    : portal === "rider"
      ? [["rider", t.riderGps]]
      : [["dispatch", t.placeOrder], ["tracking", t.trackOrder]];
  const activeSession = sessions[portal]?.expiresAtMs > Date.now() ? sessions[portal] : null;

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    function syncPortal() {
      const nextPortal = portalFromHash();
      setPortal(nextPortal);
      if (nextPortal === "admin") {
        setHasEnteredApp(true);
        setView("admin");
      } else if (nextPortal === "rider") {
        setHasEnteredApp(true);
        setView("rider");
      } else {
        setView((current) => current === "tracking" ? "tracking" : "dispatch");
      }
    }

    syncPortal();
    window.addEventListener("hashchange", syncPortal);
    return () => window.removeEventListener("hashchange", syncPortal);
  }, []);

  useEffect(() => {
    return () => {
      if (gpsWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    };
  }, [gpsWatchId]);

  useEffect(() => {
    const query = form.address.trim();
    if (query.length < 3 || form.deliveryLocation) {
      setMapAddressSuggestions([]);
      setAddressSearchStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setAddressSearchStatus("searching");
      searchTanzaniaPlaces(query, controller.signal)
        .then((places) => {
          setMapAddressSuggestions(places);
          setAddressSearchStatus(places.length > 0 ? "ready" : "empty");
        })
        .catch((error) => {
          if (error.name === "AbortError") return;
          setMapAddressSuggestions([]);
          setAddressSearchStatus("fallback");
        });
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [form.address, form.deliveryLocation]);

  function updateForm(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "category" ? { cylinder: "" } : {}),
      ...(key === "address" ? { deliveryLocation: null } : {})
    }));
    setDispatchMessage({ type: "", text: "" });
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setNotificationStatus("unsupported");
      setDispatchMessage({ type: "error", text: t.pushUnsupported });
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationStatus(permission === "granted" ? "on" : "blocked");
    setDispatchMessage({
      type: permission === "granted" ? "success" : "error",
      text: permission === "granted" ? t.pushEnabled : t.pushNotEnabled
    });
  }

  function notifyCustomer(title, body) {
    if (notificationStatus === "on" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  function enterApp() {
    setHasEnteredApp(true);
    setWelcomeNotice("");
  }

  function returnToCustomerApp() {
    if (portal !== "customer") {
      window.location.hash = "";
      setPortal("customer");
      setView("dispatch");
      setHasEnteredApp(false);
      return;
    }

    setHasEnteredApp(false);
  }

  function loginPortal(role, session) {
    setSessions((current) => {
      const next = { ...current, [role]: session };
      window.localStorage.setItem("gasflowSessions", JSON.stringify(next));
      return next;
    });
  }

  function logoutPortal() {
    setSessions((current) => {
      const next = { ...current };
      delete next[portal];
      window.localStorage.setItem("gasflowSessions", JSON.stringify(next));
      return next;
    });
  }

  async function shareWelcomePage() {
    const shareData = {
      title: "GasFlow",
      text: `${t.hero} - ${t.chooseGas}`,
      url: window.location.href
    };
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`;

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setWelcomeNotice(t.shareReady);
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setWelcomeNotice(t.shareCopied);
        return;
      }

      window.location.href = whatsappUrl;
      setWelcomeNotice(t.messageOpened);
    } catch {
      window.location.href = whatsappUrl;
      setWelcomeNotice(t.messageOpened);
    }
  }

  function messageGasFlow() {
    const message = encodeURIComponent(`${t.hero}: ${t.chooseGas} ${window.location.href}`);
    window.location.href = `https://wa.me/?text=${message}`;
    setWelcomeNotice(t.messageOpened);
  }

  function focusDeliveryAddress() {
    setView("dispatch");
    setOrderStep("details");
    window.setTimeout(() => {
      document.querySelector("[name='gasflow-dropoff-location']")?.focus();
    }, 80);
  }

  function goBackFromWelcome() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    setWelcomeNotice(t.noPreviousPage);
  }

  function startRiderGpsShare() {
    if (!trackingOrder || !assignedRider) {
      setRiderGpsStatus({ sharing: false, message: t.noAssignedGpsOrder });
      return;
    }

    setOrders((current) => current.map((order) => (
      order.id === trackingOrder.id && order.status !== "Delivered"
        ? { ...order, status: "On the way", riderConfirmedAtMs: order.riderConfirmedAtMs || Date.now() }
        : order
    )));

    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setRiderGpsStatus({ sharing: false, message: t.locationNeedsHttps });
      return;
    }

    if (!navigator.geolocation) {
      setRiderGpsStatus({ sharing: false, message: t.deviceCannotSendGps });
      return;
    }

    if (gpsWatchId !== null) {
      setRiderGpsStatus({ sharing: true, message: t.gpsAlreadySharing });
      return;
    }

    setRiderGpsStatus({ sharing: false, message: t.waitingRiderLocationPermission });
    const watchId = navigator.geolocation.watchPosition((position) => {
      const nextLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        updatedAtMs: Date.now()
      };

      setRiderLocations((current) => ({
        ...current,
        [trackingOrder.riderId]: nextLocation
      }));
      setOrders((current) => current.map((order) => (
        order.id === trackingOrder.id && order.status !== "Delivered"
          ? { ...order, status: "On the way", riderConfirmedAtMs: order.riderConfirmedAtMs || Date.now() }
          : order
      )));
      setRiderGpsStatus({ sharing: true, message: t.gpsSharingLive });
    }, () => {
      setRiderGpsStatus({ sharing: false, message: t.gpsPermissionDenied });
    }, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    });

    setGpsWatchId(watchId);
  }

  function stopRiderGpsShare() {
    if (gpsWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(gpsWatchId);
    }
    setGpsWatchId(null);
    setRiderGpsStatus({ sharing: false, message: t.gpsSharingStopped });
  }

  function useCustomerCurrentLocation() {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setDispatchMessage({ type: "error", text: t.locationNeedsHttps });
      focusDeliveryAddress();
      return;
    }

    if (!navigator.geolocation) {
      setDispatchMessage({ type: "error", text: t.browserNoLocation });
      focusDeliveryAddress();
      return;
    }

    setIsSubmittingOrder(true);
    setDispatchMessage({ type: "info", text: t.waitingLocationPermission });

    navigator.geolocation.getCurrentPosition((position) => {
      setForm((current) => ({
        ...current,
        address: current.address || t.myCurrentLocation,
        deliveryLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: current.address || t.myCurrentLocation,
          source: "gps"
        }
      }));
      setIsSubmittingOrder(false);
      setDispatchMessage({ type: "success", text: t.currentLocationReady });
    }, () => {
      setIsSubmittingOrder(false);
      setDispatchMessage({ type: "error", text: t.locationPermissionDenied });
      focusDeliveryAddress();
    }, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  }

  function selectAddressSuggestion(place) {
    setForm((current) => ({
      ...current,
      address: place.name,
      deliveryLocation: placeToLocation(place)
    }));
    setMapAddressSuggestions([]);
    setAddressSearchStatus("idle");
    setDispatchMessage({ type: "success", text: `${place.name} ${t.validTanzaniaLocation}` });
  }

  function goToPaymentStep() {
    if (!form.customer.trim()) {
      setDispatchMessage({ type: "error", text: t.enterCustomerName });
      return;
    }

    if (localTanzaniaPhone(form.phone).length !== 9) {
      setDispatchMessage({ type: "error", text: t.enterCustomerPhone });
      return;
    }

    if (!form.address.trim()) {
      setDispatchMessage({ type: "error", text: t.enterDeliveryAddress });
      return;
    }

    if (!form.zone) {
      setDispatchMessage({ type: "error", text: t.fixedZoneRequired });
      return;
    }

    if (!form.cylinder) {
      setDispatchMessage({ type: "error", text: t.chooseGasBeforeOrder });
      return;
    }

    setDispatchMessage({ type: "", text: "" });
    setOrderStep("payment");
  }

  async function placeOrder() {
    if (!form.customer.trim()) {
      setDispatchMessage({ type: "error", text: t.enterCustomerName });
      return;
    }

    if (localTanzaniaPhone(form.phone).length !== 9) {
      setDispatchMessage({ type: "error", text: t.enterCustomerPhone });
      return;
    }

    if (!form.address.trim()) {
      setDispatchMessage({ type: "error", text: t.enterDeliveryAddress });
      return;
    }

    if (!form.zone) {
      setDispatchMessage({ type: "error", text: t.fixedZoneRequired });
      return;
    }

    if (!form.cylinder) {
      setDispatchMessage({ type: "error", text: t.chooseGasBeforeOrder });
      return;
    }

    if (!selectedPayment) {
      setDispatchMessage({ type: "error", text: t.choosePaymentBeforeOrder });
      return;
    }

    const isCashOrder = selectedPayment.id === "cash";
    const paymentPhone = form.paymentPhone.trim() || form.phone.trim();

    if (!isCashOrder && localTanzaniaPhone(paymentPhone).length !== 9) {
      setDispatchMessage({ type: "error", text: `${t.enterPaymentPhone} ${selectedPaymentText.name}.` });
      return;
    }

    setIsSubmittingOrder(true);
    setDispatchMessage({
      type: "info",
      text: isCashOrder
        ? t.findingDeliveryPlace
        : `${t.preparingPayment} ${selectedPaymentText.name}`
    });

    let deliveryLocation = form.deliveryLocation;
    try {
      deliveryLocation = await resolveDeliveryLocation(form.address.trim(), form.zone, deliveryLocation);

      if (!deliveryLocation) {
        setDispatchMessage({
          type: "error",
          text: t.typedPlaceNotFound
        });
        return;
      }
    } catch {
      setDispatchMessage({
        type: "error",
        text: t.mapSearchUnavailableNow
      });
      return;
    } finally {
      setIsSubmittingOrder(false);
    }

    const store = recommendStore(deliveryLocation, form.cylinder, form.quantity);
    const rider = pickRider(store.id);
    const createdAtMs = Date.now();
    const initialEta = deliveryEtaEstimate(store, deliveryLocation, form.quantity);
    const initialEtaMinutes = initialEta.max;
    const earnedPoints = loyaltyPointsFor(total);
    const order = {
      ...form,
      id: `GF-${Math.floor(9000 + Math.random() * 900)}`,
      customer: form.customer.trim(),
      phone: form.phone.trim(),
      zone: form.zone,
      address: form.address.trim(),
      payment: selectedPayment.id,
      paymentStatus: isCashOrder ? t.cashPending : t.qrPayment,
      paymentReference: isCashOrder ? `COD-${Date.now().toString().slice(-5)}` : providerConfirmationReference(selectedPayment.id),
      paymentPhone: isCashOrder ? "" : fullTanzaniaPhone(paymentPhone),
      paymentConfirmedBy: isCashOrder ? t.riderCollection : "My QR",
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
      initialEtaMinMinutes: initialEta.min,
      roadDistanceKm: initialEta.roadKm,
      createdAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
    };
    order.deliveryLat = deliveryLocation.lat;
    order.deliveryLng = deliveryLocation.lng;

    setOrders((current) => [order, ...current]);
    setLoyaltyPoints((current) => current + earnedPoints);
    setForm(emptyOrderForm);
    setOrderStep("details");
    setDispatchMessage({
      type: "success",
      text: isCashOrder
        ? `${order.id} ${t.orderPlacedCash} ${earnedPoints} ${t.loyaltyPointsEarned}`
        : `${order.id} ${t.orderPlacedQr} ${earnedPoints} ${t.loyaltyPointsEarned}`
    });
    notifyCustomer(t.orderPlacedTitle, `${order.id} ${t.orderAssignedTo} ${rider.name}.`);
    setView("tracking");
  }

  function confirmDelivered(orderId) {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: "Delivered",
          paymentStatus: order.payment === "cash" ? t.paid : order.paymentStatus,
          deliveredAt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
        };
      })
    );
    notifyCustomer(t.gasDelivered, t.gasDeliveredBody);
  }

  function updateOrderStatus(orderId, status) {
    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status,
          ...(status === "Delivered"
            ? {
                paymentStatus: order.payment === "cash" ? t.paid : order.paymentStatus,
                deliveredAt: order.deliveredAt || new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date())
              }
            : {}),
          ...(status === "On the way" ? { riderConfirmedAtMs: order.riderConfirmedAtMs || Date.now() } : {})
        };
      })
    );
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
    setOrderStep("details");
    setDispatchMessage({ type: "info", text: t.previousOrderLoaded });
  }

  if (portal === "customer" && !hasEnteredApp) {
    return (
      <main className="welcome-shell">
        <div className="welcome-actions">
          <button className="icon-text-action" type="button" onClick={() => setLanguage((current) => current === "en" ? "sw" : "en")}>
            <Languages size={18} /> {language === "en" ? "SW" : "EN"}
          </button>
          <button className="icon-text-action" type="button" onClick={requestNotifications}>
            <Bell size={18} /> {notificationStatus === "on" ? t.notificationsOn : t.enableNotifications}
          </button>
        </div>

        <section className="welcome-phone">
          <div className="welcome-browser-bar">
            <button type="button" onClick={goBackFromWelcome} aria-label={t.backToDetails}><ArrowLeft size={22} /></button>
            <div>
              <strong>{t.hero}</strong>
              <span>gasflow.app</span>
            </div>
            <button type="button" onClick={shareWelcomePage} aria-label={t.share}><Share2 size={20} /></button>
          </div>

          <div className="welcome-site-bar">
            <strong>GasFlow</strong>
            <button className="use-app-button" type="button" onClick={enterApp}>
              {t.useApp}
            </button>
          </div>

          <div className="welcome-author-row">
            <span className="welcome-mini-logo"><Flame size={16} /></span>
            <div>
              <strong>{t.hero}</strong>
              <span>{t.eyebrow}</span>
            </div>
            <button type="button" onClick={messageGasFlow} aria-label={t.message}><MessageCircle size={18} /></button>
          </div>

          <img className="welcome-image" src="https://chatgpt.com/backend-api/estuary/public_content/enc/eyJpZCI6Im1fNmE1OTcxMjVjMjljODE5MTkwZGE1NzA5ZGMxMzc3Yzk6c2VkaW1lbnQ6Ly8xMWNkZmRlYzAyODQ3YjAjZmlsZV8wMDAwMDAwMGNmYzA3MjQzOGE1NGIyMjNhNjM1MGY1NyN1bmZ1cmwiLCJnaXptb19pZCI6bnVsbCwidHMiOiIyMDY1MSIsInAiOiJweWkiLCJjaWQiOiIxIiwic2lnIjoiYmIzNDRmMzNhM2NjMmZiMTM5MjdjZmViMDY0NGQxODM3MjRlYzM4YzM5NjQwMWNhODQ2MWU0MzA5YWI4MjkyYyIsInYiOiIwIiwiY3MiOm51bGwsImNkbiI6bnVsbCwiZm4iOm51bGwsImNkIjpudWxsLCJjcCI6bnVsbCwibWEiOm51bGx9" alt="" />

          <div className="welcome-article-copy">
            <h1>{t.welcomeArticleTitle}</h1>
            <p>
              {t.welcomeArticleBefore} <strong>{t.hero}</strong> {t.welcomeArticleAfter}
            </p>
          </div>

          {welcomeNotice && <p className="welcome-notice">{welcomeNotice}</p>}

          <button className="welcome-floating-proceed" type="button" onClick={enterApp} aria-label={t.proceed}>
            <CheckCircle2 size={22} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={`app-shell${view === "tracking" ? " tracking-shell" : ""}`}>
      <header className="topbar">
        <button className="round-action app-back-action" type="button" onClick={returnToCustomerApp} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="brand-mark"><Flame size={26} /></div>
        <div className="hero-copy">
          <p className="eyebrow">{portalEyebrow}</p>
          <h1>{portalTitle}</h1>
        </div>
        {portal === "customer" && <div className="top-actions">
          <div className="customer-app-card">
            <Gift size={20} />
            <span>{t.loyalty}</span>
            <strong>{loyaltyPoints}</strong>
          </div>
        </div>}
        {portal !== "customer" && activeSession && (
          <div className="top-actions">
            <button className="icon-text-action" type="button" onClick={logoutPortal}>
              <LogOut size={17} /> Logout
            </button>
          </div>
        )}
      </header>

      {portal !== "customer" && !activeSession && (
        <RoleLogin role={portal} onLogin={loginPortal} />
      )}

      {(portal === "customer" || activeSession) && visibleViews.length > 1 && (
        <nav className="view-tabs" aria-label="Main views">
          {visibleViews.map(([id, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                if (id === "dispatch") setOrderStep("details");
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {portal === "customer" && view === "dispatch" && (
        <DispatchPage>
          <div className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{orderStep === "details" ? t.orderDetails : t.paymentConfirmation}</p>
                <h2>{orderStep === "details" ? t.chooseGas : t.choosePayment}</h2>
              </div>
              <span className="status-pill">
                <Clock3 size={16} />
                {canMatchStore ? t.deliveryMatchReady : hasMappedDeliveryPlace && !hasDeliveryZone ? t.chooseDeliveryZone : hasMappedDeliveryPlace ? t.chooseGasType : t.waitingForLocation}
              </span>
            </div>

            <div className="checkout-steps" aria-label="Order steps">
              <span className="active">{t.orderDetails}</span>
              <span className={orderStep === "payment" ? "active" : ""}>{t.paymentConfirmation}</span>
            </div>

            {orderStep === "details" && (
            <>
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
                {addressSuggestions.length > 0 && !form.deliveryLocation && (
                  <div className="place-suggestions">
                    {addressSuggestions.map((place) => (
                      <button type="button" key={place.id || place.name} onClick={() => selectAddressSuggestion(place)}>
                        <MapPin size={17} />
                        <span>
                          <strong>{place.name}</strong>
                          <small>{place.area}</small>
                        </span>
                        <em>{place.source === "geocoded" ? t.map : place.zone}</em>
                      </button>
                    ))}
                  </div>
                )}
                {addressSearchStatus === "empty" && !form.deliveryLocation && (
                  <small className="map-search-note">{t.noTanzaniaMapMatch}</small>
                )}
                {addressSearchStatus === "fallback" && addressSuggestions.length > 0 && !form.deliveryLocation && (
                  <small className="map-search-note">{t.onlineMapUnavailable}</small>
                )}
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

            <div className="checkout-row">
              <div>
                <span>{t.total}</span>
                <strong>{money(total)}</strong>
                {discount > 0 && <small>{t.saved} {money(discount)}</small>}
              </div>
              <button className="primary-action" type="button" onClick={goToPaymentStep}>
                <Send size={18} /> {t.continueToPayment}
              </button>
            </div>
            </>
            )}

            {orderStep === "payment" && (
            <>
            <div className="payment-panel">
              <div className="payment-heading">
                <div>
                  <p className="eyebrow">{t.paymentConfirmation}</p>
                  <h3>{t.choosePayment}</h3>
                </div>
                <WalletCards size={22} />
              </div>
              <div className="payment-options">
                {paymentMethods.map((method) => {
                  const methodText = paymentDisplay(method, t);
                  return (
                  <button
                    className={form.payment === method.id ? "payment-option active" : "payment-option"}
                    key={method.id}
                    onClick={() => updateForm("payment", method.id)}
                    type="button"
                  >
                    <strong>{methodText.name}</strong>
                    <span>{method.id === "cash" ? t.collectOnDelivery : t.paidBeforeDispatch}</span>
                  </button>
                );})}
              </div>
              <div className="payment-detail">
                {selectedPaymentText ? (
                  <>
                    <div>
                      <span>{selectedPaymentText.accountLabel}</span>
                      <strong>{selectedPaymentText.accountValue}</strong>
                    </div>
                    <p>{selectedPaymentText.instruction}</p>
                  </>
                ) : (
                  <p>{t.choosePaymentMethod}</p>
                )}
              </div>
              {selectedPayment && selectedPayment.id !== "cash" && (
                <div className="payment-fields">
                  <label>
                    {t.paymentPhone}
                    <TanzaniaPhoneInput value={form.paymentPhone || form.phone} onChange={(value) => updateForm("paymentPhone", value)} />
                  </label>
                  <div className="qr-hint-card">
                    <QrCode size={18} />
                    <span>{t.scanQrHint}</span>
                  </div>
                </div>
              )}
              {selectedPayment && selectedPayment.id !== "cash" && (
                <PaymentQrCard method={selectedPayment} />
              )}
              {selectedPayment?.id === "cash" && (
                <div className="cash-warning">
                  <AlertTriangle size={18} />
                  <span>{t.cashDeliveryHint}</span>
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
                  <span>{activePromo ? `${activePromo.label} ${t.promoApplied}` : t.promoOptional}</span>
                </div>
              </div>
            </div>

            {isOrderSummaryReady && (
              <div className="order-summary-panel">
                <div className="payment-heading">
                  <div>
                    <p className="eyebrow">{t.orderSummary}</p>
                    <h3>{gasLabel(selectedCylinder, language)}</h3>
                  </div>
                  <Receipt size={22} />
                </div>
                <div className="summary-lines">
                  <div>
                    <span>{t.gasSize}</span>
                    <strong>{form.quantity} x {gasLabel(selectedCylinder, language)}</strong>
                  </div>
                  <div>
                    <span>{t.depot}</span>
                    <strong>{bestStore.name}</strong>
                  </div>
                  <div>
                    <span>{t.payment}</span>
                    <strong>{selectedPaymentText.name}</strong>
                  </div>
                  <div>
                    <span>{t.subtotal}</span>
                    <strong>{money(subtotal)}</strong>
                  </div>
                  <div>
                    <span>{t.discount}</span>
                    <strong>{discount > 0 ? `-${money(discount)}` : money(0)}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="checkout-row">
              <div>
                <span>{t.total}</span>
                <strong>{money(total)}</strong>
                {discount > 0 && <small>{t.saved} {money(discount)}</small>}
              </div>
              <button className="ghost-action" type="button" onClick={() => setOrderStep("details")}>
                {t.backToDetails}
              </button>
              <button className="primary-action" onClick={placeOrder} disabled={isSubmittingOrder}>
                <Send size={18} /> {isSubmittingOrder ? t.findingMap : t.placeOrder}
              </button>
            </div>
            </>
            )}
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
                <h2>{hasMappedDeliveryPlace && !hasDeliveryZone ? t.chooseDeliveryZone : hasMappedDeliveryPlace ? t.chooseGasType : t.noDeliveryPoint}</h2>
                  <p>{hasMappedDeliveryPlace && !hasDeliveryZone ? t.fixedZoneInstruction : hasMappedDeliveryPlace ? t.selectGasInstruction : t.tapLocationInstruction}</p>
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
                <RoutePreviewMap store={bestStore} destination={formDestination} quantity={form.quantity} />
                <div className="eta-number">
                  <strong>{etaRangeText(bestStore, formDestination, form.quantity)}</strong>
                  <span>{distanceText(deliveryEtaEstimate(bestStore, formDestination, form.quantity).roadKm)} {t.distanceBasedEta}</span>
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
        </DispatchPage>
      )}

      {portal === "customer" && view === "tracking" && (
        <TrackingPage>
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
        </TrackingPage>
      )}

      {portal === "rider" && activeSession && view === "rider" && (
        <RiderGpsPage>
          {!trackingOrder && (
            <div className="panel rider-empty-panel">
              <div className="empty-state">
                <Truck size={28} /> {t.placeOrderFirstGps}
              </div>
            </div>
          )}

          {trackingOrder && (
            <div className="rider-app-layout">
              <section className="panel rider-job-card">
                <div className="rider-job-top">
                  <div>
                    <p className="eyebrow">Active delivery</p>
                    <h2>{trackingOrder.id}</h2>
                    <span>{trackingOrder.status}</span>
                  </div>
                  <strong>{etaRangeText(stores.find((item) => item.id === trackingOrder.storeId) || stores[0], orderDestination(trackingOrder), trackingOrder.quantity || 1)}</strong>
                </div>
                <div className="rider-job-route">
                  <div>
                    <Store size={18} />
                    <span>{stores.find((item) => item.id === trackingOrder.storeId)?.name || t.depot}</span>
                  </div>
                  <Route size={18} />
                  <div>
                    <MapPin size={18} />
                    <span>{trackingOrder.address}, {trackingOrder.zone}</span>
                  </div>
                </div>
              </section>

              <section className="panel rider-customer-card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Customer</p>
                    <h2>{trackingOrder.customer}</h2>
                  </div>
                  <span className="status-pill">{paymentDisplay(getPaymentMethod(trackingOrder.payment), t).name}</span>
                </div>
                <div className="rider-info-list">
                  <div><span>Phone</span><strong>{trackingOrder.phone}</strong></div>
                  <div><span>Gas</span><strong>{trackingOrder.quantity} x {gasLabel(cylinderTypes.find((item) => item.id === trackingOrder.cylinder), language)}</strong></div>
                  <div><span>Payment</span><strong>{trackingOrder.paymentStatus} - {money(trackingOrder.total || 0)}</strong></div>
                  <div><span>Notes</span><strong>{trackingOrder.notes || "No notes"}</strong></div>
                </div>
                <div className="rider-contact-actions">
                  <a className="ghost-action" href={`tel:${trackingOrder.phone}`}><Phone size={17} /> Call</a>
                  <a className="ghost-action" href={`sms:${trackingOrder.phone}`}><MessageCircle size={17} /> Message</a>
                </div>
              </section>

              <section className="panel rider-gps-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{t.riderLocationSender}</p>
                    <h2>{assignedRider?.name || t.assignedRider}</h2>
                  </div>
                  <span className={riderGpsStatus.sharing ? "status-pill gps-live" : "status-pill"}>
                    <MapPin size={16} />
                    {riderGpsStatus.sharing ? t.gpsLive : t.gpsOff}
                  </span>
                </div>
                <div className="rider-gps-grid">
                  <div><span>{t.vehicle}</span><strong>{assignedRider?.vehicle || t.vehicle}</strong></div>
                  <div><span>{t.lastGps}</span><strong>{activeRiderLocation ? `${activeRiderLocation.lat.toFixed(5)}, ${activeRiderLocation.lng.toFixed(5)}` : t.notSentYet}</strong></div>
                  <div><span>{t.accuracy}</span><strong>{activeRiderLocation?.accuracy ? `${Math.round(activeRiderLocation.accuracy)} m` : t.waiting}</strong></div>
                  <div><span>{t.updated}</span><strong>{activeRiderLocation?.updatedAtMs ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(activeRiderLocation.updatedAtMs)) : t.waiting}</strong></div>
                </div>
                <div className="rider-gps-actions">
                  <button className="primary-action" type="button" onClick={startRiderGpsShare} disabled={riderGpsStatus.sharing}>
                    <MapPin size={17} /> {t.startGpsSharing}
                  </button>
                  <button className="ghost-action" type="button" onClick={stopRiderGpsShare} disabled={!riderGpsStatus.sharing}>
                    <AlertTriangle size={17} /> {t.stopGps}
                  </button>
                  <button className="primary-action" type="button" onClick={() => confirmDelivered(trackingOrder.id)}>
                    <CheckCircle2 size={17} /> {t.confirmDelivered}
                  </button>
                </div>
                {riderGpsStatus.message && (
                  <div className={`dispatch-feedback ${riderGpsStatus.sharing ? "success" : "info"}`}>
                    <MapPin size={18} />
                    <span>{riderGpsStatus.message}</span>
                  </div>
                )}
              </section>
            </div>
          )}
        </RiderGpsPage>
      )}

      {portal === "admin" && activeSession && view === "admin" && (
        <AdminDashboard
          orders={orders}
          riders={riders}
          stores={stores}
          language={language}
          onStatusChange={updateOrderStatus}
        />
      )}
    </main>
  );
}

function RoleLogin({ role, onLogin }) {
  const config = roleCredentials[role];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    const cleanUsername = username.trim();
    const normalizedUsername = cleanUsername.toLowerCase();

    if (!normalizedUsername.endsWith(STAFF_EMAIL_DOMAIN)) {
      setError(`Use your ${STAFF_EMAIL_DOMAIN} email.`);
      return;
    }

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email: normalizedUsername,
          password
        })
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed.");
        return;
      }

      onLogin(role, {
        role: result.user.role,
        username: result.user.email,
        token: result.token,
        expiresAtMs: Date.now() + (result.expiresIn * 1000),
        signedInAtMs: Date.now()
      });
    } catch {
      setError("Cannot reach the backend server. Start it with npm run server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="workspace auth-workspace">
      <form className="panel auth-card" onSubmit={submitLogin}>
        <span className="auth-lock"><Lock size={24} /></span>
        <div>
          <p className="eyebrow">{config.label} access</p>
          <h2>Sign in to continue</h2>
        </div>
        <label>
          {config.usernameLabel}
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={config.username} />
        </label>
        <label>
          {config.passwordLabel}
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Your password" />
        </label>
        {error && <div className="dispatch-feedback error"><AlertTriangle size={18} /><span>{error}</span></div>}
        <button className="primary-action" type="submit" disabled={isLoading}>
          <Lock size={17} /> {isLoading ? "Checking..." : "Login"}
        </button>
        <p className="auth-note">
          Staff access is checked by the backend. Use a {STAFF_EMAIL_DOMAIN} email.
        </p>
      </form>
    </section>
  );
}

function AdminDashboard({ orders, riders, stores, language, onStatusChange }) {
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const pageSize = 8;
  const activeOrders = orders.filter((order) => order.status !== "Delivered");
  const deliveredOrders = orders.filter((order) => order.status === "Delivered");
  const revenue = orders.reduce((total, order) => total + (order.total || 0), 0);
  const pendingCash = orders.filter((order) => order.payment === "cash" && order.status !== "Delivered").reduce((total, order) => total + (order.total || 0), 0);
  const totalStock = stores.reduce((total, store) => total + Object.values(store.stock).reduce((sum, count) => sum + count, 0), 0);
  const riderLoad = riders.map((rider) => ({ ...rider, activeOrders: activeOrders.filter((order) => order.riderId === rider.id).length }));
  const customerRecords = Array.from(new Map(orders.map((order) => [order.phone || order.customer || order.id, order])).values());
  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return orders.filter((order) => {
      const searchable = [order.id, order.customer, order.phone, order.address, order.zone, order.paymentStatus].join(" ").toLowerCase();
      return (!search || searchable.includes(search))
        && (statusFilter === "all" || order.status === statusFilter)
        && (zoneFilter === "all" || order.zone === zoneFilter);
    });
  }, [orders, query, statusFilter, zoneFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || pagedOrders[0] || orders[0] || null;
  const statusCounts = deliveryStages.reduce((counts, stage) => ({ ...counts, [stage]: orders.filter((order) => order.status === stage).length }), {});
  const zoneCounts = zones.map((zone) => ({
    zone,
    orders: orders.filter((order) => order.zone === zone).length,
    revenue: orders.filter((order) => order.zone === zone).reduce((total, order) => total + (order.total || 0), 0)
  })).sort((a, b) => b.orders - a.orders);
  const sections = ["overview", "orders", "inventory", "riders", "payments", "customers", "reports"];

  function resetPage() {
    setPage(1);
  }

  return (
    <section className="workspace admin-workspace admin-console">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin console</h2>
        </div>
        <span className="status-pill"><Clock3 size={16} /> {activeOrders.length} active</span>
      </div>

      <nav className="admin-section-tabs" aria-label="Admin sections">
        {sections.map((item) => (
          <button className={section === item ? "active" : ""} type="button" key={item} onClick={() => setSection(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>

      <div className="admin-command-grid">
        <aside className="panel admin-kpi-rail">
          <div className="admin-kpi-card featured"><PackageCheck size={20} /><span>Orders</span><strong>{orders.length}</strong><small>{deliveredOrders.length} delivered</small></div>
          <div className="admin-kpi-card"><TrendingUp size={20} /><span>Revenue</span><strong>{money(revenue)}</strong><small>{money(pendingCash)} cash pending</small></div>
          <div className="admin-kpi-card"><Store size={20} /><span>Stock</span><strong>{totalStock}</strong><small>{stores.length} stores online</small></div>
          <div className="admin-kpi-card"><Users size={20} /><span>Riders</span><strong>{riders.length}</strong><small>{riderLoad.filter((rider) => rider.activeOrders > 0).length} assigned</small></div>
        </aside>

        {section === "overview" && (
          <div className="admin-overview-grid">
            <div className="panel admin-compact-panel">
              <div className="section-heading"><div><p className="eyebrow">Today</p><h2>Operations snapshot</h2></div></div>
              <div className="admin-metric-grid">
                {deliveryStages.slice(1).map((stage) => <div className="admin-metric-cell" key={stage}><span>{stage}</span><strong>{statusCounts[stage] || 0}</strong></div>)}
              </div>
            </div>
            <div className="panel admin-compact-panel">
              <div className="section-heading"><div><p className="eyebrow">Exceptions</p><h2>Needs attention</h2></div></div>
              <div className="admin-alert-list">
                <div><AlertTriangle size={17} /><span>{activeOrders.filter((order) => !order.riderId).length} unassigned orders</span></div>
                <div><WalletCards size={17} /><span>{money(pendingCash)} cash pending</span></div>
                <div><Store size={17} /><span>{stores.filter((store) => Object.values(store.stock).reduce((sum, count) => sum + count, 0) < 25).length} low stock stores</span></div>
              </div>
            </div>
            <div className="panel admin-orders-panel admin-overview-orders">
              <div className="section-heading"><div><p className="eyebrow">Newest</p><h2>Recent orders</h2></div></div>
              <AdminOrderTable orders={orders.slice(0, 5)} riders={riders} stores={stores} language={language} selectedOrderId={selectedOrder?.id} onSelectOrder={setSelectedOrderId} onStatusChange={onStatusChange} />
            </div>
          </div>
        )}

        {section === "orders" && (
          <div className="admin-orders-layout">
            <div className="panel admin-orders-panel">
              <div className="section-heading"><div><p className="eyebrow">Live queue</p><h2>Orders</h2></div></div>
              <div className="admin-toolbar">
                <input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Search order, customer, phone, address" />
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resetPage(); }}>
                  <option value="all">All statuses</option>
                  {deliveryStages.slice(1).map((stage) => <option value={stage} key={stage}>{stage}</option>)}
                </select>
                <select value={zoneFilter} onChange={(event) => { setZoneFilter(event.target.value); resetPage(); }}>
                  <option value="all">All zones</option>
                  {zones.map((zone) => <option value={zone} key={zone}>{zone}</option>)}
                </select>
              </div>
              <AdminOrderTable orders={pagedOrders} riders={riders} stores={stores} language={language} selectedOrderId={selectedOrder?.id} onSelectOrder={setSelectedOrderId} onStatusChange={onStatusChange} />
              <div className="admin-pagination">
                <span>{filteredOrders.length} results</span>
                <div><button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</button><strong>{safePage} / {pageCount}</strong><button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button></div>
              </div>
            </div>
            <AdminOrderDetail order={selectedOrder} riders={riders} stores={stores} language={language} onStatusChange={onStatusChange} />
          </div>
        )}

        {section === "inventory" && <AdminInventory stores={stores} />}
        {section === "riders" && <AdminRiders riders={riderLoad} stores={stores} />}
        {section === "payments" && <AdminPayments orders={orders} riders={riders} stores={stores} language={language} selectedOrderId={selectedOrder?.id} onSelectOrder={setSelectedOrderId} onStatusChange={onStatusChange} revenue={revenue} pendingCash={pendingCash} />}
        {section === "customers" && <AdminCustomers customers={customerRecords} orders={orders} />}
        {section === "reports" && <AdminReports statusCounts={statusCounts} zoneCounts={zoneCounts} />}
      </div>
    </section>
  );
}

function AdminOrderTable({ orders, riders, stores, language, selectedOrderId, onSelectOrder, onStatusChange }) {
  if (orders.length === 0) return <div className="empty-state"><PackageCheck size={28} /> No matching orders</div>;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-order-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Store / rider</th><th>Payment</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map((order) => {
            const cylinder = cylinderTypes.find((item) => item.id === order.cylinder);
            const rider = riders.find((item) => item.id === order.riderId);
            const store = stores.find((item) => item.id === order.storeId);
            return (
              <tr className={selectedOrderId === order.id ? "selected" : ""} key={order.id} onClick={() => onSelectOrder(order.id)}>
                <td><strong>{order.id}</strong><span>{cylinder ? `${order.quantity} x ${gasLabel(cylinder, language)}` : "Gas order"}</span></td>
                <td><strong>{order.customer || "Customer"}</strong><span>{order.phone || "No phone"}</span></td>
                <td><strong>{order.zone || "No zone"}</strong><span>{order.address || "No address"}</span></td>
                <td><strong>{store?.name || "Store pending"}</strong><span>{rider?.name || "Rider pending"}</span></td>
                <td><strong>{money(order.total || 0)}</strong><span>{order.paymentStatus || "Payment pending"}</span></td>
                <td><select value={order.status} onClick={(event) => event.stopPropagation()} onChange={(event) => onStatusChange(order.id, event.target.value)}>{deliveryStages.slice(1).map((stage) => <option value={stage} key={stage}>{stage}</option>)}</select></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminOrderDetail({ order, riders, stores, language, onStatusChange }) {
  if (!order) return <aside className="panel admin-detail-panel"><div className="empty-state"><Receipt size={28} /> Select an order</div></aside>;
  const rider = riders.find((item) => item.id === order.riderId);
  const store = stores.find((item) => item.id === order.storeId);
  const cylinder = cylinderTypes.find((item) => item.id === order.cylinder);
  return (
    <aside className="panel admin-detail-panel">
      <div className="section-heading"><div><p className="eyebrow">{order.id}</p><h2>{order.customer || "Customer"}</h2></div><span className="status-pill">{order.status}</span></div>
      <div className="admin-detail-list">
        <div><span>Phone</span><strong>{order.phone || "No phone"}</strong></div>
        <div><span>Delivery</span><strong>{order.address || "No address"}, {order.zone || "No zone"}</strong></div>
        <div><span>Gas</span><strong>{cylinder ? `${order.quantity} x ${gasLabel(cylinder, language)}` : "Gas order"}</strong></div>
        <div><span>Store</span><strong>{store?.name || "Store pending"}</strong></div>
        <div><span>Rider</span><strong>{rider?.name || "Rider pending"}</strong></div>
        <div><span>Payment</span><strong>{order.paymentStatus || "Payment pending"} - {money(order.total || 0)}</strong></div>
      </div>
      <div className="admin-status-actions">{deliveryStages.slice(1).map((stage) => <button className={order.status === stage ? "active" : ""} type="button" key={stage} onClick={() => onStatusChange(order.id, stage)}>{stage}</button>)}</div>
    </aside>
  );
}

function AdminInventory({ stores }) {
  return (
    <div className="panel admin-compact-panel">
      <div className="section-heading"><div><p className="eyebrow">Inventory</p><h2>Store stock</h2></div></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Store</th><th>Zone</th><th>Riders</th><th>Total stock</th><th>Lowest item</th></tr></thead>
          <tbody>
            {stores.map((store) => {
              const stockEntries = Object.entries(store.stock);
              const stockCount = stockEntries.reduce((total, [, count]) => total + count, 0);
              const lowItem = [...stockEntries].sort((a, b) => a[1] - b[1])[0];
              return <tr key={store.id}><td>{store.name}</td><td>{store.zone}</td><td>{store.riders}</td><td>{stockCount}</td><td>{lowItem ? `${lowItem[0]} (${lowItem[1]})` : "Ready"}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRiders({ riders, stores }) {
  return (
    <div className="panel admin-compact-panel">
      <div className="section-heading"><div><p className="eyebrow">Fleet</p><h2>Riders</h2></div></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Rider</th><th>Vehicle</th><th>Phone</th><th>Store</th><th>Active</th></tr></thead>
          <tbody>
            {riders.map((rider) => <tr key={rider.id}><td>{rider.name}</td><td>{rider.vehicle}</td><td>{rider.phone}</td><td>{stores.find((store) => store.id === rider.storeId)?.name || "Unassigned"}</td><td>{rider.activeOrders}</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminPayments({ orders, riders, stores, language, selectedOrderId, onSelectOrder, onStatusChange, revenue, pendingCash }) {
  return (
    <div className="panel admin-compact-panel">
      <div className="section-heading"><div><p className="eyebrow">Payments</p><h2>Collections</h2></div></div>
      <div className="admin-metric-grid">
        <div className="admin-metric-cell"><span>Total revenue</span><strong>{money(revenue)}</strong></div>
        <div className="admin-metric-cell"><span>Cash pending</span><strong>{money(pendingCash)}</strong></div>
        <div className="admin-metric-cell"><span>Paid orders</span><strong>{orders.filter((order) => order.payment !== "cash" || order.status === "Delivered").length}</strong></div>
      </div>
      <AdminOrderTable orders={orders.filter((order) => order.payment === "cash" || order.paymentStatus)} riders={riders} stores={stores} language={language} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} onStatusChange={onStatusChange} />
    </div>
  );
}

function AdminCustomers({ customers, orders }) {
  return (
    <div className="panel admin-compact-panel">
      <div className="section-heading"><div><p className="eyebrow">Customers</p><h2>Customer records</h2></div></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Zone</th><th>Orders</th><th>Total spent</th></tr></thead>
          <tbody>
            {customers.map((customer) => {
              const key = customer.phone || customer.customer || customer.id;
              const customerOrders = orders.filter((order) => (order.phone || order.customer || order.id) === key);
              return <tr key={key}><td>{customer.customer || "Customer"}</td><td>{customer.phone || "No phone"}</td><td>{customer.zone || "No zone"}</td><td>{customerOrders.length}</td><td>{money(customerOrders.reduce((total, order) => total + (order.total || 0), 0))}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminReports({ statusCounts, zoneCounts }) {
  return (
    <div className="admin-overview-grid">
      <div className="panel admin-compact-panel">
        <div className="section-heading"><div><p className="eyebrow">Status mix</p><h2>Pipeline</h2></div></div>
        <div className="admin-store-list">
          {deliveryStages.slice(1).map((stage) => <div className="admin-store-row" key={stage}><div><strong>{stage}</strong><span>Orders in stage</span></div><b>{statusCounts[stage] || 0}</b></div>)}
        </div>
      </div>
      <div className="panel admin-compact-panel">
        <div className="section-heading"><div><p className="eyebrow">Zones</p><h2>Demand by area</h2></div></div>
        <div className="admin-store-list">
          {zoneCounts.slice(0, 6).map((item) => <div className="admin-store-row" key={item.zone}><div><strong>{item.zone}</strong><span>{money(item.revenue)}</span></div><b>{item.orders}</b></div>)}
        </div>
      </div>
    </div>
  );
}

function routeProgressLocation(routeLocations, progress) {
  if (routeLocations.length < 2) return { location: null, passedLocations: [] };
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segments = routeLocations.slice(1).map((location, index) => ({
    from: routeLocations[index],
    to: location,
    distance: distanceKm(routeLocations[index], location)
  }));
  const totalDistance = segments.reduce((total, segment) => total + segment.distance, 0);
  if (!totalDistance) return { location: routeLocations[0], passedLocations: [routeLocations[0]] };

  let travelled = totalDistance * clampedProgress;
  const passedLocations = [routeLocations[0]];

  for (const segment of segments) {
    if (travelled > segment.distance) {
      travelled -= segment.distance;
      passedLocations.push(segment.to);
      continue;
    }

    const segmentProgress = segment.distance ? travelled / segment.distance : 0;
    const location = {
      lat: segment.from.lat + (segment.to.lat - segment.from.lat) * segmentProgress,
      lng: segment.from.lng + (segment.to.lng - segment.from.lng) * segmentProgress
    };
    passedLocations.push(location);
    return { location, passedLocations };
  }

  return {
    location: routeLocations[routeLocations.length - 1],
    passedLocations: routeLocations
  };
}

function LeafletTrackingMap({ store, destination, riderLocation, routeLocations, passedRouteLocations = [], etaDisplay, t }) {
  const mapElementRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapElementRef.current || mapInstanceRef.current) return;
        const center = [(store.lat + destination.lat) / 2, (store.lng + destination.lng) / 2];
        mapInstanceRef.current = L.map(mapElementRef.current, {
          attributionControl: false,
          zoomControl: false
        }).setView(center, 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: ""
        }).addTo(mapInstanceRef.current);
        setIsReady(true);
      })
      .catch(() => setIsReady(false));

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination.lat, destination.lng, store.lat, store.lng]);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!isReady || !L || !map) return;

    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    const routeLatLngs = routeLocations.map((location) => [location.lat, location.lng]);
    const fitPoints = routeLatLngs.length > 1
      ? [...routeLatLngs]
      : [[store.lat, store.lng], [destination.lat, destination.lng]];

    if (routeLatLngs.length > 1) {
      layersRef.current.push(
        L.polyline(routeLatLngs, {
          color: "#ffffff",
          opacity: 0.95,
          weight: 11,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map)
      );
      layersRef.current.push(
        L.polyline(routeLatLngs, {
          color: "#166534",
          opacity: 1,
          weight: 7,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map)
      );
    }

    const passedLatLngs = passedRouteLocations.map((location) => [location.lat, location.lng]);
    if (passedLatLngs.length > 1) {
      layersRef.current.push(
        L.polyline(passedLatLngs, {
          color: "#2563eb",
          opacity: 1,
          weight: 6,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map)
      );
    }

    layersRef.current.push(
      L.circleMarker([store.lat, store.lng], {
        color: "#ffffff",
        fillColor: "#166534",
        fillOpacity: 1,
        radius: 9,
        weight: 4
      }).addTo(map)
    );
    layersRef.current.push(
      L.circleMarker([destination.lat, destination.lng], {
        color: "#ffffff",
        fillColor: "#111827",
        fillOpacity: 1,
        radius: 9,
        weight: 4
      }).addTo(map)
    );

    if (riderLocation) {
      layersRef.current.push(
        L.circleMarker([riderLocation.lat, riderLocation.lng], {
          color: "#ffffff",
          fillColor: "#2563eb",
          fillOpacity: 1,
          radius: 9,
          weight: 4
        }).addTo(map)
      );
      fitPoints.push([riderLocation.lat, riderLocation.lng]);
    }

    layersRef.current.push(
      L.marker([store.lat, store.lng], {
        icon: L.divIcon({
          className: "leaflet-stop-label leaflet-pickup-label",
          html: `<span>${t.pickup}</span><strong>1 min</strong>`
        })
      }).addTo(map)
    );
    layersRef.current.push(
      L.marker([destination.lat, destination.lng], {
        icon: L.divIcon({
          className: "leaflet-stop-label leaflet-dropoff-label",
          html: `<span>${t.dropoff}</span><strong>${etaDisplay}</strong>`
        })
      }).addTo(map)
    );

    map.fitBounds(L.latLngBounds(fitPoints), {
      animate: false,
      paddingTopLeft: [48, 86],
      paddingBottomRight: [48, 48],
      maxZoom: 15
    });
    window.setTimeout(() => map.invalidateSize(), 0);
  }, [destination.lat, destination.lng, etaDisplay, isReady, passedRouteLocations, riderLocation, routeLocations, store.lat, store.lng, store.zone, t.dropoff, t.pickup]);

  return (
    <>
      <div className="bolt-route-bar">
        <button className="route-bar-icon" type="button" aria-label="Close route">
          <X size={23} />
        </button>
        <span>{store.name}</span>
        <ArrowRight size={18} />
        <strong>{destination.label}</strong>
        <button className="route-bar-icon" type="button" aria-label="Add stop">
          <Plus size={25} />
        </button>
      </div>
      <div className="leaflet-tracking-map" ref={mapElementRef} />
    </>
  );
}

function LiveMap({ order, riderLocation, nowMs, language, t, onConfirmDelivered, onRate, onReorder }) {
  const store = stores.find((item) => item.id === order.storeId) || stores[0];
  const rider = riders.find((item) => item.id === order.riderId) || riders[0];
  const cylinder = cylinderTypes.find((item) => item.id === order.cylinder);
  const payment = getPaymentMethod(order.payment);
  const paymentText = paymentDisplay(payment, t);
  const destination = orderDestination(order);
  const hasLiveGps = Boolean(riderLocation);
  const [routeState, setRouteState] = useState({ locations: [], distanceKm: null, status: "loading" });
  const routeStart = store;
  const hasRoadRoute = routeState.status === "ready" && routeState.locations.length > 2;
  const savedRoadDistanceKm = order.roadDistanceKm || roadDistanceKm(store, destination);
  const etaRangeDisplay = order.initialEtaMinMinutes && order.initialEtaMinutes
    ? `${order.initialEtaMinMinutes}-${order.initialEtaMinutes} min`
    : etaRangeText(store, destination, order.quantity || 1);
  const etaSeconds = hasLiveGps ? remainingEtaSeconds(order, riderLocation, destination, nowMs) : null;
  const etaDisplay = order.status === "Delivered" ? "Delivered" : hasLiveGps ? etaText(etaSeconds) : etaRangeDisplay;
  const displayedRouteDistanceKm = routeState.distanceKm || savedRoadDistanceKm;
  const etaSourceLabel = hasLiveGps ? t.riderGpsActive : t.waitingForRiderGpsLower;
  const etaLabel = etaDisplay;
  const isRiderOnWay = order.status === "On the way";
  const statusTitle = order.status === "Delivered" ? t.gasDelivered : (hasLiveGps || isRiderOnWay) ? t.yourGasOnWay : t.waitingForRiderGps;
  const trackingNote = order.status === "Delivered"
    ? t.deliveryCompleted
    : hasLiveGps || isRiderOnWay
      ? t.riderLocationUpdating
      : t.gpsPendingRouteNote;
  const riderInitials = rider.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
  const shouldShowRouteProgress = hasRoadRoute && (hasLiveGps || order.status === "On the way" || order.status === "Delivered");
  const routeProgress = order.status === "Delivered"
    ? 1
    : order.status === "On the way" && order.initialEtaMinutes
      ? Math.min(0.95, Math.max(0.08, (nowMs - (order.riderConfirmedAtMs || order.createdAtMs || nowMs)) / (order.initialEtaMinutes * 60 * 1000)))
      : 0;
  const routeProgressView = shouldShowRouteProgress
    ? routeProgressLocation(routeState.locations, hasLiveGps ? routeProgress || 0.1 : routeProgress)
    : { location: null, passedLocations: [] };
  const displayedRiderLocation = hasLiveGps ? riderLocation : routeProgressView.location;

  useEffect(() => {
    const controller = new AbortController();
    setRouteState((current) => ({ ...current, status: "loading" }));

    fetch(routeApiUrl(routeStart, destination), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Route unavailable");
        return response.json();
      })
      .then((data) => {
        const route = [...(data.routes || [])]
          .map((item) => ({ route: item, locations: routeCoordinatesToLocations(item) }))
          .filter((item) => isZanzibarRoadRoute(item.locations, routeStart, destination))
          .sort((a, b) => (a.route.distance || Infinity) - (b.route.distance || Infinity))[0];
        const locations = route?.locations || [];
        setRouteState({
          locations: locations.length > 1 ? locations : [routeStart, destination],
          distanceKm: route?.route?.distance ? route.route.distance / 1000 : null,
          status: locations.length > 1 ? "ready" : "fallback"
        });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setRouteState({ locations: [routeStart, destination], distanceKm: null, status: "fallback" });
      });

    return () => controller.abort();
  }, [destination.lat, destination.lng, routeStart.lat, routeStart.lng]);

  const receiptText = [
    t.receiptTitle,
    `${t.order}: ${order.id}`,
    `${t.receiptCustomer}: ${order.customer}`,
    `${t.receiptGas}: ${order.quantity} x ${cylinder ? gasLabel(cylinder, language) : ""}`,
    `${t.receiptDelivery}: ${order.address}, ${order.zone}`,
    `${t.depot}: ${store.name}`,
    `${t.rider}: ${rider.name}`,
    `${t.receiptRouteDistance}: ${distanceText(displayedRouteDistanceKm)}`,
    `${t.originalEta}: ${etaRangeDisplay}`,
    `${t.payment}: ${paymentText.name} - ${order.paymentStatus}`,
    `${t.receiptConfirmation}: ${order.paymentConfirmedBy || paymentText.providerLabel || t.orderRecord}`,
    `${t.receiptReference}: ${order.paymentReference}`,
    `${t.subtotal}: ${money(order.subtotal || 0)}`,
    `${t.discount}: ${money(order.discount || 0)}`,
    `${t.total}: ${money(order.total || 0)}`,
    `${t.receiptLoyalty}: ${order.earnedPoints || 0}`
  ].join("\n");
  const receiptHref = `data:text/plain;charset=utf-8,${encodeURIComponent(receiptText)}`;

  return (
    <div className="live-map-stack">
      <div className="real-tracking-map">
        <LeafletTrackingMap
          store={store}
          destination={destination}
          riderLocation={displayedRiderLocation}
          routeLocations={hasRoadRoute ? routeState.locations : []}
          passedRouteLocations={routeProgressView.passedLocations}
          etaDisplay={etaDisplay}
          t={t}
        />
        {!hasRoadRoute && (
          <div className="map-route-loading">
            {routeState.status === "loading" ? "Loading road route" : "Road route unavailable"}
          </div>
        )}
        <div className="bolt-map-controls" aria-hidden="true">
          <button type="button"><MessageCircle size={18} /></button>
          <button type="button"><Route size={18} /></button>
        </div>
      </div>

      <div className="tracking-bottom-sheet">
        <div className="tracking-hero-row">
          <div>
            <p className="eyebrow">{t.gasDelivery}</p>
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

        <div className="map-facts">
          <div><span>{t.route}</span><strong>{distanceText(displayedRouteDistanceKm)}</strong></div>
          <div><span>{t.originalEta}</span><strong>{etaRangeDisplay}</strong></div>
          <div><span>{t.gps}</span><strong>{hasLiveGps ? t.live : t.waiting}</strong></div>
        </div>

        <div className="rider-card">
          <span className="rider-avatar">{riderInitials}</span>
          <div>
            <strong>{rider.name}</strong>
            <span>{rider.vehicle}</span>
          </div>
          <a className="round-action" href={`tel:${rider.phone}`} aria-label={t.rider}><Phone size={17} /></a>
          <a className="round-action" href={`sms:${rider.phone}`} aria-label={t.rider}><MessageCircle size={17} /></a>
        </div>

        <div className="receipt-panel">
          <div>
            <p className="eyebrow">{order.id}</p>
            <strong>{order.id}</strong>
            <span>{order.quantity} x {cylinder ? gasLabel(cylinder, language) : ""} - {money(order.total || 0)}</span>
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
  );
}
