import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bike,
  CheckCircle2,
  Clock3,
  Folder,
  Flame,
  Gift,
  Languages,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Route,
  Send,
  Share2,
  Star,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import DispatchPage from "./pages/DispatchPage.jsx";
import RiderGpsPage from "./pages/RiderGpsPage.jsx";
import TrackingPage from "./pages/TrackingPage.jsx";
import { PaymentQrCard, RoutePreviewMap, TanzaniaPhoneInput } from "./components/FormControls.jsx";
import heroDeliveryImage from "../assets/fast-gas-delivery-hero.jpg";
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
  createTrackingMapView,
  deliveryEtaEstimate,
  distanceKm,
  distanceText,
  etaRangeText,
  etaText,
  fullTanzaniaPhone,
  gasLabel,
  getLocalPlaceSuggestions,
  getPaymentMethod,
  getStoreScore,
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

export default function App() {
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
  const addressSuggestions = mapAddressSuggestions.length > 0 ? mapAddressSuggestions : getLocalPlaceSuggestions(form.address);
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

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
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

  async function shareWelcomePage() {
    const shareData = {
      title: "GasFlow",
      text: `${t.hero} - ${t.chooseGas}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setWelcomeNotice(t.shareReady);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        setWelcomeNotice(t.shareCopied);
        return;
      }

      setWelcomeNotice(t.shareUnavailable);
    } catch {
      setWelcomeNotice(t.shareUnavailable);
    }
  }

  function messageGasFlow() {
    const message = encodeURIComponent(`${t.hero}: ${t.chooseGas}`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    setWelcomeNotice(t.messageOpened);
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
          ? { ...order, status: "On the way" }
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
    if (!navigator.geolocation) {
      setDispatchMessage({ type: "error", text: t.browserNoLocation });
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

  if (!hasEnteredApp) {
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
            <button type="button" onClick={enterApp} aria-label={t.order}><Folder size={18} /></button>
          </div>

          <img className="welcome-image" src={heroDeliveryImage} alt="" />

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
    <main className="app-shell">
      <header className="topbar">
        <button className="round-action app-back-action" type="button" onClick={() => setHasEnteredApp(false)} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div className="brand-mark"><Flame size={26} /></div>
        <div className="hero-copy">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.hero}</h1>
        </div>
        <div className="top-actions">
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
          ["tracking", t.trackOrder],
          ["rider", t.riderGps]
        ].map(([id, label]) => (
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

      {view === "dispatch" && (
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

      {view === "tracking" && (
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

      {view === "rider" && (
        <RiderGpsPage>
          <div className="panel rider-gps-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t.riderLocationSender}</p>
                <h2>{trackingOrder ? `${assignedRider?.name || t.assignedRider} - ${trackingOrder.id}` : t.noActiveOrder}</h2>
              </div>
              <span className={riderGpsStatus.sharing ? "status-pill gps-live" : "status-pill"}>
                <MapPin size={16} />
                {riderGpsStatus.sharing ? t.gpsLive : t.gpsOff}
              </span>
            </div>

            {!trackingOrder && (
              <div className="empty-state">
                <Truck size={28} /> {t.placeOrderFirstGps}
              </div>
            )}

            {trackingOrder && (
              <>
                <div className="rider-gps-grid">
                  <div>
                    <span>{t.rider}</span>
                    <strong>{assignedRider?.name || trackingOrder.riderId}</strong>
                  </div>
                  <div>
                    <span>{t.vehicle}</span>
                    <strong>{assignedRider?.vehicle || t.vehicle}</strong>
                  </div>
                  <div>
                    <span>{t.order}</span>
                    <strong>{trackingOrder.id}</strong>
                  </div>
                  <div>
                    <span>{t.lastGps}</span>
                    <strong>{activeRiderLocation ? `${activeRiderLocation.lat.toFixed(5)}, ${activeRiderLocation.lng.toFixed(5)}` : t.notSentYet}</strong>
                  </div>
                  <div>
                    <span>{t.accuracy}</span>
                    <strong>{activeRiderLocation?.accuracy ? `${Math.round(activeRiderLocation.accuracy)} m` : t.waiting}</strong>
                  </div>
                  <div>
                    <span>{t.updated}</span>
                    <strong>{activeRiderLocation?.updatedAtMs ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(activeRiderLocation.updatedAtMs)) : t.waiting}</strong>
                  </div>
                </div>

                <div className="rider-gps-actions">
                  <button className="primary-action" type="button" onClick={startRiderGpsShare} disabled={riderGpsStatus.sharing}>
                    <MapPin size={17} /> {t.startGpsSharing}
                  </button>
                  <button className="ghost-action" type="button" onClick={stopRiderGpsShare} disabled={!riderGpsStatus.sharing}>
                    <AlertTriangle size={17} /> {t.stopGps}
                  </button>
                </div>

                {riderGpsStatus.message && (
                  <div className={`dispatch-feedback ${riderGpsStatus.sharing ? "success" : "info"}`}>
                    <MapPin size={18} />
                    <span>{riderGpsStatus.message}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </RiderGpsPage>
      )}
    </main>
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
  const routeStart = hasLiveGps ? riderLocation : store;
  const mapView = createTrackingMapView(store, destination, hasLiveGps ? riderLocation : null, routeState.locations);
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
  const statusTitle = order.status === "Delivered" ? t.gasDelivered : hasLiveGps ? t.yourGasOnWay : t.waitingForRiderGps;
  const trackingNote = order.status === "Delivered"
    ? t.deliveryCompleted
    : hasLiveGps
      ? t.riderLocationUpdating
      : t.gpsPendingRouteNote;
  const riderInitials = rider.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");

  useEffect(() => {
    const controller = new AbortController();
    setRouteState((current) => ({ ...current, status: "loading" }));

    fetch(routeApiUrl(routeStart, destination), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Route unavailable");
        return response.json();
      })
      .then((data) => {
        const route = data.routes?.[0];
        const locations = routeCoordinatesToLocations(route);
        setRouteState({
          locations: locations.length > 1 ? locations : [routeStart, destination],
          distanceKm: route?.distance ? route.distance / 1000 : null,
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
        <div className="bolt-route-bar">
          <span>{store.name}</span>
          <Route size={18} />
          <strong>{destination.label}</strong>
        </div>
        <svg className="route-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {hasRoadRoute && <path className="route-shadow" d={mapView.remainingPath} />}
          {hasRoadRoute && <path className="route-remaining" d={mapView.remainingPath} />}
          {hasRoadRoute && hasLiveGps && <path className="route-completed" d={mapView.completedPath} />}
        </svg>
        <span className="map-pin store-pin" style={mapView.storePoint}><Store size={15} /></span>
        <span className="map-pin customer-pin" style={mapView.destinationPoint}><MapPin size={15} /></span>
        {hasLiveGps && mapView.riderPoint && <span className="rider-pin" style={mapView.riderPoint}><Truck size={17} /></span>}
        <div className="map-stop-label pickup-label" style={{ left: mapView.storePoint.left, top: `calc(${mapView.storePoint.top} - 58px)` }}>
          <span>{t.pickup}</span>
          <strong>{store.zone}</strong>
        </div>
        <div className="map-stop-label dropoff-label" style={{ left: mapView.destinationPoint.left, top: `calc(${mapView.destinationPoint.top} - 58px)` }}>
          <span>{t.dropoff}</span>
          <strong>{etaDisplay}</strong>
        </div>
        <div className="bolt-map-controls" aria-hidden="true">
          <button type="button"><MessageCircle size={18} /></button>
          <button type="button"><Route size={18} /></button>
        </div>

        <div className="tracking-bottom-sheet">
          <span className="sheet-handle" />
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
    </div>
  );
}
