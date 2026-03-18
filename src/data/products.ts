import type { KnownProductCategory, Product } from '@/types/product';

type CatalogItem = {
  category: KnownProductCategory;
  title: string;
  description: string;
};

const CATEGORY_IMAGE_PATHS: Record<KnownProductCategory, string> = {
  'curtainsiders-semicurtainsiders': '/lecitrailer/curtainsiders-semicurtainsiders.jpg',
  reefers: '/lecitrailer/reefers.jpg',
  'dry-freight-vans': '/lecitrailer/dry-freight-vans.jpg',
  'container-carrier-chassis': '/lecitrailer/container-carrier-chassis.jpg',
  platforms: '/lecitrailer/platforms.jpg',
  trailers: '/lecitrailer/trailers.jpg',
  dolly: '/lecitrailer/dolly.jpg',
  'special-vehicles-tailor-made': '/lecitrailer/special-vehicles-tailor-made.jpg',
  rigids: '/lecitrailer/rigids.jpg',
};

const PRODUCT_IMAGE_URLS_BY_TITLE: Record<string, string[]> = {
  'fix curtainsiders': [
    'https://lecitrailer.es/uploads/productos/101-lonas-fija/lonas-fijas.jpg',
    'https://lecitrailer.es/uploads/productos/101-lonas-fija/lf-lat-izqdo.jpg',
    'https://lecitrailer.es/uploads/productos/101-lonas-fija/lf-del-izda.jpg',
    'https://lecitrailer.es/uploads/productos/101-lonas-fija/lf-fr-tras-int.jpg',
    'https://lecitrailer.es/uploads/productos/101-lonas-fija/lf-tras.jpg',
  ],
  'coil carrier curtainsiders': [
    'https://lecitrailer.es/uploads/productos/111-lonas-portabobinas/lonas-portabobinas.jpg',
    'https://lecitrailer.es/uploads/productos/111/1.jpg',
    'https://lecitrailer.es/uploads/productos/111/2.jpg',
    'https://lecitrailer.es/uploads/productos/111/3.jpg',
  ],
  'double deck van': [
    'https://lecitrailer.es/uploads/productos/305-furgon-doble-piso/doble-piso.jpg',
    'https://lecitrailer.es/uploads/productos/305-furgon-doble-piso/img-2883.jpg',
    'https://lecitrailer.es/uploads/productos/305-furgon-doble-piso/12.jpg',
    'https://lecitrailer.es/uploads/productos/305-furgon-doble-piso/17.jpg',
  ],
  'city trailer van': [
    'https://lecitrailer.es/uploads/productos/306/furgon-city.jpg',
    'https://lecitrailer.es/uploads/productos/306/2.jpg',
    'https://lecitrailer.es/uploads/productos/306/4.jpg',
    'https://lecitrailer.es/uploads/productos/306/1.jpg',
  ],
  'lightened container carrier': [
    'https://lecitrailer.es/uploads/productos/405-portaconedor-aligerado/portacontenedor-aligerado.jpg',
    'https://lecitrailer.es/uploads/productos/405-portaconedor-aligerado/img-3957.jpg',
    'https://lecitrailer.es/uploads/productos/405-portaconedor-aligerado/img-3935.jpg',
  ],
  'lightened coil carrier platform': [
    'https://lecitrailer.es/uploads/productos/505-plataforma-portabobinas-aligerada/plataforma-portabobinas-aligerada.jpg',
    'https://lecitrailer.es/uploads/productos/505-plataforma-portabobinas-aligerada/img-2361.jpg',
    'https://lecitrailer.es/uploads/productos/505-plataforma-portabobinas-aligerada/img-2367.jpg',
    'https://lecitrailer.es/uploads/productos/505-plataforma-portabobinas-aligerada/img-2370.jpg',
    'https://lecitrailer.es/uploads/productos/505-plataforma-portabobinas-aligerada/img-2380.jpg',
  ],
  'waste-container trailer': [
    'https://lecitrailer.es/uploads/productos/805-remolque-porta-residuos/porta-cajones-2-ejes-lanza-coude.jpg',
    'https://lecitrailer.es/uploads/productos/805-remolque-porta-residuos/porta-residuos-basculante-nuevos-pilotos.jpg',
    'https://lecitrailer.es/uploads/productos/805-remolque-porta-residuos/porta-residuos-via-estrecha-nuevos-pilotos.jpg',
    'https://lecitrailer.es/uploads/productos/805-remolque-porta-residuos/porte-caisson.jpg',
  ],
  'dry freight van rigids': [
    'https://lecitrailer.es/uploads/productos/702/camion-paquetero.jpg',
    'https://lecitrailer.es/uploads/productos/702/2.jpg',
    'https://lecitrailer.es/uploads/productos/702/3.jpg',
    'https://lecitrailer.es/uploads/productos/702/4.jpg',
    'https://lecitrailer.es/uploads/productos/702/1.jpg',
  ],
};

