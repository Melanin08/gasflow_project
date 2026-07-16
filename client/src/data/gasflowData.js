export const cylinderTypes = [
  { id: "6kg", category: "LPG Cylinder", label: "6kg refill", swLabel: "Kujaza 6kg", price: 18000 },
  { id: "13kg", category: "LPG Cylinder", label: "13kg refill", swLabel: "Kujaza 13kg", price: 42000 },
  { id: "38kg", category: "LPG Cylinder", label: "38kg refill", swLabel: "Kujaza 38kg", price: 115000 },
  { id: "starter", category: "LPG Cylinder", label: "New setup kit", swLabel: "Seti mpya", price: 76000 },
  { id: "natural-refill", category: "Natural Gas Refill", label: "Natural gas refill", swLabel: "Kujaza gesi asilia", price: 52000 },
  { id: "industrial-bulk", category: "Industrial/Bulk", label: "Industrial bulk order", swLabel: "Oda kubwa ya kiwanda", price: 185000 }
];

export const gasCategories = ["LPG Cylinder", "Natural Gas Refill", "Industrial/Bulk"];

export const stores = [
  { id: "st-01", name: "Stone Town Store", zone: "Stone Town", lat: -6.1629, lng: 39.1926, stock: { "6kg": 19, "13kg": 16, "38kg": 5, starter: 7, "natural-refill": 8, "industrial-bulk": 2 }, riders: 4, open: true },
  { id: "st-02", name: "Fuoni Store", zone: "Fuoni", lat: -6.183, lng: 39.25, stock: { "6kg": 28, "13kg": 24, "38kg": 7, starter: 5, "natural-refill": 9, "industrial-bulk": 2 }, riders: 3, open: true },
  { id: "st-03", name: "Bububu Store", zone: "Bububu", lat: -6.1003, lng: 39.2172, stock: { "6kg": 20, "13kg": 18, "38kg": 6, starter: 3, "natural-refill": 6, "industrial-bulk": 1 }, riders: 3, open: true },
  { id: "st-04", name: "Mwanakwerekwe Store", zone: "Mwanakwerekwe", lat: -6.1759, lng: 39.2288, stock: { "6kg": 14, "13kg": 21, "38kg": 4, starter: 6, "natural-refill": 7, "industrial-bulk": 2 }, riders: 2, open: true },
  { id: "st-05", name: "Mombasa Store", zone: "Mombasa", lat: -6.176, lng: 39.246, stock: { "6kg": 17, "13kg": 13, "38kg": 4, starter: 4, "natural-refill": 5, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-06", name: "Kisauni Store", zone: "Kisauni", lat: -6.1378, lng: 39.2207, stock: { "6kg": 22, "13kg": 15, "38kg": 3, starter: 4, "natural-refill": 5, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-07", name: "Kiembe Samaki Store", zone: "Kiembe Samaki", lat: -6.2234, lng: 39.2212, stock: { "6kg": 11, "13kg": 10, "38kg": 3, starter: 2, "natural-refill": 4, "industrial-bulk": 1 }, riders: 1, open: true },
  { id: "st-08", name: "Jang'ombe Store", zone: "Jang'ombe", lat: -6.1752, lng: 39.2145, stock: { "6kg": 15, "13kg": 12, "38kg": 5, starter: 5, "natural-refill": 6, "industrial-bulk": 1 }, riders: 2, open: true },
  { id: "st-09", name: "Chukwani Store", zone: "Chukwani", lat: -6.227, lng: 39.2244, stock: { "6kg": 9, "13kg": 8, "38kg": 2, starter: 2, "natural-refill": 3, "industrial-bulk": 1 }, riders: 1, open: true }
];

export const riders = [
  { id: "rd-01", name: "Asha Khamis", phone: "+255 714 112 233", vehicle: "Bajaj ZNZ 1423", storeId: "st-01" },
  { id: "rd-02", name: "Salum Juma", phone: "+255 765 998 877", vehicle: "Bike ZNZ 9921", storeId: "st-02" },
  { id: "rd-03", name: "Mwanaisha Ali", phone: "+255 688 445 566", vehicle: "Bike ZNZ 7720", storeId: "st-03" },
  { id: "rd-04", name: "Khamis Omar", phone: "+255 712 334 455", vehicle: "Bajaj ZNZ 5534", storeId: "st-04" },
  { id: "rd-05", name: "Yusuf Said", phone: "+255 742 201 404", vehicle: "Bike ZNZ 6201", storeId: "st-05" }
];

export const zones = ["Stone Town", "Fuoni", "Bububu", "Mwanakwerekwe", "Mombasa", "Kisauni", "Kiembe Samaki", "Jang'ombe", "Chukwani"];
export const zonePins = {
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

export const zanzibarPlaces = [
  { name: "Kwarara Secondary School", area: "Kwarara, Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1918, lng: 39.2456, aliases: ["kwara", "kwarara school", "kwarara secondary"] },
  { name: "Kwarara Msikitini", area: "Kwarara, Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1902, lng: 39.2428, aliases: ["kwara", "kwarara mosque", "msikiti kwarara"] },
  { name: "Kwarara", area: "Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1927, lng: 39.2478, aliases: ["kwara", "kwarara"] },
  { name: "Kwarara Media Centre And School", area: "Kwarara, Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1899, lng: 39.2492, aliases: ["kwara media", "kwarara media", "kwara school"] },
  { name: "Vuga Road", area: "Stone Town, Zanzibar, Tanzania", zone: "Stone Town", lat: -6.1638, lng: 39.1908, aliases: ["143 vuga", "vuga", "vuga road"] },
  { name: "Amani Stadium", area: "Amani, Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1776, lng: 39.2302, aliases: ["amani", "amani stadium"] },
  { name: "Mwanakwerekwe Market", area: "Mwanakwerekwe, Zanzibar, Tanzania", zone: "Mwanakwerekwe", lat: -6.1768, lng: 39.2281, aliases: ["mwanakwerekwe", "mwanakwerekwe market"] },
  { name: "Mombasa", area: "Zanzibar, Tanzania", zone: "Mombasa", lat: -6.176, lng: 39.246, aliases: ["mombasa zanzibar"] },
  { name: "Fuoni", area: "Zanzibar, Tanzania", zone: "Fuoni", lat: -6.183, lng: 39.25, aliases: ["fuoni"] },
  { name: "Kisauni", area: "Zanzibar, Tanzania", zone: "Kisauni", lat: -6.1378, lng: 39.2207, aliases: ["kisauni"] },
  { name: "Kiembe Samaki", area: "Zanzibar, Tanzania", zone: "Kiembe Samaki", lat: -6.2234, lng: 39.2212, aliases: ["kiembe", "kiembe samaki"] },
  { name: "Jang'ombe", area: "Zanzibar, Tanzania", zone: "Jang'ombe", lat: -6.1752, lng: 39.2145, aliases: ["jangombe", "jang'ombe"] },
  { name: "Chukwani", area: "Zanzibar, Tanzania", zone: "Chukwani", lat: -6.227, lng: 39.2244, aliases: ["chukwani"] },
  { name: "Bububu", area: "Zanzibar, Tanzania", zone: "Bububu", lat: -6.1004, lng: 39.217, aliases: ["bububu"] }
];
export const paymentMethods = [
  {
    id: "mpesa",
    name: "M-Pesa",
    accountLabel: "Business till / Lipa number",
    accountValue: "Scan My QR to pay",
    confirmationMode: "automatic",
    providerLabel: "M-Pesa callback",
    qrName: "Zuhura Dawa",
    qrNumber: "**********95",
    instruction: "Scan the My QR code or pay to the number shown."
  },
  {
    id: "airtel",
    name: "Airtel Money",
    accountLabel: "Merchant number",
    accountValue: "Scan My QR to pay",
    confirmationMode: "automatic",
    providerLabel: "Airtel Money callback",
    qrName: "Zuhura Dawa",
    qrNumber: "**********95",
    instruction: "Scan the My QR code or pay to the number shown."
  },
  {
    id: "halopesa",
    name: "Halotel / HaloPesa",
    accountLabel: "Merchant number",
    accountValue: "Scan My QR to pay",
    confirmationMode: "automatic",
    providerLabel: "Halotel callback",
    qrName: "Zuhura Dawa",
    qrNumber: "**********95",
    instruction: "Scan the My QR code or pay to the number shown."
  },
  {
    id: "card",
    name: "Card / Bank",
    accountLabel: "Secure checkout",
    accountValue: "Scan My QR to pay",
    confirmationMode: "automatic",
    providerLabel: "Card gateway callback",
    qrName: "Zuhura Dawa",
    qrNumber: "**********95",
    instruction: "Scan the My QR code or pay to the number shown."
  },
  {
    id: "cash",
    name: "Cash on delivery",
    accountLabel: "Collection",
    accountValue: "Rider collects cash at delivery",
    confirmationMode: "manual",
    providerLabel: "Cash receipt",
    instruction: "Order is reserved now. Rider collects cash and marks payment collected."
  }
];
export const deliveryStages = ["New", "Accepted", "Rider assigned", "On the way", "Delivered"];
export const promoCodes = {
  GAS10: { type: "percent", value: 10, label: "10% off" },
  KARIBU: { type: "fixed", value: 5000, label: "TZS 5,000 off" }
};

export const initialOrders = [];
export const emptyOrderForm = {
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
