export interface AreaOption {
  id: string;
  name: string;
  lat: number;
  lng: number;
  state: string;
  isAgriculturalHub?: boolean;
}

/**
 * Curated regional market and agricultural hub presets.
 * Centralized here so components do not hardcode location lists.
 */
export const DEFAULT_REGION_LOCATIONS: AreaOption[] = [
  {
    id: "vi_ikoyi",
    name: "Victoria Island & Ikoyi",
    lat: 6.4281,
    lng: 3.4219,
    state: "Lagos",
  },
  {
    id: "lekki_chevron",
    name: "Lekki Phase 1 & Chevron",
    lat: 6.4474,
    lng: 3.4883,
    state: "Lagos",
  },
  {
    id: "ajah_sangotedo",
    name: "Ajah & Sangotedo Corridor",
    lat: 6.4682,
    lng: 3.6198,
    state: "Lagos",
    isAgriculturalHub: true,
  },
  {
    id: "epe_farms",
    name: "Epe Farm Settlement & Ketu-Epe",
    lat: 6.5841,
    lng: 3.9832,
    state: "Lagos",
    isAgriculturalHub: true,
  },
  {
    id: "ikeja_gra",
    name: "Ikeja & GRA",
    lat: 6.6018,
    lng: 3.3515,
    state: "Lagos",
  },
  {
    id: "mile12_market",
    name: "Mile 12 Produce Market Belt",
    lat: 6.6114,
    lng: 3.3982,
    state: "Lagos",
    isAgriculturalHub: true,
  },
  {
    id: "ikorodu_agric",
    name: "Agric / Ikorodu Farms & Imota",
    lat: 6.6152,
    lng: 3.5104,
    state: "Lagos",
    isAgriculturalHub: true,
  },
  {
    id: "surulere_yaba",
    name: "Surulere & Yaba",
    lat: 6.5,
    lng: 3.3667,
    state: "Lagos",
  },
  {
    id: "festac_amuwo",
    name: "Festac & Amuwo Odofin",
    lat: 6.4647,
    lng: 3.2847,
    state: "Lagos",
  },
  {
    id: "badagry_belt",
    name: "Badagry Farmlands",
    lat: 6.4316,
    lng: 2.8876,
    state: "Lagos",
    isAgriculturalHub: true,
  },
  {
    id: "alimosho_ipaja",
    name: "Alimosho & Ipaja",
    lat: 6.6083,
    lng: 3.2711,
    state: "Lagos",
  },
];
