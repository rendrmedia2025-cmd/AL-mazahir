import { ProductCategory } from '@/lib/types';

/**
 * Sample product categories data for Al Mazahir Trading Est.
 * Updated with real processed images from autonomous asset intelligence system
 */
export const productCategories: ProductCategory[] = [
  {
    id: 'safety-equipment',
    name: 'Safety Equipment',
    description: 'Comprehensive range of personal protective equipment including helmets, safety glasses, gloves, and protective clothing to ensure workplace safety across all industries.',
    image: '/assets/safety-equipment/safety-equipment-safety-helmet-almazahir.webp',
    slug: 'safety-equipment',
    products: [
      {
        id: 'safety-helmet',
        name: 'Industrial Safety Helmet',
        description: 'High-impact resistant safety helmets with adjustable suspension system',
        image: '/assets/safety-equipment/safety-equipment-safety-helmet-almazahir.webp',
        category: 'safety-equipment'
      },
      {
        id: 'safety-glasses',
        name: 'Safety Glasses',
        description: 'Anti-fog, scratch-resistant safety glasses with UV protection',
        image: '/assets/safety-equipment/safety-equipment-safety-glasses-almazahir.webp',
        category: 'safety-equipment'
      },
      {
        id: 'work-gloves',
        name: 'Work Gloves',
        description: 'Cut-resistant work gloves with enhanced grip and dexterity',
        image: '/assets/safety-equipment/safety-equipment-work-gloves-almazahir.webp',
        category: 'safety-equipment'
      },
      {
        id: 'safety-boots',
        name: 'Safety Boots',
        description: 'Steel-toe safety boots with slip-resistant soles',
        image: '/assets/safety-equipment/safety-equipment-safety-boots-almazahir.webp',
        category: 'safety-equipment'
      }
    ]
  },
  {
    id: 'fire-safety',
    name: 'Fire & Safety',
    description: 'Fire prevention and safety systems including fire extinguishers, smoke detectors, emergency lighting, and fire suppression equipment for comprehensive fire protection.',
    image: '/assets/fire-safety/fire-safety-fire-extinguisher-almazahir.webp',
    slug: 'fire-safety',
    products: [
      {
        id: 'fire-extinguisher',
        name: 'Fire Extinguisher',
        description: 'Multi-purpose dry chemical fire extinguishers for various fire classes',
        image: '/assets/fire-safety/fire-safety-fire-extinguisher-almazahir.webp',
        category: 'fire-safety'
      },
      {
        id: 'smoke-detector',
        name: 'Smoke Detector',
        description: 'Photoelectric smoke detectors with battery backup',
        image: '/assets/fire-safety/fire-safety-smoke-detector-almazahir.webp',
        category: 'fire-safety'
      },
      {
        id: 'emergency-light',
        name: 'Emergency Lighting',
        description: 'LED emergency lights with automatic switching and long battery life',
        image: '/assets/fire-safety/fire-safety-emergency-light-almazahir.webp',
        category: 'fire-safety'
      },
      {
        id: 'fire-blanket',
        name: 'Fire Blanket',
        description: 'Fire-resistant blankets for emergency fire suppression',
        image: '/assets/fire-safety/fire-safety-fire-blanket-almazahir.webp',
        category: 'fire-safety'
      }
    ]
  },
  {
    id: 'construction-materials',
    name: 'Construction & Building Materials',
    description: 'Quality construction materials including cement, steel, aggregates, and building supplies sourced from certified manufacturers for reliable construction projects.',
    image: '/assets/construction-materials/construction-materials-portland-cement-almazahir.webp',
    slug: 'construction-materials',
    products: [
      {
        id: 'cement',
        name: 'Portland Cement',
        description: 'High-grade Portland cement for structural construction',
        image: '/assets/construction-materials/construction-materials-portland-cement-almazahir.webp',
        category: 'construction-materials'
      },
      {
        id: 'steel-rebar',
        name: 'Steel Rebar',
        description: 'Reinforcement steel bars in various grades and sizes',
        image: '/assets/construction-materials/construction-materials-steel-rebar-almazahir.webp',
        category: 'construction-materials'
      },
      {
        id: 'concrete-blocks',
        name: 'Concrete Blocks',
        description: 'Lightweight concrete blocks for efficient construction',
        image: '/assets/construction-materials/construction-materials-concrete-blocks-almazahir.webp',
        category: 'construction-materials'
      },
      {
        id: 'cement-bags',
        name: 'Cement Bags',
        description: 'Premium quality cement in convenient packaging',
        image: '/assets/construction-materials/construction-materials-cement-bags-almazahir.webp',
        category: 'construction-materials'
      }
    ]
  },
  {
    id: 'tools-machinery',
    name: 'Tools & Machinery',
    description: 'Professional-grade tools and machinery including power tools, hand tools, and industrial equipment for construction, maintenance, and manufacturing operations.',
    image: '/assets/tools-machinery/tools-machinery-welding-machine-almazahir.webp',
    slug: 'tools-machinery',
    products: [
      {
        id: 'power-drill',
        name: 'Industrial Power Drill',
        description: 'Heavy-duty cordless drill with multiple speed settings',
        image: '/assets/tools-machinery/tools-machinery-power-drill-almazahir.webp',
        category: 'tools-machinery'
      },
      {
        id: 'angle-grinder',
        name: 'Angle Grinder',
        description: 'High-performance angle grinder for cutting and grinding',
        image: '/assets/tools-machinery/tools-machinery-angle-grinder-almazahir.webp',
        category: 'tools-machinery'
      },
      {
        id: 'welding-machine',
        name: 'Welding Machine',
        description: 'Professional arc welding machine with digital display',
        image: '/assets/tools-machinery/tools-machinery-welding-machine-almazahir.webp',
        category: 'tools-machinery'
      },
      {
        id: 'compressor',
        name: 'Air Compressor',
        description: 'Industrial air compressor for pneumatic tools',
        image: '/assets/tools-machinery/tools-machinery-compressor-almazahir.webp',
        category: 'tools-machinery'
      }
    ]
  },
  {
    id: 'industrial-supplies',
    name: 'Industrial Supplies',
    description: 'Essential industrial supplies including fasteners, adhesives, lubricants, and maintenance materials to keep operations running smoothly and efficiently.',
    image: '/assets/industrial-supplies/industrial-supplies-industrial-adhesive-almazahir.webp',
    slug: 'industrial-supplies',
    products: [
      {
        id: 'industrial-adhesive',
        name: 'Industrial Adhesive',
        description: 'High-strength structural adhesive for metal and composite bonding',
        image: '/assets/industrial-supplies/industrial-supplies-industrial-adhesive-almazahir.webp',
        category: 'industrial-supplies'
      },
      {
        id: 'lubricant',
        name: 'Industrial Lubricant',
        description: 'Multi-purpose industrial lubricant for machinery maintenance',
        image: '/assets/industrial-supplies/industrial-supplies-lubricant-almazahir.webp',
        category: 'industrial-supplies'
      },
      {
        id: 'fasteners',
        name: 'Fasteners Set',
        description: 'Stainless steel bolts, nuts, and washers in various sizes',
        image: '/assets/industrial-supplies/industrial-supplies-fasteners-almazahir.webp',
        category: 'industrial-supplies'
      },
      {
        id: 'chemicals',
        name: 'Industrial Chemicals',
        description: 'Specialized chemicals for industrial applications',
        image: '/assets/industrial-supplies/industrial-supplies-chemicals-almazahir.webp',
        category: 'industrial-supplies'
      }
    ]
  },
  {
    id: 'rental-equipment',
    name: 'Rental & Logistics Equipment',
    description: 'Equipment rental and logistics solutions including lifting equipment, transportation tools, and temporary infrastructure for project-based requirements.',
    image: '/assets/rental-equipment/rental-equipment-mobile-crane-almazahir.webp',
    slug: 'rental-equipment',
    products: [
      {
        id: 'forklift',
        name: 'Forklift Rental',
        description: 'Electric and diesel forklifts available for short and long-term rental',
        image: '/assets/rental-equipment/rental-equipment-forklift-almazahir.webp',
        category: 'rental-equipment'
      },
      {
        id: 'crane',
        name: 'Mobile Crane',
        description: 'Mobile cranes with certified operators for lifting operations',
        image: '/assets/rental-equipment/rental-equipment-mobile-crane-almazahir.webp',
        category: 'rental-equipment'
      },
      {
        id: 'scaffolding',
        name: 'Scaffolding System',
        description: 'Modular scaffolding systems for construction and maintenance work',
        image: '/assets/rental-equipment/rental-equipment-scaffolding-almazahir.webp',
        category: 'rental-equipment'
      }
    ]
  }
];