/**
 * Content for the six service pages built from the design handoff
 * "service pages" (Oct 2026): /demolition, /soft-strip-out, /site-hoarding,
 * /site-enabling-works, /sectors and /health-safety.
 *
 * All copy is taken verbatim from the PAGES object in the design file
 * (Surrey Contracting Service Pages.dc.html). The FAQ wording is
 * client-approved: do not edit it here without Ed's say-so. Each page's
 * `faqs` array is the single source for both the visible FAQ list and the
 * FAQPage JSON-LD (see src/components/ServicePage.astro).
 *
 * Images live in public/assets/img/services/<page>/, each with a -640.webp
 * variant for cards and small screens. Image slots follow IMGS in the design
 * file.
 */

export type ServiceImage = {
  src: string;
  w: number;
  h: number;
  src640: string;
  w640: number;
  h640: number;
  alt: string;
};

export type ProcessIcon = 'clip' | 'gear' | 'helmet' | 'truck' | 'shield' | 'digger' | 'search' | 'chart' | 'doc' | 'check';

export type ServicePageContent = {
  label: string;
  hero: {
    eyebrow: string;
    a: string;
    b: string;
    tag?: string;
    text: string;
    cta: string;
    cta2?: { label: string; href: string };
    img: ServiceImage;
  };
  intro: { eyebrow: string; h: string; paras: string[]; img?: ServiceImage };
  cols: 2 | 3;
  arrows: boolean;
  grey: boolean;
  cards: { t: string; d: string; img: ServiceImage; href?: string }[];
  process?: { eyebrow: string; h: string; steps: { t: string; d: string; icon: ProcessIcon }[] };
  accredStrip: boolean;
  splits: {
    eyebrow: string;
    h: string;
    paras: string[];
    img: ServiceImage;
    accred?: boolean;
    btn?: { label: string; href: string };
  }[];
  faqIntro?: string;
  faqs: { q: string; a: string }[];
  cta: { h: string; t: string };
  asbestosImg?: ServiceImage;
};

/** Stroke paths for the process-step icons (24x24 viewBox), from the design file. */
export const PROCESS_ICONS: Record<ProcessIcon, string> = {
  "clip": "M9 3h6v3H9zM7 4.5H5V21h14V4.5h-2M8.5 11h7M8.5 15h7",
  "gear": "M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9L7 7M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1",
  "helmet": "M3 18h18M5 18v-3a7 7 0 0114 0v3M10 8.5V5h4v3.5",
  "truck": "M2 6h12v10H2zM14 10h4l3 3v3h-7M6 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z",
  "shield": "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  "digger": "M2 20h11M4 20v-4h7v4M11 16l4-8 4 2-2 4M7 16v-3h3",
  "search": "M11 4a7 7 0 100 14 7 7 0 000-14zM16 16l5 5",
  "chart": "M5 20v-8M11 20V5M17 20v-11M3 20h18",
  "doc": "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3",
  "check": "M6 3h12v18H6zM9 9l1.5 1.5L13 8M9 15l1.5 1.5L13 14"
};