function getProductImages(title: string, category: KnownProductCategory) {
  const normalizedTitle = title.trim().toLowerCase();
  return PRODUCT_IMAGE_URLS_BY_TITLE[normalizedTitle] ?? [CATEGORY_IMAGE_PATHS[category]];
}

const catalogItems: CatalogItem[] = [
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Fix Curtainsiders',
    description: 'Standard curtainsider with fixed roof structure for general cargo transport requiring lateral access.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Lifting Roof Curtainsiders',
    description: 'Curtainsider with elevating roof system for top loading while maintaining full curtain-side access.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Semicurtainsiders',
    description: 'Semi-open trailer with curtain sides for oversized or irregularly shaped loads.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Lightened Curtainsiders',
    description: 'Weight-optimized curtainsider to maximize payload and remain compliant with road limits.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Coil Carrier Curtainsiders',
    description: 'Curtainsider with reinforced floor and coil cradles for safe transport of steel coils.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Lightened Coil Carrier Curtainsiders',
    description: 'Lightweight coil carrier curtainsider with structural reinforcements for rolled steel transport.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'City Trailer Curtainsiders',
    description: 'Compact curtainsider for urban distribution and tight delivery zones.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'LPS Curtainsiders',
    description: 'Long Pallet System curtainsider for long pallets and oversized flat cargo.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Double Deck Curtainsiders',
    description: 'Two-level curtainsider trailer for high volumetric utilization with stacked cargo.',
  },
  {
    category: 'curtainsiders-semicurtainsiders',
    title: 'Mega Trailer Curtainsiders',
    description: 'High-volume curtainsider for maximum capacity in 25.25m road train operations.',
  },
  {
    category: 'reefers',
    title: 'Lecitrailer Reefers',
    description: 'Standard refrigerated semi-trailer with insulated panels and refrigeration unit for perishable cargo.',
  },
  {
    category: 'reefers',
    title: 'City Trailer Reefers',
    description: 'Compact reefer for urban last-mile cold-chain deliveries.',
  },
  {
    category: 'reefers',
    title: 'Lightened Reefers',
    description: 'Weight-optimized reefer maximizing payload while maintaining full thermal performance.',
  },
  {
    category: 'reefers',
    title: 'Frigo Farma',
    description: 'Pharmaceutical-grade reefer trailer for strict healthcare temperature and hygiene requirements.',
  },
  {
    category: 'reefers',
    title: 'Double Deck Reefers',
    description: 'Two-level refrigerated trailer for volume efficiency in chilled distribution.',
  },
  {
    category: 'reefers',
    title: 'Mega Trailer Reefers',
    description: 'Large-format reefer in road train configuration for high-volume cold-chain transport.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Absolute Van',
    description: 'Premium dry freight van with robust construction and optimized internal volume.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Dogal-Van Van',
    description: 'Dry freight van designed for heavy or dense cargo with reinforced floor and side panels.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Steel Van',
    description: 'Fully steel-bodied enclosed van for durability and security in demanding transport conditions.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Garment Van',
    description: 'Enclosed trailer with hanging rails and interior fittings for garments on hangers.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Double Deck Van',
    description: 'Two-level enclosed trailer maximizing volumetric efficiency for packaged goods.',
  },
  {
    category: 'dry-freight-vans',
    title: 'City Trailer Van',
    description: 'Compact enclosed van for urban distribution with frequent city delivery stops.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Lifting Roof Van',
    description: 'Dry freight van with elevating roof for top-loading while keeping full enclosure in transit.',
  },
  {
    category: 'dry-freight-vans',
    title: 'Mega Trailer Van',
    description: 'High-capacity enclosed van in road train format for maximum volume freight transport.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Pneumatical Extension Multicontainer Carrier',
    description: 'Pneumatic extending chassis for 20ft, 30ft, 40ft, and 45ft containers.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Manual Extension Multicontainer Carrier',
    description: 'Manually adjustable container chassis for multiple ISO container lengths.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Lightened Container Carrier',
    description: 'Weight-optimized container chassis designed to maximize payload.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'High Cube',
    description: 'Low-deck chassis designed for 9 foot 6 high-cube containers within road height limits.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Sliding Charriot Container Carrier',
    description: 'Container chassis with sliding bogie system for optimized weight distribution.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Liquid Container Carrier',
    description: 'Reinforced chassis configured for ISO tank containers carrying liquid bulk cargo.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Straight Container Carrier',
    description: 'Fixed-length container chassis for robust and simple standard ISO haulage.',
  },
  {
    category: 'container-carrier-chassis',
    title: 'Tipping Container Carrier',
    description: 'Container chassis with tipping mechanism for direct discharge of bulk cargo.',
  },
  {
    category: 'platforms',
    title: 'Standard Platform',
    description: 'Classic flatbed semi-trailer for heavy and oversized cargo.',
  },
  {
    category: 'platforms',
    title: 'Platform for Concrete Transport',
    description: 'Reinforced platform for concentrated loads of precast concrete elements.',
  },
  {
    category: 'platforms',
    title: 'Coil Carrier Platform',
    description: 'Flatbed with integrated coil saddles and securing points for steel coils.',
  },
  {
    category: 'platforms',
    title: 'Lightened Coil Carrier Platform',
    description: 'Weight-optimized coil carrier platform balancing payload and structural strength.',
  },
  {
    category: 'platforms',
    title: 'Extendable Platform',
    description: 'Telescopic flatbed extending in length for oversized and extra-long loads.',
  },
  {
    category: 'platforms',
    title: 'Wood Carrier Platform',
    description: 'Flatbed with stanchions and bunks for secure transport of logs and timber.',
  },
  {
    category: 'platforms',
    title: 'Side Wall Platform',
    description: 'Platform with side walls for added cargo protection and flexibility.',
  },
  {
    category: 'platforms',
    title: 'City Trailer Platform',
    description: 'Compact flatbed for urban construction and delivery operations.',
  },
  {
    category: 'trailers',
    title: 'Central Axles Trailer',
    description: 'Drawbar trailer with central axle group for balanced stability across applications.',
  },
  {
    category: 'trailers',
    title: 'Turntable Trailer',
    description: 'Classic drawbar trailer with front turntable steering axle for tight turning circles.',
  },
  {
    category: 'trailers',
    title: 'Swap Body Trailers',
    description: 'Trailer designed for interchangeable swap bodies and rapid load exchange.',
  },
  {
    category: 'trailers',
    title: 'Waste-Container Trailer',
    description: 'Specialized trailer for collection and transport of waste containers and skips.',
  },
  {
    category: 'trailers',
    title: 'Bodied Trailer',
    description: 'Drawbar trailer with fixed enclosed body for general or specialized distribution.',
  },
  {
    category: 'dolly',
    title: 'Dolly',
    description: 'Steerable converter dolly for B-train or road train multi-trailer combinations.',
  },
  {
    category: 'rigids',
    title: 'Curtainsiders Rigids',
    description: 'Curtainsider body fitted on rigid truck chassis for flexible lateral loading.',
  },
  {
    category: 'rigids',
    title: 'Road Train',
    description: 'Rigid truck and trailer road train maximizing total payload for high-volume transport.',
  },
  {
    category: 'rigids',
    title: 'Reefer Rigids',
    description: 'Temperature-controlled refrigerated body on rigid chassis for local and regional delivery.',
  },
  {
    category: 'rigids',
    title: 'Dry Freight Van Rigids',
    description: 'Enclosed dry freight body on rigid chassis for protected urban and regional delivery.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Gooseneck',
    description: 'Low-profile semi-trailer with gooseneck section for tall and heavy machinery transport.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Low Beds',
    description: 'Extra-low-deck semi-trailer for oversized heavy machinery and indivisible loads.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Tractor Carriers',
    description: 'Multi-level transporter semi-trailer for tractors and wheeled machinery.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Gas Carriers',
    description: 'Specialized tank trailer for safe road transport of compressed or liquefied gases.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Steel Scrappers',
    description: 'Heavy-duty open-top tipping trailer for steel scrap and industrial bulk waste.',
  },
  {
    category: 'special-vehicles-tailor-made',
    title: 'Tailor Made Vehicles',
    description: 'Fully customized special transport vehicles engineered for non-standard cargo challenges.',
  },
];

