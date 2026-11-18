export type Language = "en" | "yo" | "ha" | "pcm";

export interface Translations {
  appName: string;
  tagline: string;
  nearbyTab: string;
  allTab: string;
  searchPlaceholder: string;
  allCategories: string;
  tubersRoots: string;
  vegetablesGreens: string;
  peppersSpices: string;
  fruits: string;
  grainsStaples: string;
  oilsFats: string;
  poultryEggs: string;
  livestockFish: string;
  addToBasket: string;
  addedToBasket: string;
  basket: string;
  checkout: string;
  total: string;
  payNow: string;
  payOnDelivery: string;
  farmer: string;
  farmerDirect: string;
  sellProduce: string;
  myOrders: string;
  sellerDashboard: string;
  locationPermissionDenied: string;
  emptyNearby: string;
  emptyAll: string;
  unitKg: string;
  unitBag: string;
  unitCrate: string;
  unitPiece: string;
  unitBunch: string;
  statusPending: string;
  statusAccepted: string;
  statusOutForDelivery: string;
  statusCompleted: string;
  statusDeclined: string;
  statusCancelled: string;
  chatOnWhatsApp: string;
  produceQuantity: string;
  deliverDirectly: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "Ọjà",
    tagline: "Farm produce directly from growers nearby",
    nearbyTab: "Nearby Produce",
    allTab: "All Harvests",
    searchPlaceholder: "Search fresh tomatoes, yams, rodo, garri...",
    allCategories: "All Produce",
    tubersRoots: "Tubers & Roots",
    vegetablesGreens: "Fresh Vegetables",
    peppersSpices: "Peppers & Spices",
    fruits: "Fresh Fruits",
    grainsStaples: "Grains & Staples",
    oilsFats: "Pure Oils & Fats",
    poultryEggs: "Farm Eggs & Poultry",
    livestockFish: "Fish & Livestock",
    addToBasket: "Add to Basket",
    addedToBasket: "In Basket",
    basket: "Basket",
    checkout: "Proceed to Checkout",
    total: "Total",
    payNow: "Pay Now (Card / Transfer)",
    payOnDelivery: "Pay on Delivery",
    farmer: "Farmer",
    farmerDirect: "Harvested & delivered direct by grower",
    sellProduce: "Post Produce",
    myOrders: "My Orders",
    sellerDashboard: "Farmer Dashboard",
    locationPermissionDenied: "Location unavailable. Showing all harvests with manual area picker.",
    emptyNearby: "No farms found within this radius yet. Try widening your search.",
    emptyAll: "No produce found matching your search. Check back soon for fresh harvests.",
    unitKg: "kg",
    unitBag: "bag",
    unitCrate: "crate",
    unitPiece: "piece",
    unitBunch: "bunch",
    statusPending: "Pending Confirmation",
    statusAccepted: "Accepted by Farmer",
    statusOutForDelivery: "On the Way to You",
    statusCompleted: "Delivered",
    statusDeclined: "Declined",
    statusCancelled: "Cancelled",
    chatOnWhatsApp: "Chat on WhatsApp",
    produceQuantity: "Available quantity",
    deliverDirectly: "Farmer delivers straight to your doorstep",
  },
  yo: {
    appName: "Ọjà",
    tagline: "Eso oko taara lati ọwọ awọn agbẹ to sunmọ ọ",
    nearbyTab: "Eso Oko To Sunmọ",
    allTab: "Gbogbo Eso Oko",
    searchPlaceholder: "Wa tomati, isu, ata rodo, garri...",
    allCategories: "Gbogbo Ohun Oko",
    tubersRoots: "Isu ati Gbongbo",
    vegetablesGreens: "Efo Tuntun",
    peppersSpices: "Ata ati Eroo",
    fruits: "Eso Didun",
    grainsStaples: "Okele ati Eso Ogbin",
    oilsFats: "Epo Pupa ati Epo Didun",
    poultryEggs: "Eyin ati Adiye Oko",
    livestockFish: "Eja ati Eran",
    addToBasket: "Fi si Agbọn",
    addedToBasket: "Ninu Agbọn",
    basket: "Agbọn Rẹ",
    checkout: "Sanwo Bayi",
    total: "Lapapọ",
    payNow: "Sanwo Lẹsẹkẹsẹ",
    payOnDelivery: "Sanwo Nigba Ti O Ba De",
    farmer: "Agbẹ",
    farmerDirect: "Taara lati oko agbẹ",
    sellProduce: "Ta Eso Oko",
    myOrders: "Awọn Aṣẹ Mi",
    sellerDashboard: "Ojú Agbẹ",
    locationPermissionDenied: "A ko ri ipo rẹ. Yan agbegbe rẹ pẹlu ọwọ.",
    emptyNearby: "Ko si eso oko to sunmọ to bẹ lọwọlọwọ. Fe ibi iwadi rẹ fẹ.",
    emptyAll: "A ko ri eso kankan. Wa pada laipẹ fun ikore tuntun.",
    unitKg: "kg",
    unitBag: "apo",
    unitCrate: "agbọn",
    unitPiece: "ẹyọ",
    unitBunch: "odidi",
    statusPending: "Nduro Fun Agbẹ",
    statusAccepted: "Agbẹ Ti Gba",
    statusOutForDelivery: "O Wa Loju Ọna",
    statusCompleted: "Ti De Ọwọ Rẹ",
    statusDeclined: "Agbẹ Ko Le Pese",
    statusCancelled: "Ti Fagilee",
    chatOnWhatsApp: "Sọrọ lori WhatsApp",
    produceQuantity: "Iye to wa",
    deliverDirectly: "Agbẹ yoo gbe wa taara si ẹnu-ọna rẹ",
  },
  ha: {
    appName: "Ọjà",
    tagline: "Kayan gona kai tsaye daga manoma kusa da kai",
    nearbyTab: "Kayan Gona Na Kusa",
    allTab: "Duk Kayan Gona",
    searchPlaceholder: "Nemi tumatir, doya, attarugu, garri...",
    allCategories: "Duk Kayan",
    tubersRoots: "Doya da Tushen Abinci",
    vegetablesGreens: "Kayan Lambu",
    peppersSpices: "Attarugu da Kayan Kamshi",
    fruits: "Kayan Marmari",
    grainsStaples: "Hatsi da Abinci",
    oilsFats: "Man Ja da Mai",
    poultryEggs: "Kwayayen Kaji da Kaji",
    livestockFish: "Kifi da Dabbobi",
    addToBasket: "Saka a Kwando",
    addedToBasket: "Yana Cikin Kwando",
    basket: "Kwando",
    checkout: "Kammala Sayayya",
    total: "Jimilla",
    payNow: "Biya Yanzu",
    payOnDelivery: "Biya Lokacin Karba",
    farmer: "Manomi",
    farmerDirect: "Kai tsaye daga gonar manomi",
    sellProduce: "Siyar da Kayan Gona",
    myOrders: "Odojina",
    sellerDashboard: "Shafin Manomi",
    locationPermissionDenied: "Ba a samu wurinka ba. Zaɓi yankinka da kanka.",
    emptyNearby: "Babu kayan gona kusa da kai a yanzu. Fadada bincikenka.",
    emptyAll: "Ba a sami kayan gona ba. Dawo kwanan nan don sabon girbi.",
    unitKg: "kg",
    unitBag: "buhu",
    unitCrate: "kwando",
    unitPiece: "guda",
    unitBunch: "dami",
    statusPending: "Ana Jira",
    statusAccepted: "Manomi Ya Karba",
    statusOutForDelivery: "Yana Kan Hanya",
    statusCompleted: "An Isar",
    statusDeclined: "An Ki",
    statusCancelled: "An Soke",
    chatOnWhatsApp: "Yi Magana a WhatsApp",
    produceQuantity: "Adadin da ke akwai",
    deliverDirectly: "Manomi zai kawo har kofar gidanku",
  },
  pcm: {
    appName: "Ọjà",
    tagline: "Correct farm food direct from farmers wey dey near you",
    nearbyTab: "Food Wey Dey Near",
    allTab: "All Farm Food",
    searchPlaceholder: "Find fresh tomato, yam, pepper, garri...",
    allCategories: "All Categories",
    tubersRoots: "Yam & Cassava",
    vegetablesGreens: "Fresh Green Leaf",
    peppersSpices: "Pepper & Spice",
    fruits: "Fresh Fruit",
    grainsStaples: "Grains & Food Stuff",
    oilsFats: "Pure Palm Oil & Oil",
    poultryEggs: "Farm Egg & Fowl",
    livestockFish: "Fish & Meat",
    addToBasket: "Put Inside Basket",
    addedToBasket: "E Dey Basket",
    basket: "Basket",
    checkout: "Go Pay",
    total: "Total Money",
    payNow: "Pay Now With Card",
    payOnDelivery: "Pay When E Reach Your Hand",
    farmer: "Farmer",
    farmerDirect: "Direct from the farm wey harvest am",
    sellProduce: "Sell Your Produce",
    myOrders: "My Orders",
    sellerDashboard: "Farmer Dashboard",
    locationPermissionDenied: "We no fit see your location. Pick your area by hand.",
    emptyNearby: "No farm dey this area yet. Try widen your search small.",
    emptyAll: "No food match wetin you find. Check back small time for fresh harvest.",
    unitKg: "kg",
    unitBag: "bag",
    unitCrate: "crate",
    unitPiece: "piece",
    unitBunch: "bunch",
    statusPending: "Farmer dey check am",
    statusAccepted: "Farmer don agree",
    statusOutForDelivery: "E dey on the way come",
    statusCompleted: "You don receive am",
    statusDeclined: "Farmer no fit supply",
    statusCancelled: "Order don cancel",
    chatOnWhatsApp: "Chat on WhatsApp",
    produceQuantity: "Quantity wey remain",
    deliverDirectly: "Farmer go bring am straight to your door",
  },
};