export const SERVICE_PAGES = {
  "demolition": {
    "label": "Residential & Commercial Demolition",
    "hero": {
      "eyebrow": "Demolition contractors",
      "a": "Demolition Contractors in Surrey & the Home Counties",
      "b": "Residential & Commercial Demolition",
      "text": "Safe, compliant and efficiently managed demolition services for residential and commercial properties across Surrey, London and the South East.",
      "cta": "Request a quote",
      "img": {
        "src": "/assets/img/services/demolition/demolition-hero.webp",
        "w": 1920,
        "h": 974,
        "src640": "/assets/img/services/demolition/demolition-hero-640.webp",
        "w640": 640,
        "h640": 325,
        "alt": "Surrey Contracting excavator demolishing a two-storey house, with brick rubble in the foreground"
      }
    },
    "intro": {
      "eyebrow": "Professional demolition services",
      "h": "Safe, controlled and efficiently managed demolition.",
      "paras": [
        "Surrey Contracting provides professional demolition services for residential and commercial buildings, from single properties to larger commercial structures.",
        "We manage each project from initial assessment through to completion, working safely, efficiently and in full compliance with current regulations. Our experienced team, modern equipment and structured approach ensure every demolition project is completed on time, on budget and with minimal disruption."
      ],
      "img": {
        "src": "/assets/img/services/demolition/demolition-excavator-skip.webp",
        "w": 1920,
        "h": 776,
        "src640": "/assets/img/services/demolition/demolition-excavator-skip-640.webp",
        "w640": 640,
        "h640": 259,
        "alt": "Surrey Contracting excavator on a residential demolition site beside a part-demolished house and a waste skip"
      }
    },
    "cols": 2,
    "arrows": true,
    "grey": false,
    "cards": [
      {
        "t": "Residential Demolition",
        "d": "Demolition of houses, bungalows, garages and outbuildings. We work with homeowners, developers and main contractors to safely remove residential properties and prepare sites for future development.",
        "img": {
          "src": "/assets/img/services/demolition/demolition-residential.webp",
          "w": 990,
          "h": 305,
          "src640": "/assets/img/services/demolition/demolition-residential-640.webp",
          "w640": 640,
          "h640": 197,
          "alt": "Excavator demolishing a brick-built detached house"
        }
      },
      {
        "t": "Commercial Demolition",
        "d": "Demolition of commercial buildings including offices, retail units, industrial units and public buildings. We deliver controlled demolition solutions tailored to each project and site environment.",
        "img": {
          "src": "/assets/img/services/demolition/demolition-commercial.webp",
          "w": 984,
          "h": 300,
          "src640": "/assets/img/services/demolition/demolition-commercial-640.webp",
          "w640": 640,
          "h640": 195,
          "alt": "Excavator taking down a steel-framed commercial building"
        }
      },
      {
        "t": "Partial & Selective Demolition",
        "d": "Careful removal of specific elements within a building, including extensions, single-storey sections and structural alterations, working to engineer specifications where required.",
        "img": {
          "src": "/assets/img/services/demolition/demolition-partial-selective.webp",
          "w": 990,
          "h": 293,
          "src640": "/assets/img/services/demolition/demolition-partial-selective-640.webp",
          "w640": 640,
          "h640": 189,
          "alt": "Excavator removing one section of a building during partial demolition"
        }
      },
      {
        "t": "Demolition Waste Management",
        "d": "We manage and remove all demolition waste, with segregation and recycling wherever possible. Waste is taken to authorised facilities with full documentation, ensuring an environmentally responsible approach.",
        "img": {
          "src": "/assets/img/services/demolition/demolition-crushing-recycling.webp",
          "w": 1920,
          "h": 748,
          "src640": "/assets/img/services/demolition/demolition-crushing-recycling-640.webp",
          "w640": 640,
          "h640": 249,
          "alt": "Surrey Contracting tracked crusher turning demolition rubble into recycled aggregate"
        }
      }
    ],
    "process": {
      "eyebrow": "Our approach",
      "h": "A structured approach to every project.",
      "steps": [
        {
          "t": "Site Assessment",
          "d": "We assess the building, site constraints and project requirements to develop the safest and most efficient demolition method.",
          "icon": "clip"
        },
        {
          "t": "Planning & Preparation",
          "d": "We prepare method statements, risk assessments and ensure all necessary approvals, surveys and services are in place.",
          "icon": "gear"
        },
        {
          "t": "Controlled Demolition",
          "d": "Our experienced team carry out the demolition works using the right equipment and techniques to ensure safety and minimal disruption.",
          "icon": "digger"
        },
        {
          "t": "Clearance & Handover",
          "d": "All materials are removed from site, segregated and recycled where possible, leaving a clean, safe site ready for the next phase.",
          "icon": "truck"
        }
      ]
    },
    "accredStrip": false,
    "splits": [
      {
        "eyebrow": "Safety & compliance",
        "h": "Delivering demolition safely and responsibly.",
        "paras": [
          "Safety, compliance and environmental responsibility are central to every project we undertake. We work in line with current regulations, providing method statements, risk assessments and site-specific RAMS.",
          "Where required, we coordinate surveys and licensed asbestos removal through specialist contractors. Surrey Contracting does not undertake licensed asbestos removal itself."
        ],
        "img": {
          "src": "/assets/img/services/demolition/demolition-safety-compliance.webp",
          "w": 1000,
          "h": 423,
          "src640": "/assets/img/services/demolition/demolition-safety-compliance-640.webp",
          "w640": 640,
          "h640": 271,
          "alt": "Excavator sorting timber and rubble on a residential demolition site"
        },
        "accred": true
      }
    ],
    "faqIntro": "If you have a question about a demolition project, here are some of the most common queries we receive. For anything else, just get in touch and our team will be happy to help.",
    "faqs": [
      {
        "q": "What types of buildings do you demolish?",
        "a": "We undertake residential and commercial demolition projects, including detached houses, bungalows, garages, outbuildings, commercial structures and more. Each project is assessed individually to establish the safest and most appropriate approach."
      },
      {
        "q": "Do you undertake complete and partial demolition?",
        "a": "Yes. We undertake complete building demolition as well as partial and selective demolition. Where structural elements are being retained or altered, the proposed works are subject to appropriate engineering assessments and demolition planning."
      },
      {
        "q": "Do I need planning permission to demolish a building?",
        "a": "Requirements vary depending on the building, its location and the proposed works. Planning permission, prior approval, listed building consent or demolition notices may be required. Section 80 of the Building Act 1984 also applies to many demolition projects, subject to specific exemptions."
      },
      {
        "q": "Can demolition take place close to neighbouring buildings?",
        "a": "Yes, where an appropriate demolition method can be developed. We assess neighbouring structures, access restrictions, public safety, structural stability and other site-specific risks before works begin."
      },
      {
        "q": "How do you deal with asbestos?",
        "a": "Suitable asbestos information and surveys must be available before works take place this can be arranged by your contractor or by yourself as the homeowner or developer. Where asbestos is found we can coordinate the work through appropriately HSE-licensed specialist contractors."
      },
      {
        "q": "What happens to demolition waste?",
        "a": "Materials are segregated on site, with suitable waste directed for recycling or recovery. Remaining waste is transferred through authorised waste management routes, supported by the appropriate documentation, we can carry out on site recycling on site also."
      },
      {
        "q": "How much does residential or commercial demolition cost?",
        "a": "Demolition costs depend on building size, construction type, access, surrounding properties, hazardous materials, waste quantities and the proposed method of work. We prepare project-specific quotations following a review of these requirements."
      }
    ],
    "cta": {
      "h": "Planning a demolition project?",
      "t": "Get in touch today to discuss your requirements and receive a tailored quotation."
    }
  },
  "stripout": {
    "label": "Soft Strip-Out & Internal Demolition",
    "hero": {
      "eyebrow": "Our services",
      "a": "Soft Strip-Out &",
      "b": "Internal Demolition",
      "tag": "Planned. Controlled. Efficient.",
      "text": "Commercial and residential soft strip services across Surrey, London and the South East.",
      "cta": "Request a quote",
      "cta2": {
        "label": "View our projects",
        "href": "/projects"
      },
      "img": {
        "src": "/assets/img/services/soft-strip-out/soft-strip-out-hero.webp",
        "w": 1620,
        "h": 1034,
        "src640": "/assets/img/services/soft-strip-out/soft-strip-out-hero-640.webp",
        "w640": 640,
        "h640": 408,
        "alt": "Operatives in hi-vis clearing partitions and ceiling materials during an internal strip-out"
      }
    },
    "intro": {
      "eyebrow": "Professional strip-out services",
      "h": "Preparing buildings for what comes next.",
      "paras": [
        "Our soft strip-out and internal demolition services prepare buildings for refurbishment, redevelopment or change of use.",
        "We remove non-loadbearing elements safely and efficiently, including internal walls, ceilings, fixtures, fittings and redundant services, leaving the building ready for the next phase of work.",
        "From single commercial units to larger residential and commercial buildings, our experienced team deliver a clean, compliant and well-managed strip-out service."
      ],
      "img": {
        "src": "/assets/img/services/soft-strip-out/soft-strip-out-office-floor.webp",
        "w": 988,
        "h": 525,
        "src640": "/assets/img/services/soft-strip-out/soft-strip-out-office-floor-640.webp",
        "w640": 640,
        "h640": 340,
        "alt": "Office floor stripped back to the ceiling grid, with a skip of strip-out waste"
      }
    },
    "cols": 3,
    "arrows": false,
    "grey": false,
    "cards": [
      {
        "t": "Commercial & Office Strip-Outs",
        "d": "Removal of internal partitions, ceilings, floor coverings, fixtures and fittings from offices, commercial units and industrial buildings.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-commercial-office.webp",
          "w": 993,
          "h": 455,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-commercial-office-640.webp",
          "w640": 640,
          "h640": 293,
          "alt": "Open-plan office stripped back to columns and an exposed ceiling grid"
        }
      },
      {
        "t": "Retail & Hospitality",
        "d": "Strip-out services for shops, restaurants, pubs and leisure facilities, including bar areas, kitchens, partitions and specialist fixtures.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-retail-hospitality.webp",
          "w": 981,
          "h": 452,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-retail-hospitality-640.webp",
          "w640": 640,
          "h640": 295,
          "alt": "Restaurant interior part way through strip-out, with the counter and pendant lights still in place"
        }
      },
      {
        "t": "Residential Strip-Outs",
        "d": "Internal strip-out for houses, apartments and residential developments, preparing properties for refurbishment or extension.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-residential.webp",
          "w": 990,
          "h": 462,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-residential-640.webp",
          "w640": 640,
          "h640": 299,
          "alt": "Residential kitchen and interior being stripped out ahead of refurbishment"
        }
      },
      {
        "t": "Partitions & Ceilings",
        "d": "Careful removal of non-loadbearing stud walls, glass partitions, suspended ceilings and associated finishes.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-partitions-ceilings.webp",
          "w": 993,
          "h": 435,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-partitions-ceilings-640.webp",
          "w640": 640,
          "h640": 280,
          "alt": "Metal stud partition framing and ceiling grid left exposed after the boards are removed"
        }
      },
      {
        "t": "M&E Strip-Out",
        "d": "Safe removal of redundant mechanical and electrical services, including ductwork, pipework, cabling and equipment.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-mechanical-electrical.webp",
          "w": 981,
          "h": 431,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-mechanical-electrical-640.webp",
          "w640": 640,
          "h640": 281,
          "alt": "Redundant ductwork and cabling in an open ceiling void"
        }
      },
      {
        "t": "Pre-Demolition Soft Strip",
        "d": "Internal strip-out ahead of full structural demolition, ensuring the safe removal of non-structural elements.",
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-pre-demolition.webp",
          "w": 989,
          "h": 438,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-pre-demolition-640.webp",
          "w640": 640,
          "h640": 283,
          "alt": "Building interior stripped to its structure, with debris piled ahead of demolition"
        }
      }
    ],
    "process": {
      "eyebrow": "Our process",
      "h": "A planned approach to every project.",
      "steps": [
        {
          "t": "Survey & Assess",
          "d": "We assess the building, understand the scope and identify any specific requirements.",
          "icon": "clip"
        },
        {
          "t": "Plan & Prepare",
          "d": "We develop a method statement, confirm access, welfare and logistics, and ensure all H&S measures are in place.",
          "icon": "gear"
        },
        {
          "t": "Controlled Strip-Out",
          "d": "Our experienced team carry out the works safely, efficiently and with minimal disruption.",
          "icon": "helmet"
        },
        {
          "t": "Clear & Handover",
          "d": "All materials are removed and waste is segregated and recycled where possible, leaving a clean site ready for the next phase.",
          "icon": "truck"
        }
      ]
    },
    "accredStrip": true,
    "splits": [
      {
        "eyebrow": "Responsible demolition",
        "h": "Safety, compliance & responsible waste management.",
        "paras": [
          "We work in line with all current regulations, providing method statements, risk assessments and site-specific RAMS for every project.",
          "Materials are segregated on site and recycled wherever possible, helping to reduce waste and minimise environmental impact.",
          "Where asbestos is identified, we do not carry out asbestos removal ourselves, but we work with licensed asbestos removal contractors to ensure the safe and compliant management of asbestos-containing materials."
        ],
        "img": {
          "src": "/assets/img/services/soft-strip-out/soft-strip-out-waste-segregation.webp",
          "w": 994,
          "h": 400,
          "src640": "/assets/img/services/soft-strip-out/soft-strip-out-waste-segregation-640.webp",
          "w640": 640,
          "h640": 258,
          "alt": "Stripped-out ceiling grid and boards stacked separately for recycling"
        }
      }
    ],
    "faqIntro": "If you have a question about a strip-out project, here are some of the most common queries we receive. For anything else, just get in touch.",
    "faqs": [
      {
        "q": "What is soft strip-out?",
        "a": "Soft strip-out involves the controlled removal of non-structural building elements, including fixtures, fittings, internal finishes, non-load-bearing partitions, suspended ceilings and redundant installations ahead of refurbishment or demolition."
      },
      {
        "q": "Do you undertake commercial and residential strip-outs?",
        "a": "Yes. We undertake soft strip-out works for residential properties and suitable commercial premises, including offices, shops and other buildings undergoing refurbishment or redevelopment."
      },
      {
        "q": "Can strip-out works take place in occupied buildings?",
        "a": "This depends on the building and proposed scope. Where areas remain occupied, additional controls may be required for access, dust, noise, services, fire safety and segregation of the works."
      },
      {
        "q": "Do you remove redundant electrical and mechanical installations?",
        "a": "We can undertake agreed strip-out of redundant building services following confirmation of safe isolation. Specialist disconnections and associated work are undertaken or verified by suitably competent contractors."
      },
      {
        "q": "Does soft strip-out include structural demolition?",
        "a": "No. Soft strip-out is primarily concerned with non-structural materials and installations. The removal of load-bearing elements or structural alterations requires a separately planned and assessed demolition methodology."
      }
    ],
    "cta": {
      "h": "Planning a strip-out project?",
      "t": "Get in touch today to discuss your requirements and receive a tailored quotation."
    }
  },
  "hoarding": {
    "label": "Site Hoarding & Security",
    "hero": {
      "eyebrow": "Demolition services",
      "a": "Site Hoarding &",
      "b": "Security",
      "tag": "Secure sites. Controlled access. Professional protection.",
      "text": "Site hoarding, temporary fencing and perimeter security for residential and commercial demolition projects across Surrey, London and the South East.",
      "cta": "Request a quote",
      "cta2": {
        "label": "Our demolition services",
        "href": "/demolition"
      },
      "img": {
        "src": "/assets/img/services/site-hoarding/site-hoarding-hero.webp",
        "w": 1916,
        "h": 1027,
        "src640": "/assets/img/services/site-hoarding/site-hoarding-hero-640.webp",
        "w640": 640,
        "h640": 343,
        "alt": "Black timber hoarding around a house being demolished, with an excavator behind"
      }
    },
    "intro": {
      "eyebrow": "Site hoarding & security",
      "h": "Protecting your site from the outset.",
      "paras": [
        "Surrey Contracting provides practical site hoarding, temporary fencing and perimeter security for demolition projects.",
        "We install secure, robust and professional site boundaries to protect the public, neighbouring properties and your development. Our solutions are tailored to each site, whether it's a single residential property or a larger commercial project."
      ],
      "img": {
        "src": "/assets/img/services/site-hoarding/site-hoarding-demolition-site.webp",
        "w": 980,
        "h": 453,
        "src640": "/assets/img/services/site-hoarding/site-hoarding-demolition-site-640.webp",
        "w640": 640,
        "h640": 296,
        "alt": "Black timber site hoarding along the pavement in front of a house under demolition"
      }
    },
    "cols": 3,
    "arrows": false,
    "grey": false,
    "cards": [
      {
        "t": "Solid Site Hoarding",
        "d": "Robust timber hoarding to secure demolition sites, prevent unauthorised access and maintain a clean, professional appearance.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-solid-timber.webp",
          "w": 991,
          "h": 432,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-solid-timber-640.webp",
          "w640": 640,
          "h640": 279,
          "alt": "Solid black timber hoarding running along a pavement"
        }
      },
      {
        "t": "Surface-Mounted Hoarding",
        "d": "Hoarding installed to existing hard surfaces using appropriate mounting systems, ideal for urban and restricted sites.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-surface-mounted.webp",
          "w": 965,
          "h": 420,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-surface-mounted-640.webp",
          "w640": 640,
          "h640": 279,
          "alt": "Black hoarding mounted on concrete blocks beside a road"
        }
      },
      {
        "t": "Dug-In Timber Hoarding",
        "d": "Timber hoarding installed into the ground for maximum stability on sites where surface mounting is not suitable.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-dug-in-timber.webp",
          "w": 963,
          "h": 414,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-dug-in-timber-640.webp",
          "w640": 640,
          "h640": 275,
          "alt": "Black timber hoarding fixed to timber posts set into the ground"
        }
      },
      {
        "t": "Temporary Security Fencing",
        "d": "Heras fencing and temporary barriers for short-term security, phase works and areas outside the main hoarding line.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-temporary-fencing.webp",
          "w": 991,
          "h": 421,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-temporary-fencing-640.webp",
          "w640": 640,
          "h640": 272,
          "alt": "Temporary mesh security fencing around a cleared site"
        }
      },
      {
        "t": "Vehicle & Pedestrian Gates",
        "d": "Secure access gates for controlled entry and exit, including pedestrian and vehicle gates to suit your site requirements.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-gates.webp",
          "w": 965,
          "h": 409,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-gates-640.webp",
          "w640": 640,
          "h640": 271,
          "alt": "Double vehicle gates set into black timber hoarding"
        }
      },
      {
        "t": "CCTV & Alarm Coordination",
        "d": "CCTV and alarm systems to monitor and protect your site, arranged via our trusted specialist partners.",
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-cctv.webp",
          "w": 966,
          "h": 403,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-cctv-640.webp",
          "w640": 640,
          "h640": 267,
          "alt": "CCTV camera mounted on black site hoarding"
        }
      }
    ],
    "process": {
      "eyebrow": "Our process",
      "h": "A planned approach to site security.",
      "steps": [
        {
          "t": "Site Assessment",
          "d": "We assess your site, access requirements, surrounding properties and specific risks.",
          "icon": "clip"
        },
        {
          "t": "Planning & Design",
          "d": "We recommend the most suitable hoarding and security solution for your project.",
          "icon": "gear"
        },
        {
          "t": "Installation",
          "d": "Our experienced team install the hoarding, gates and security systems efficiently and safely.",
          "icon": "helmet"
        },
        {
          "t": "Inspection & Handover",
          "d": "We carry out final checks to ensure everything is secure, stable and compliant.",
          "icon": "shield"
        }
      ]
    },
    "accredStrip": true,
    "splits": [
      {
        "eyebrow": "Safety & compliance",
        "h": "Safety, security & compliance.",
        "paras": [
          "Our site hoarding and security measures are installed in line with current regulations and industry best practice. We consider site-specific risks, pedestrian routes, neighbouring properties and access requirements.",
          "Hoarding is designed and installed to withstand site conditions, including wind loading and ground conditions. Where required, we work with engineers to ensure appropriate design and temporary works solutions.",
          "Our aim is to provide safe, secure and professional site boundaries throughout the demolition programme."
        ],
        "img": {
          "src": "/assets/img/services/site-hoarding/site-hoarding-street-signage.webp",
          "w": 1000,
          "h": 394,
          "src640": "/assets/img/services/site-hoarding/site-hoarding-street-signage-640.webp",
          "w640": 640,
          "h640": 252,
          "alt": "Black site hoarding with safety signage along a residential street"
        }
      }
    ],
    "faqIntro": "If you have a question about site hoarding or security for your demolition project, here are some of the most common queries we receive. For anything else, just get in touch.",
    "faqs": [
      {
        "q": "What types of site hoarding do you provide?",
        "a": "We provide suitable site boundary solutions, including solid hoarding, temporary security fencing, surface-mounted systems and dug-in arrangements, depending on the site conditions and project requirements."
      },
      {
        "q": "Can you install hoarding around residential demolition sites?",
        "a": "Yes. We can provide hoarding and perimeter protection for individual residential demolition sites and commercial projects, including locations with restricted access or neighbouring properties."
      },
      {
        "q": "Does site hoarding require an engineering design?",
        "a": "Hoarding forms part of the site’s temporary works. Appropriate design and checks may be required, taking account of wind loading, stability, ground conditions, height, location and public safety."
      },
      {
        "q": "Can hoarding be installed next to a pavement or public road?",
        "a": "Yes, where appropriate arrangements and permissions are in place. Hoarding affecting the public highway may require local authority approval, licences and additional public protection measures."
      },
      {
        "q": "Can you provide CCTV and site security systems?",
        "a": "Where additional security is required, we can coordinate CCTV, alarms and related arrangements through specialist security partners."
      }
    ],
    "cta": {
      "h": "Planning a demolition project?",
      "t": "Get in touch today to discuss your requirements and receive a tailored quotation."
    }
  },
  "enabling": {
    "label": "Site Enabling Works",
    "hero": {
      "eyebrow": "Home / Services / Site Enabling Works",
      "a": "Site Enabling",
      "b": "Works",
      "tag": "Preparing sites for what comes next.",
      "text": "Planned, controlled enabling packages for developers, contractors and commercial clients across Surrey, London and the South East.",
      "cta": "Request a quote",
      "cta2": {
        "label": "View our projects",
        "href": "/projects"
      },
      "img": {
        "src": "/assets/img/services/site-enabling-works/site-enabling-hero.webp",
        "w": 1920,
        "h": 994,
        "src640": "/assets/img/services/site-enabling-works/site-enabling-hero-640.webp",
        "w640": 640,
        "h640": 331,
        "alt": "Surrey Contracting excavator on a cleared site enclosed by temporary fencing"
      }
    },
    "intro": {
      "eyebrow": "Early works, fully managed",
      "h": "A clear site. A controlled start.",
      "paras": [
        "We deliver site enabling works to create safe, accessible and ready-to-build sites. From initial clearance and demolition through to ground preparation, we coordinate the early stages of a project, managing interfaces and specialist contractors to keep your programme on track.",
        "Working with developers, main contractors and commercial clients, we provide practical, cost-effective solutions with a strong focus on safety, compliance and minimal disruption."
      ],
      "img": {
        "src": "/assets/img/services/site-enabling-works/site-enabling-excavator.webp",
        "w": 1920,
        "h": 777,
        "src640": "/assets/img/services/site-enabling-works/site-enabling-excavator-640.webp",
        "w640": 640,
        "h640": 259,
        "alt": "Surrey Contracting excavator working on a cleared site with spoil and temporary fencing"
      }
    },
    "cols": 3,
    "arrows": true,
    "grey": false,
    "cards": [
      {
        "t": "Site Clearance",
        "d": "Vegetation, structures and obstructions removed to leave a clear, safe and workable site.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-site-clearance.webp",
          "w": 1920,
          "h": 694,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-site-clearance-640.webp",
          "w640": 640,
          "h640": 231,
          "alt": "Cleared and levelled site with new timber post boundary fencing"
        }
      },
      {
        "t": "Demolition & Soft Strip",
        "d": "Controlled demolition and soft strip, coordinated with accredited and licensed partners where required.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-demolition.webp",
          "w": 1920,
          "h": 696,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-demolition-640.webp",
          "w640": 640,
          "h640": 232,
          "alt": "Surrey Contracting excavator demolishing a brick building, with rubble in the foreground"
        },
        "href": "/demolition"
      },
      {
        "t": "Hoarding & Temporary Access",
        "d": "Secure site hoarding, gates and temporary access solutions to keep sites safe and operational.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-hoarding-access.webp",
          "w": 1920,
          "h": 693,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-hoarding-access-640.webp",
          "w640": 640,
          "h640": 231,
          "alt": "Black site hoarding with signage and temporary mesh fencing at a site entrance"
        },
        "href": "/site-hoarding"
      },
      {
        "t": "Service Coordination",
        "d": "We coordinate utility diversions and disconnections with specialist, accredited contractors.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-service-trench.webp",
          "w": 1920,
          "h": 713,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-service-trench-640.webp",
          "w640": 640,
          "h640": 238,
          "alt": "Open trench with a water main and service ducts laid in it"
        }
      },
      {
        "t": "Crushing & Waste Management",
        "d": "On-site crushing, waste removal and responsible disposal to reduce cost and environmental impact.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-crushing.webp",
          "w": 1920,
          "h": 714,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-crushing-640.webp",
          "w640": 640,
          "h640": 238,
          "alt": "Surrey Contracting tracked crusher processing rubble on site"
        }
      },
      {
        "t": "Ground Preparation",
        "d": "Final trim, grading and preparation to take the site through to groundworks and construction.",
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-ground-preparation.webp",
          "w": 1920,
          "h": 714,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-ground-preparation-640.webp",
          "w640": 640,
          "h640": 238,
          "alt": "Roller compacting prepared ground on a cleared development site"
        },
        "href": "/groundworks"
      }
    ],
    "process": {
      "eyebrow": "Our process",
      "h": "A structured approach to site enabling.",
      "steps": [
        {
          "t": "Survey & plan",
          "d": "Assess the site, agree scope, programme and coordinate specialist requirements.",
          "icon": "doc"
        },
        {
          "t": "Secure & make safe",
          "d": "Install hoarding, temporary access and make the site safe for works to begin.",
          "icon": "helmet"
        },
        {
          "t": "Clear & prepare",
          "d": "Complete demolition, clear materials and prepare the site to the required standard.",
          "icon": "digger"
        },
        {
          "t": "Handover",
          "d": "A clean, safe, well-prepared site ready for the next phase.",
          "icon": "check"
        }
      ]
    },
    "accredStrip": true,
    "splits": [
      {
        "eyebrow": "Recent projects",
        "h": "One contractor, from enabling to groundworks.",
        "paras": [
          "We work on a range of developments across Surrey, London and the South East, delivering enabling works as a stand-alone package or as part of a full groundworks solution. Take a look at some of our recent projects."
        ],
        "img": {
          "src": "/assets/img/services/site-enabling-works/site-enabling-cleared-site.webp",
          "w": 1920,
          "h": 699,
          "src640": "/assets/img/services/site-enabling-works/site-enabling-cleared-site-640.webp",
          "w640": 640,
          "h640": 233,
          "alt": "Excavator on a cleared development site behind temporary fencing"
        },
        "btn": {
          "label": "View our projects",
          "href": "/projects"
        }
      }
    ],
    "faqIntro": "If you have a question about site enabling works, here are some of the most common queries we receive. For anything else, just get in touch.",
    "faqs": [
      {
        "q": "What are site enabling works?",
        "a": "Site enabling works are the preliminary activities required to make a site accessible, safe and ready for the main construction programme. These can include vegetation and obstruction clearance, site establishment, temporary access and preparatory site arrangements."
      },
      {
        "q": "Do you provide temporary access roads and working areas?",
        "a": "Yes. We can undertake temporary access and working-area preparation, with the proposed construction and any necessary design or loading requirements determined by the conditions and intended use."
      },
      {
        "q": "Can you prepare overgrown or previously unused sites?",
        "a": "Yes. Our enabling works can include the removal of vegetation, surface obstructions and unwanted materials, subject to relevant environmental restrictions, surveys and project requirements."
      },
      {
        "q": "Can you coordinate existing services before construction?",
        "a": "We can assist with identifying and coordinating the requirements for existing utilities and service interfaces. Any necessary isolations, diversions or specialist connections are undertaken by the appropriate authorised providers or competent contractors."
      },
      {
        "q": "When are enabling works normally undertaken?",
        "a": "Enabling works generally take place ahead of the principal construction activities. The extent and sequence depend on site conditions, access requirements, surveys, permissions and the overall development programme."
      }
    ],
    "cta": {
      "h": "Planning a site?",
      "t": "Get in touch to discuss your enabling works and find out how we can help get your project off to the right start."
    }
  },
  "sectors": {
    "label": "Sectors",
    "hero": {
      "eyebrow": "Sectors",
      "a": "Sectors",
      "b": "We Work In",
      "tag": "Demolition, Site Enabling, Earthworks & Groundworks.",
      "text": "Supporting developers, main contractors and commercial clients across Surrey, London and the South East.",
      "cta": "Request a quote",
      "img": {
        "src": "/assets/img/services/sectors/sectors-hero.webp",
        "w": 1620,
        "h": 924,
        "src640": "/assets/img/services/sectors/sectors-hero-640.webp",
        "w640": 640,
        "h640": 365,
        "alt": "Excavator demolishing a brick house behind temporary fencing"
      }
    },
    "intro": {
      "eyebrow": "Sectors",
      "h": "Experience across a range of sectors.",
      "paras": [
        "We work with developers, main contractors, commercial clients, local authorities and private clients across a range of sectors.",
        "Our team has the experience, resources and flexibility to deliver demolition, site enabling, bulk earthworks and groundworks in live environments, with consideration for access restrictions, neighbouring properties and occupied sites."
      ]
    },
    "cols": 2,
    "arrows": true,
    "grey": true,
    "cards": [
      {
        "t": "Education",
        "d": "We support schools, colleges and universities with demolition, site enabling, earthworks and groundworks, working to programme and with minimal disruption to live environments.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-education.webp",
          "w": 1000,
          "h": 261,
          "src640": "/assets/img/services/sectors/sectors-education-640.webp",
          "w640": 640,
          "h640": 167,
          "alt": "Modern school building in brick and grey cladding"
        }
      },
      {
        "t": "Hotels & Leisure",
        "d": "We work with hotel operators and leisure providers on demolition, site preparation and groundworks, helping to create safe, efficient sites ready for redevelopment or refurbishment.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-hotels-leisure.webp",
          "w": 989,
          "h": 259,
          "src640": "/assets/img/services/sectors/sectors-hotels-leisure-640.webp",
          "w640": 640,
          "h640": 168,
          "alt": "Hotel and leisure building in stone and dark timber cladding"
        }
      },
      {
        "t": "Retail & High Street",
        "d": "We undertake demolition and enabling works for retail units, high street premises and mixed-use developments, with careful planning around access, public safety and neighbouring businesses.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-retail-high-street.webp",
          "w": 1000,
          "h": 262,
          "src640": "/assets/img/services/sectors/sectors-retail-high-street-640.webp",
          "w640": 640,
          "h640": 168,
          "alt": "Row of high street shops with flats above"
        }
      },
      {
        "t": "Housebuilders & Residential",
        "d": "From individual plots to multi-unit developments, we provide demolition, site enabling, bulk earthworks and groundworks for housebuilders and residential developers.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-housebuilders-residential.webp",
          "w": 988,
          "h": 259,
          "src640": "/assets/img/services/sectors/sectors-housebuilders-residential-640.webp",
          "w640": 640,
          "h640": 168,
          "alt": "New-build brick detached houses on a residential development"
        }
      },
      {
        "t": "Local Authority & Public Sector",
        "d": "We deliver demolition, site enabling and groundworks for local authorities and public sector bodies, working to strict compliance, H&S and environmental requirements.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-public-sector.webp",
          "w": 1000,
          "h": 234,
          "src640": "/assets/img/services/sectors/sectors-public-sector-640.webp",
          "w640": 640,
          "h640": 150,
          "alt": "Modern public sector building in brick and grey cladding"
        }
      },
      {
        "t": "Commercial & Industrial",
        "d": "We support commercial and industrial clients with demolition, site preparation, earthworks and groundworks for new builds, extensions and redevelopment projects.",
        "img": {
          "src": "/assets/img/services/sectors/sectors-commercial-industrial.webp",
          "w": 989,
          "h": 232,
          "src640": "/assets/img/services/sectors/sectors-commercial-industrial-640.webp",
          "w640": 640,
          "h640": 150,
          "alt": "Clad industrial unit with roller shutter doors"
        }
      }
    ],
    "accredStrip": false,
    "splits": [],
    "faqs": [],
    "cta": {
      "h": "Discuss your next project.",
      "t": "Talk to our team about your requirements and receive a tailored quotation."
    }
  },
  "hs": {
    "label": "Health & Safety",
    "hero": {
      "eyebrow": "Health & safety",
      "a": "Health &",
      "b": "Safety",
      "tag": "Planned. Managed. Monitored.",
      "text": "We are committed to providing a safe working environment for our employees, clients, and the public, on every project we undertake.",
      "cta": "Our approach",
      "img": {
        "src": "/assets/img/services/health-safety/health-safety-hero.webp",
        "w": 1920,
        "h": 1551,
        "src640": "/assets/img/services/health-safety/health-safety-hero-640.webp",
        "w640": 640,
        "h640": 517,
        "alt": "Site supervisor in Surrey Contracting hi-vis watching an excavator demolish a building"
      }
    },
    "intro": {
      "eyebrow": "Our approach",
      "h": "Delivering projects safely and responsibly.",
      "paras": [
        "We take a proactive and practical approach to health and safety, ensuring risks are identified, controlled and regularly reviewed throughout the project lifecycle.",
        "Our team works in accordance with current legislation, industry guidance and best practice, with clear planning, competent supervision and a strong safety culture across all our sites."
      ],
      "img": {
        "src": "/assets/img/services/health-safety/health-safety-supervision.webp",
        "w": 1920,
        "h": 1027,
        "src640": "/assets/img/services/health-safety/health-safety-supervision-640.webp",
        "w640": 640,
        "h640": 342,
        "alt": "Two Surrey Contracting supervisors in hard hats overseeing an excavator on a demolition site"
      }
    },
    "cols": 3,
    "arrows": false,
    "grey": false,
    "cards": [
      {
        "t": "Project Planning & CDM Compliance",
        "d": "We plan our works in line with the CDM Regulations, with project-specific risk assessments, method statements and site arrangements in place from the outset.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-planning-cdm.webp",
          "w": 1920,
          "h": 950,
          "src640": "/assets/img/services/health-safety/health-safety-planning-cdm-640.webp",
          "w640": 640,
          "h640": 317,
          "alt": "Construction drawings, a spirit level and a Surrey Contracting hard hat"
        }
      },
      {
        "t": "Demolition & Structural Safety",
        "d": "Our demolition works are carefully planned and methodically controlled, with consideration for structural stability, neighbouring properties and site-specific risks.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-demolition.webp",
          "w": 1920,
          "h": 1004,
          "src640": "/assets/img/services/health-safety/health-safety-demolition-640.webp",
          "w640": 640,
          "h640": 335,
          "alt": "Excavator demolishing a brick house, with structural debris on the ground"
        }
      },
      {
        "t": "Plant, Excavations & Site Safety",
        "d": "We maintain safe systems of work for all plant and excavation activities, including exclusion zones, bank stability or support, and regular inspections.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-excavation-support.webp",
          "w": 1920,
          "h": 998,
          "src640": "/assets/img/services/health-safety/health-safety-excavation-support-640.webp",
          "w640": 640,
          "h640": 333,
          "alt": "Trench supported by timber shoring and steel struts, with red and white barriers"
        }
      },
      {
        "t": "Occupational Health & Environmental Controls",
        "d": "We manage dust, noise, vibration and other site-related risks, with suitable control measures to protect our workforce, nearby occupiers and the wider environment.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-dust-suppression.webp",
          "w": 1920,
          "h": 1022,
          "src640": "/assets/img/services/health-safety/health-safety-dust-suppression-640.webp",
          "w640": 640,
          "h640": 341,
          "alt": "Operative damping down demolition dust with a water spray"
        }
      },
      {
        "t": "Training, Competence & Supervision",
        "d": "Our team receive relevant training and induction, with competent supervision to ensure they can carry out their roles safely and effectively.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-training-supervision.webp",
          "w": 1920,
          "h": 1081,
          "src640": "/assets/img/services/health-safety/health-safety-training-supervision-640.webp",
          "w640": 640,
          "h640": 360,
          "alt": "Surrey Contracting operatives in hard hats and hi-vis supervising works on site"
        }
      },
      {
        "t": "Monitoring, Reporting & Improvement",
        "d": "We carry out regular inspections, audits and reviews, learning from feedback, near misses and incidents to continually improve our performance.",
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-inspection-checklist.webp",
          "w": 1920,
          "h": 1074,
          "src640": "/assets/img/services/health-safety/health-safety-inspection-checklist-640.webp",
          "w640": 640,
          "h640": 358,
          "alt": "Site inspection checklist being completed on a clipboard"
        }
      }
    ],
    "process": {
      "eyebrow": "Our process",
      "h": "A structured approach to safety.",
      "steps": [
        {
          "t": "Pre-Construction Review",
          "d": "We assess project information, identify key risks and agree responsibilities.",
          "icon": "doc"
        },
        {
          "t": "Planning & Preparation",
          "d": "Detailed method statements, risk assessments and site arrangements.",
          "icon": "gear"
        },
        {
          "t": "Controlled Delivery",
          "d": "Works are carried out under competent supervision, with regular monitoring and inspections.",
          "icon": "helmet"
        },
        {
          "t": "Review & Handover",
          "d": "We review performance, capture lessons learned and close out documentation.",
          "icon": "chart"
        }
      ]
    },
    "accredStrip": false,
    "splits": [
      {
        "eyebrow": "Working responsibly",
        "h": "Protecting workers, neighbours and the public.",
        "paras": [
          "We recognise our responsibility to protect everyone affected by our work, including our workforce, clients, subcontractors, neighbouring properties and members of the public.",
          "We implement appropriate site controls, traffic management, hoarding and security measures, and maintain clear communication throughout the project.",
          "Our aim is to deliver safe, efficient and compliant projects with minimal disruption to the surrounding area."
        ],
        "img": {
          "src": "/assets/img/services/health-safety/health-safety-public-protection.webp",
          "w": 1920,
          "h": 945,
          "src640": "/assets/img/services/health-safety/health-safety-public-protection-640.webp",
          "w640": 640,
          "h640": 315,
          "alt": "Demolition site hoarding with Danger and Keep out signs, excavator behind"
        }
      }
    ],
    "faqs": [],
    "cta": {
      "h": "Discuss your project requirements.",
      "t": "Talk to our team about how we manage health and safety on your project."
    },
    "asbestosImg": {
      "src": "/assets/img/services/health-safety/health-safety-asbestos-waste.webp",
      "w": 1920,
      "h": 888,
      "src640": "/assets/img/services/health-safety/health-safety-asbestos-waste-640.webp",
      "w640": 640,
      "h640": 296,
      "alt": "Wrapped asbestos waste labelled Caution Asbestos Do Not Open"
    }
  }
} satisfies Record<string, ServicePageContent>;