const baseTimestamp = Date.UTC(2026, 2, 7, 9, 0, 0);

export const seedProducts: Product[] = catalogItems.map((item, index) => {
  const sequence = index + 1;

  return {
    id: `LECI-${String(sequence).padStart(3, '0')}`,
    title: item.title,
    category: item.category,
    brand: 'Lecitrailer',
    stockType: 'new',
    source: 'lecitrailer',
    price: 390000 + sequence * 6500,
    year: 2026,
    location: 'Factory order - Spain',
    images: getProductImages(item.title, item.category),
    description: item.description,
    status: 'available',
    createdAt: new Date(baseTimestamp + sequence * 60_000).toISOString(),
  };
});

export const categories: Array<{ id: KnownProductCategory; name: string; nameFr: string; nameEs: string }> = [
  {
    id: 'curtainsiders-semicurtainsiders',
    name: 'Curtainsiders and Semicurtainsiders',
    nameFr: 'Rideaux coulissants et semi-rideaux',
    nameEs: 'Cortinas y semilonas',
  },
  { id: 'reefers', name: 'Reefers', nameFr: 'Frigorifiques', nameEs: 'Frigorificos' },
  { id: 'dry-freight-vans', name: 'Dry freight vans', nameFr: 'Fourgons de fret sec', nameEs: 'Furgones de carga seca' },
  {
    id: 'container-carrier-chassis',
    name: 'Container carrier chassis',
    nameFr: 'Chassis porte-conteneurs',
    nameEs: 'Chasis portacontenedores',
  },
  { id: 'platforms', name: 'Platforms', nameFr: 'Plateformes', nameEs: 'Plataformas' },
  { id: 'trailers', name: 'Trailers', nameFr: 'Remorques', nameEs: 'Remolques' },
  { id: 'dolly', name: 'Dolly', nameFr: 'Dolly', nameEs: 'Dolly' },
  {
    id: 'special-vehicles-tailor-made',
    name: 'Special vehicles and tailor made',
    nameFr: 'Vehicules speciaux et sur mesure',
    nameEs: 'Vehiculos especiales y a medida',
  },
  { id: 'rigids', name: 'Rigids', nameFr: 'Porteurs rigides', nameEs: 'Rigidos' },
];

export const categoryImages: Record<KnownProductCategory, string> = { ...CATEGORY_IMAGE_PATHS };