/** Sectors page, "Our Core Services" band: copy from the design file (services list in renderVals). */
export const SECTORS_CORE_SERVICES: { t: string; d: string; href: string; img: ServiceImage }[] = [
  {
    "t": "Residential & Commercial Demolition",
    "d": "Planned, controlled demolition for residential and commercial buildings.",
    "href": "/demolition",
    "img": {
      "src": "/assets/img/services/sectors/sectors-service-demolition.webp",
      "w": 990,
      "h": 398,
      "src640": "/assets/img/services/sectors/sectors-service-demolition-640.webp",
      "w640": 640,
      "h640": 257,
      "alt": "Excavator demolishing a brick house"
    }
  },
  {
    "t": "Site Enabling Works",
    "d": "Site clearance, temporary access, site establishment and preparatory works.",
    "href": "/site-enabling-works",
    "img": {
      "src": "/assets/img/services/sectors/sectors-service-site-enabling.webp",
      "w": 990,
      "h": 401,
      "src640": "/assets/img/services/sectors/sectors-service-site-enabling-640.webp",
      "w640": 640,
      "h640": 259,
      "alt": "Cleared site enclosed by temporary mesh fencing"
    }
  },
  {
    "t": "Bulk Earthworks",
    "d": "Bulk excavation, cut and fill, grading and ground reprofiling for development sites.",
    "href": "/earthworks",
    "img": {
      "src": "/assets/img/services/sectors/sectors-service-earthworks.webp",
      "w": 990,
      "h": 401,
      "src640": "/assets/img/services/sectors/sectors-service-earthworks-640.webp",
      "w640": 640,
      "h640": 259,
      "alt": "Excavator beside a stockpile of excavated soil"
    }
  },
  {
    "t": "Groundworks",
    "d": "Foundations, drainage, slabs and substructure works to DPC level.",
    "href": "/groundworks",
    "img": {
      "src": "/assets/img/services/sectors/sectors-service-groundworks.webp",
      "w": 990,
      "h": 398,
      "src640": "/assets/img/services/sectors/sectors-service-groundworks-640.webp",
      "w640": 640,
      "h640": 257,
      "alt": "Blockwork foundations and substructure on a residential site"
    }
  }
];
