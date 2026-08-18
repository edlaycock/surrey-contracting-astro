# Surfacing Removal — Discovery Inventory (Part A)

Generated on 2026-08-18 from branch `claude/see-attached-kkhu2w` prior to any removal work.
Search terms: `surfacing`, `tarmac`, `resin`, `car park`, `carpark`, `resurfac`, `asphalt` (case-insensitive).
Scope: `src/`, `public/`, `studio/`, `docs/`, `astro.config.mjs`, plus Sanity content documents (queried live via the Sanity API, project `mhqgpyb9`, dataset `production`).

> Note: the brief assumed a Next.js front end; this repo is **Astro 6 + Sanity**. Mechanisms map as follows: redirects → `astro.config.mjs` `redirects` (server-side 301 via the Node adapter); sitemap → `@astrojs/sitemap` (emits `/sitemap-index.xml` + `/sitemap-0.xml`); page metadata → per-page `BaseLayout` props.

## 1. Code & content matches (file : line : text)

```
src/components/UtilityBar.astro:6:      <span>Demolition, Groundworks, Earthworks &amp; Surfacing across Surrey &amp; the Home Counties</span>
src/components/Footer.astro:18:      <a href="/surfacing">Commercial Surfacing</a>
src/components/Nav.astro:24:          <a href="/surfacing" role="menuitem">Commercial Surfacing</a>
src/components/Nav.astro:56:        <a href="/surfacing">Commercial Surfacing</a>
src/scripts/app.js:33:const wordsCount = 3; // Groundworks, Bulk Earthworks, Commercial Surfacing (last duplicate for seamless loop)
src/pages/contact.astro:6:  description="Contact Surrey Contracting Limited to request a quote for groundworks, earthworks or surfacing across Surrey. Call 01932 932650."
src/pages/contact.astro:75:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/projects.astro:10:  description="Recent groundworks, earthworks and surfacing projects delivered across Surrey, commercial, residential and public sector."
src/pages/surfacing.astro:11:      "name": "What commercial surfacing services does Surrey Contracting offer?",
src/pages/surfacing.astro:12:      "acceptedAnswer": { "@type": "Answer", "text": "Surrey Contracting provides tarmac, resin-bound, block paving and concrete surfaces for car parks, access roads, industrial estates, distribution yards, schools, playgrounds and public spaces. Services also include reinstatement and repair, edging and kerbing, line marking, speed bumps and drainage." }
src/pages/surfacing.astro:16:      "name": "Can Surrey Contracting resurface car parks and access roads in Surrey?",
src/pages/surfacing.astro:17:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Surrey Contracting handles new-build car park construction and overlay or resurfacing of existing car parks. The team installs tarmac, resin-bound, block paving and concrete surfaces, along with line marking, speed bumps, bollards and drainage." }
src/pages/surfacing.astro:21:      "name": "Do you carry out emergency surfacing repairs?",
src/pages/surfacing.astro:22:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Surrey Contracting's reactive surfacing team carries permanent and temporary repair materials and responds quickly to urgent requirements including utility reinstatement, surface patch repairs and emergency resurfacing." }
src/pages/surfacing.astro:27:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Surrey Contracting offers phased delivery, weekend working and night-shift surfacing to minimise disruption to business operations, schools and public spaces." }
src/pages/surfacing.astro:31:      "name": "What areas does Surrey Contracting cover for commercial surfacing?",
src/pages/surfacing.astro:32:      "acceptedAnswer": { "@type": "Answer", "text": "Surrey Contracting covers Surrey, London and the South East for commercial surfacing, operating from its base between Cobham and Leatherhead. Areas include Guildford, Woking, Esher, Epsom, Weybridge, Reigate, Dorking, Kingston and the wider M25 corridor." }
src/pages/surfacing.astro:38:  title="Commercial Surfacing | Surrey Contracting Limited"
src/pages/surfacing.astro:39:  description="Specialist commercial surfacing across Surrey, London &amp; South East, residential, commercial, car parks, roadways, schools, industrial estates, reinstatement and kerbing."
src/pages/surfacing.astro:40:  path="/surfacing"
src/pages/surfacing.astro:43:  <ServiceSchema slot="head" name="Commercial Surfacing" slug="surfacing" description="Specialist commercial surfacing across Surrey, London &amp; South East, residential, commercial, car parks, roadways, schools, industrial estates, reinstatement and kerbing." />
src/pages/surfacing.astro:48:    <div class="page-hero-img" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/surfacing.astro:57:      <span>Commercial Surfacing</span>
src/pages/surfacing.astro:59:    <h1 class="page-title">Commercial Surfacing</h1>
src/pages/surfacing.astro:60:    <p class="page-lede">Specialist commercial surfacing across Surrey, London &amp; South East, residential, commercial, car parks, roadways, schools, industrial estates, reinstatement and kerbing.</p>
src/pages/surfacing.astro:67:      <span class="eyebrow">Commercial Surfacing</span>
src/pages/surfacing.astro:68:      <h2 class="section-title">Durable surfacing solutions for every environment.</h2>
src/pages/surfacing.astro:69:      <p class="section-lede">Surrey Contracting offers specialist commercial surfacing designed to withstand heavy use in commercial and industrial environments. From retail units and offices to warehouses, healthcare facilities, schools and public spaces, our professional surfacing solutions deliver safe, long-lasting, durable and visually appealing surfaces that mee
src/pages/surfacing.astro:77:      <div class="svc-detail-photo" style="background-image:url('/assets/img/services/surfacing-hero.jpg')"></div>
src/pages/surfacing.astro:80:      <h2 class="section-title">Commercial Surfacing</h2>
src/pages/surfacing.astro:81:      <p class="lede-dark">Our commercial surfacing services cover the full spectrum of external works for businesses, developers and public-sector clients. We install new tarmac, resin-bound, block paving and concrete surfaces for commercial premises, car parks, access roads, industrial estates and distribution yards. Every project is planned to minimise disruption to
src/pages/surfacing.astro:83:        <li>Tarmac surfacing</li>
src/pages/surfacing.astro:84:        <li>Resin-bound surfaces</li>
src/pages/surfacing.astro:86:        <li>Concrete surfacing</li>
src/pages/surfacing.astro:97:      <div class="svc-detail-photo" style="background-image:url('/assets/img/services/surfacing-reinstatement.jpg')"></div>
src/pages/surfacing.astro:101:      <p class="lede-dark">We provide professional commercial reinstatement and repair surfacing solutions for businesses, contractors and property managers across Surrey, London and the South East. Our services are designed to restore damaged surfaces quickly, safely and to a high standard, minimising disruption while delivering long-lasting results. From utility rei
src/pages/surfacing.astro:105:        <li>Full resurfacing</li>
src/pages/surfacing.astro:119:      <h2 class="section-title">Car Park Surfacing</h2>
src/pages/surfacing.astro:120:      <p class="lede-dark">Car parks endure constant vehicle traffic, heavy use and exposure to the elements. Our tarmac, resin-bound, block paving and concrete surfacing solutions provide excellent long-term durability, keeping car parks functional and visually appealing for years with minimal maintenance. We handle everything from new-build car park construction to 
src/pages/surfacing.astro:122:        <li>New-build car parks</li>
src/pages/surfacing.astro:123:        <li>Overlay &amp; resurfacing</li>
src/pages/surfacing.astro:135:      <div class="svc-detail-photo" style="background-image:url('/assets/img/services/surfacing-schools.jpg')"></div>
src/pages/surfacing.astro:143:        <li>Permeable surfacing</li>
src/pages/surfacing.astro:159:      <p class="lede-dark">Alongside our surfacing solutions we provide professional edging and kerbing options that give your project a neat, tidy and defined finish. We install precast concrete kerbs, granite setts, conservation kerbing and block edging to suit the aesthetic and functional requirements of your project. Proper kerbing provides essential edge restrain
src/pages/surfacing.astro:175:      <h2 class="section-title">Commercial Surfacing FAQs</h2>
src/pages/surfacing.astro:179:        <summary>What commercial surfacing services does Surrey Contracting offer?</summary>
src/pages/surfacing.astro:180:        <p>Surrey Contracting provides tarmac, resin-bound, block paving and concrete surfaces for car parks, access roads, industrial estates, distribution yards, schools, playgrounds and public spaces. Services also include reinstatement and repair, edging and kerbing, line marking, speed bumps and drainage.</p>
src/pages/surfacing.astro:183:        <summary>Can Surrey Contracting resurface car parks and access roads in Surrey?</summary>
src/pages/surfacing.astro:184:        <p>Yes. Surrey Contracting handles new-build car park construction and overlay or resurfacing of existing car parks. The team installs tarmac, resin-bound, block paving and concrete surfaces, along with line marking, speed bumps, bollards and drainage.</p>
src/pages/surfacing.astro:187:        <summary>Do you carry out emergency surfacing repairs?</summary>
src/pages/surfacing.astro:188:        <p>Yes. Surrey Contracting's reactive surfacing team carries permanent and temporary repair materials and responds quickly to urgent requirements including utility reinstatement, surface patch repairs and emergency resurfacing.</p>
src/pages/surfacing.astro:192:        <p>Yes. Surrey Contracting offers phased delivery, weekend working and night-shift surfacing to minimise disruption to business operations, schools and public spaces.</p>
src/pages/surfacing.astro:195:        <summary>What areas does Surrey Contracting cover for commercial surfacing?</summary>
src/pages/surfacing.astro:196:        <p>Surrey Contracting covers Surrey, London and the South East for commercial surfacing, operating from its base between Cobham and Leatherhead. Areas include Guildford, Woking, Esher, Epsom, Weybridge, Reigate, Dorking, Kingston and the wider M25 corridor.</p>
src/pages/surfacing.astro:205:      <h3>Got a surfacing project to discuss?</h3>
src/pages/sectors.astro:13:    <div class="page-hero-img" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/sectors.astro:32:      <p class="section-lede">Surrey Contracting delivers enabling works, groundworks, earthworks and surfacing across a wide range of sectors we have the experience, team and knowledge to handle any project with any complexities.</p>
src/pages/sectors.astro:40:          <p>Complete solutions for schools and nurseries across Surrey, London and the South East. As a fully DBS-checked team, we work closely with educational facilities providing groundworks and surfacing services.</p>
src/pages/sectors.astro:73:        <div class="sector-photo" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/services.astro:6:  description="Our services, groundworks, bulk earthworks and commercial surfacing. Self-delivered by one experienced team across Surrey."
src/pages/services.astro:23:    <p class="page-lede">Self-delivered demolition, groundworks, bulk earthworks and commercial surfacing across Surrey, one team, one programme, signed off to one standard.</p>
src/pages/services.astro:100:<section class="svc-detail" id="commercial-surfacing">
src/pages/services.astro:103:      <div class="svc-detail-photo" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/services.astro:106:      <h2 class="section-title">Commercial Surfacing</h2>
src/pages/services.astro:107:      <p class="lede-dark">Professional surfacing solutions for commercial premises, car parks, roads, industrial estates and access routes, using high-quality tarmac, asphalt and surfacing materials.</p>
src/pages/services.astro:109:        <li>Tarmac &amp; asphalt, base, binder &amp; surface course</li>
src/pages/services.astro:110:        <li>Car park construction &amp; resurfacing</li>
src/pages/services.astro:113:        <li>Resin-bound &amp; resin-bonded surfaces</li>
src/pages/services.astro:116:      <a href="/surfacing" class="btn btn-yellow">Learn more about surfacing →</a>
src/pages/services.astro:126:      <p>Alongside our commercial work we deliver high-quality residential surfacing, tarmac driveways, resin-bound, block paving, pathways and external landscaping.</p>
src/pages/services.astro:129:      <span>Tarmac Driveways</span>
src/pages/services.astro:130:      <span>Resin Bound</span>
src/pages/groundworks-review.astro:24:  'A groundworks contractor prepares a site and constructs the below-ground elements required before the main building or surfacing work begins. This can include site clearance, excavation, foundations, concrete slabs, drainage, utility trenches, ground stabilisation and build-to-DPC work for residential, commercial and developer-led projects.';
src/pages/groundworks-review.astro:60:  ['Reinstatement', 'Backfilling, compaction and surface preparation', 'Site ready for surfacing or landscaping'],
src/pages/groundworks-review.astro:208:      <p>It also helps to be clear where groundworks stop and other disciplines begin. <a href="/demolition">Demolition and site clearance</a> removes existing structures and makes the site safe to work on. <a href="/earthworks">Bulk excavation and earthworks</a> moves large volumes of material to reshape a site or form platforms. Groundworks is the construct
src/pages/lp/groundworks.astro:200:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/lp/drainage.astro:83:      <p class="lede-dark">We install surface water drainage, soakaways, attenuation crates and sustainable drainage systems (SuDS) sized to your site and designed to meet current planning and building control requirements. From new developments and car parks to yards and driveways, we manage runoff at source, protect neighbouring land and connect safely into existin
src/pages/lp/drainage.astro:181:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/lp/demolition.astro:200:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/lp/surfacing.astro:11:      "name": "What commercial surfacing does Surrey Contracting install?",
src/pages/lp/surfacing.astro:12:      "acceptedAnswer": { "@type": "Answer", "text": "Surrey Contracting installs tarmac, resin-bound, block paving and concrete surfaces for car parks, access roads, industrial estates, distribution yards, schools and public spaces, plus line marking, kerbing, drainage and reinstatement, across Surrey, London and the South East." }
src/pages/lp/surfacing.astro:16:      "name": "Can you resurface car parks and access roads in Surrey?",
src/pages/lp/surfacing.astro:17:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. We handle new-build car park construction and overlay or resurfacing of existing car parks and access roads, with tarmac, resin-bound, block paving and concrete surfaces, plus line marking, speed bumps, bollards and drainage." }
src/pages/lp/surfacing.astro:21:      "name": "Do you carry out emergency surfacing repairs and reinstatement?",
src/pages/lp/surfacing.astro:22:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Our reactive surfacing team carries permanent and temporary repair materials and responds quickly to urgent works including utility reinstatement, surface patch repairs and emergency resurfacing." }
src/pages/lp/surfacing.astro:27:      "acceptedAnswer": { "@type": "Answer", "text": "Yes. We offer phased delivery, weekend working and night-shift surfacing to keep car parks, businesses, schools and public spaces open while the work is carried out." }
src/pages/lp/surfacing.astro:33:  title="Commercial Surfacing Contractors Surrey | Tarmac & Car Parks"
src/pages/lp/surfacing.astro:34:  description="Tarmac, resin-bound, block paving and concrete surfacing for car parks, roads and yards across Surrey, London and the South East. Free site visit, call 01932 932650."
src/pages/lp/surfacing.astro:35:  path="/lp/surfacing"
src/pages/lp/surfacing.astro:38:  <ServiceSchema slot="head" name="Commercial Surfacing" slug="lp/surfacing" description="Tarmac, resin-bound, block paving and concrete surfacing for car parks, roads and yards across Surrey, London and the South East." />
src/pages/lp/surfacing.astro:43:    <div class="page-hero-img" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/lp/surfacing.astro:47:    <span class="eyebrow eyebrow-yellow">Commercial surfacing · Surrey &amp; the South East</span>
src/pages/lp/surfacing.astro:48:    <h1 class="page-title">Commercial surfacing, car parks and roads, laid to last.</h1>
src/pages/lp/surfacing.astro:49:    <p class="page-lede">Tarmac, resin-bound, block paving and concrete surfacing for car parks, access roads, yards and public spaces. Free site visit, one working day response.</p>
src/pages/lp/surfacing.astro:69:      <span class="eyebrow">Commercial surfacing</span>
src/pages/lp/surfacing.astro:70:      <h2 class="section-title">Durable surfacing that stands up to heavy use.</h2>
src/pages/lp/surfacing.astro:71:      <p class="section-lede">From car parks and access roads to industrial yards, schools and public spaces, Surrey Contracting installs tarmac, resin-bound, block paving and concrete surfaces built to take constant traffic and weather. We plan every job to minimise disruption, with phased delivery, weekend and night working where you need it, and finish with a smo
src/pages/lp/surfacing.astro:79:      <div class="svc-detail-photo" style="background-image:url('/assets/img/services/surfacing-hero.jpg')"></div>
src/pages/lp/surfacing.astro:82:      <h2 class="section-title">Tarmac &amp; Commercial Surfacing</h2>
src/pages/lp/surfacing.astro:83:      <p class="lede-dark">We install new tarmac, resin-bound, block paving and concrete surfaces for commercial premises, access roads, industrial estates and distribution yards. Every project is planned around your operations with phased delivery and weekend working available, and laid by experienced teams using high-quality materials from trusted suppliers for a 
src/pages/lp/surfacing.astro:85:        <li>Tarmac &amp; asphalt surfacing</li>
src/pages/lp/surfacing.astro:86:        <li>Resin-bound surfaces</li>
src/pages/lp/surfacing.astro:88:        <li>Concrete surfacing</li>
src/pages/lp/surfacing.astro:101:      <h2 class="section-title">Car Park Surfacing &amp; Resurfacing</h2>
src/pages/lp/surfacing.astro:102:      <p class="lede-dark">Car parks take constant traffic, heavy loads and weather. Our tarmac, resin-bound, block paving and concrete solutions keep them safe, functional and looking sharp for years with minimal maintenance. We handle everything from new-build car park construction to overlay and resurfacing of existing car parks, and complete the job with line m
src/pages/lp/surfacing.astro:104:        <li>New-build car parks</li>
src/pages/lp/surfacing.astro:105:        <li>Overlay &amp; resurfacing</li>
src/pages/lp/surfacing.astro:117:      <div class="svc-detail-photo" style="background-image:url('/assets/img/services/surfacing-reinstatement.jpg')"></div>
src/pages/lp/surfacing.astro:121:      <p class="lede-dark">Our reactive surfacing team restores damaged surfaces quickly and safely, from utility reinstatement and surface patch repairs to full resurfacing, carrying permanent and temporary materials to respond fast to urgent works. We also install precast concrete kerbs, granite setts, conservation kerbing and block edging to give every surface a
src/pages/lp/surfacing.astro:125:        <li>Emergency resurfacing</li>
src/pages/lp/surfacing.astro:137:      <h2 class="section-title">Commercial Surfacing FAQs</h2>
src/pages/lp/surfacing.astro:141:        <summary>What commercial surfacing does Surrey Contracting install?</summary>
src/pages/lp/surfacing.astro:142:        <p>Tarmac, resin-bound, block paving and concrete surfaces for car parks, access roads, industrial estates, distribution yards, schools and public spaces, plus line marking, kerbing, drainage and reinstatement, across Surrey, London and the South East.</p>
src/pages/lp/surfacing.astro:145:        <summary>Can you resurface car parks and access roads in Surrey?</summary>
src/pages/lp/surfacing.astro:146:        <p>Yes. We handle new-build car park construction and overlay or resurfacing of existing car parks and access roads, with tarmac, resin-bound, block paving and concrete surfaces, plus line marking, speed bumps, bollards and drainage.</p>
src/pages/lp/surfacing.astro:149:        <summary>Do you carry out emergency surfacing repairs and reinstatement?</summary>
src/pages/lp/surfacing.astro:150:        <p>Yes. Our reactive surfacing team carries permanent and temporary repair materials and responds quickly to urgent works including utility reinstatement, surface patch repairs and emergency resurfacing.</p>
src/pages/lp/surfacing.astro:154:        <p>Yes. We offer phased delivery, weekend working and night-shift surfacing to keep car parks, businesses, schools and public spaces open while the work is carried out.</p>
src/pages/lp/surfacing.astro:163:      <span class="eyebrow eyebrow-yellow">Get your surfacing quote</span>
src/pages/lp/surfacing.astro:184:    <form class="quote-form contact-form" id="quoteForm" data-ytq-form data-lead-source="lp_surfacing" novalidate>
src/pages/lp/surfacing.astro:188:      <h3 class="form-title">Get a free surfacing quote</h3>
src/pages/lp/surfacing.astro:200:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/lp/surfacing.astro:213:    <p class="lp-sticky-cta-text">Car park or commercial surfacing?<span>Free site visit, one working day response.</span></p>
src/pages/lp/agricultural.astro:200:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/lp/earthworks.astro:200:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
src/pages/about.astro:6:  description="About Surrey Contracting Limited, a trusted contractor specialising in site enabling works, groundworks, bulk earthworks and commercial surfacing across Surrey, London and the South East for 15+ years."
src/pages/about.astro:24:    <p class="page-lede">A trusted contractor specialising in demolition, groundworks, bulk earthworks and commercial surfacing solutions across Surrey, London and the South East.</p>
src/pages/about.astro:36:      <p class="lede-dark">Surrey Contracting Limited is a trusted contractor specialising in site enabling works, groundworks, bulk earthworks and commercial surfacing solutions across Surrey, London and the South East.</p>
src/pages/about.astro:39:      <p>We understand that every project, site and client requirement is different, which is why we take a tailored approach to every contract we undertake. Whether it's delivering a small works package, a large-scale commercial surfacing contract, or a full-scale groundworks project, our focus remains the same: delivering durable, high-quality results built to perform an
src/pages/about.astro:75:        <div class="wwd-photo" style="background-image:url('/assets/img/Commercial-Surfacing.png')"></div>
src/pages/about.astro:77:          <h3>Commercial Surfacing</h3>
src/pages/about.astro:78:          <p>Professional surfacing and finishing works for commercial premises, car parks, private roads, industrial estates, access routes, yards and external hardstanding areas, using high-quality materials and proven installation methods.</p>
src/pages/index.astro:21:  "description": "Demolition, groundworks, bulk earthworks and commercial surfacing contractor based in Leatherhead, Surrey. Serving residential, commercial and developer clients across Surrey, London and the South East.",
src/pages/index.astro:74:      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Commercial Surfacing", "url": "https://surreycontracting.co.uk/surfacing" } }
src/pages/index.astro:80:  title="Surrey Contracting Limited | Groundworks, Surfacing & Civils across Surrey"
src/pages/index.astro:81:  description="Groundworks, bulk earthworks and commercial surfacing across Surrey, London and the South East. Surrey Contracting Limited has 15+ years on site and self-delivers every job."
src/pages/index.astro:82:  ogTitle="Surrey Contracting Limited | Groundworks, Surfacing & Civils across Surrey"
src/pages/index.astro:107:          Demolition, groundworks, bulk earthworks and commercial surfacing across Surrey, London and the South East. One team, 15+ years on site, and work that's right first time.
src/pages/index.astro:122:          <span class="word-rotator" aria-label="Demolition, Groundworks, Bulk Earthworks, Commercial Surfacing">
src/pages/index.astro:127:              <span class="word">Commercial Surfacing</span>
src/pages/index.astro:134:          From enabling works and site clearance through to completed surfacing and external works, one experienced team delivering across commercial, residential and developer projects throughout Surrey.
src/pages/index.astro:168:    <p><strong>Surrey Contracting Limited</strong> is a demolition, groundworks, bulk earthworks and commercial surfacing contractor based in Leatherhead, Surrey. The company delivers enabling works, site clearance, drainage, foundations, excavation, tarmac surfacing and external works for residential, commercial and developer clients. Surrey Contracting is CHAS accredite
src/pages/index.astro:177:      <h2 class="section-title">A Demolition, Groundworks, Earthworks &amp; Surfacing contractor for any site.</h2>
src/pages/index.astro:209:      <a href="/surfacing" class="svc-card" style="background-image:url(/assets/img/surfacing.jpg)">
src/pages/index.astro:212:          <h3>Commercial Surfacing</h3>
src/pages/index.astro:213:          <p>Complete commercial surfacing, from schools to car parks, industrial yards and access roads, in tarmac, resin-bound, block paving and paving.</p>
src/pages/index.astro:262:      <p class="lede">Surrey Contracting Limited is a site enabling, demolition, groundworks, earthworks and surfacing contractor based near Leatherhead, working across Surrey, London and the South East.</p>
src/pages/index.astro:268:        <li><span>Self-delivery of site enabling works, groundworks, earthworks &amp; surfacing</span></li>
src/pages/index.astro:298:      <div class="feature-photo" style="background-image:url('/assets/img/surfacing.jpg')">
src/pages/index.astro:300:      <div class="feature-tag">Commercial surfacing</div>
src/pages/index.astro:303:      <span class="eyebrow eyebrow-yellow">Commercial Surfacing</span>
src/pages/index.astro:304:      <h2 class="section-title light">Hard-wearing surfacing for commercial sites.</h2>
src/pages/index.astro:305:      <p>Surfacing for car parks, private roads, industrial estates, access routes and hardstanding. We lay tarmac and asphalt (base, binder and surface course) over a properly prepared sub-base, because the finish is only ever as good as what's underneath.</p>
src/pages/index.astro:307:        <div><strong>Car parks</strong><span>&amp; access roads</span></div>
src/pages/index.astro:308:        <div><strong>Tarmac</strong><span>&amp; asphalt</span></div>
src/pages/index.astro:311:      <a href="/surfacing" class="btn btn-yellow">Explore commercial surfacing →</a>
src/pages/index.astro:410:        <div class="proj-photo" style="background-image:url('/assets/img/surfacing.jpg')"></div>
src/pages/index.astro:412:          <span class="proj-tag">Surfacing</span>
src/pages/index.astro:414:          <p>Precast kerbing and tarmac access road for a commercial yard, delivered over two phased weekends.</p>
src/pages/index.astro:485:            We needed our main car park resurfaced inside a six-week summer window with zero slippage. They hit the date with two days to spare and the finish has held up beautifully through two winters of school-run traffic.
src/pages/index.astro:572:        <label class="check"><input type="checkbox" name="svc" value="Commercial Surfacing"><span>Commercial Surfacing</span></label>
public/training-manual/index.html:524:        <td><code>Tarmac Driveway, Fetcham, Surrey</code></td>
public/training-manual/index.html:530:        <td><code>tarmac-driveway-fetcham</code></td>
public/training-manual/index.html:536:        <td><code>100sqm tarmac driveway in Fetcham, Surrey, with base course and SMA wearing course.</code></td>
public/training-manual/index.html:563:        <td>Drainage · Driveways · Earthworks · Groundworks · Hard Landscaping · Surfacing</td>
public/training-manual/index.html:604:        <td><code>Tarmac · Drainage</code></td>
public/training-manual/index.html:674:        <td>Additional photos shown in a grid below the body text. Click <strong>Add item</strong> to upload each image. The first image is shown larger. Each image has an optional Caption (short label shown on the photo, e.g. <code>Surfacing, base course</code>).</td>
public/training-manual/index.html:837:        <td>Use technical terms where relevant — the audience understands <em>tarmac</em>, <em>macadam</em>, <em>SMA</em></td>
public/training-manual/index.html:866:        <td><code>tarmac</code>, <code>drainage</code>, <code>earthworks</code></td>
public/training-manual/index.html:890:        <td><code>Tarmac · Drainage</code></td>
public/training-manual/index.html:912:        <td><code>Emergency tarmac footpath repairs at Sutton High School, completed over a weekend to minimise disruption.</code></td>
public/training-manual/index.html:916:        <td><code>100sqm tarmac driveway installation with base course and SMA wearing course in Fetcham, Surrey.</code></td>
public/training-manual/index.html:933:        <td>Describe the photo factually. <code>Completed tarmac driveway with granite sett edging, West Humble</code> — not <code>photo1</code></td>
public/training-manual/index.html:961:        <td>If primarily a driveway, select <code>Driveways</code> even if surfacing was involved.</td>
public/llms.txt:3:> Surrey Contracting Limited is a demolition, groundworks, bulk earthworks and commercial surfacing contractor based in Leatherhead, Surrey. The company delivers enabling works, site clearance, foundations, drainage, excavation, tarmac surfacing and external works for residential, commercial and developer clients across Surrey, London and the South East of England.
public/llms.txt:12:- **Commercial Surfacing**: tarmac, resin-bound, block paving and concrete surfaces for car parks, access roads, schools, industrial estates and public spaces; reinstatement, repair and kerbing
public/llms.txt:29:- Commercial Surfacing: https://surreycontracting.co.uk/surfacing
studio/schemaTypes/project.ts:3:const CATEGORY_OPTIONS = ['Drainage', 'Driveways', 'Earthworks', 'Groundworks', 'Hard Landscaping', 'Surfacing'];
studio/schemaTypes/project.ts:46:      description: 'e.g. "Tarmac · Drainage"',
studio/schemaTypes/project.ts:94:            { name: 'caption', type: 'string', title: 'Caption', description: 'Optional small label shown on the photo, e.g. "Surfacing, base course".' },
docs/sanity-training-manual.html:524:        <td><code>Tarmac Driveway, Fetcham, Surrey</code></td>
docs/sanity-training-manual.html:530:        <td><code>tarmac-driveway-fetcham</code></td>
docs/sanity-training-manual.html:536:        <td><code>100sqm tarmac driveway in Fetcham, Surrey, with base course and SMA wearing course.</code></td>
docs/sanity-training-manual.html:563:        <td>Drainage · Driveways · Earthworks · Groundworks · Hard Landscaping · Surfacing</td>
docs/sanity-training-manual.html:604:        <td><code>Tarmac · Drainage</code></td>
docs/sanity-training-manual.html:674:        <td>Additional photos shown in a grid below the body text. Click <strong>Add item</strong> to upload each image. The first image is shown larger. Each image has an optional Caption (short label shown on the photo, e.g. <code>Surfacing, base course</code>).</td>
docs/sanity-training-manual.html:837:        <td>Use technical terms where relevant — the audience understands <em>tarmac</em>, <em>macadam</em>, <em>SMA</em></td>
docs/sanity-training-manual.html:866:        <td><code>tarmac</code>, <code>drainage</code>, <code>earthworks</code></td>
docs/sanity-training-manual.html:890:        <td><code>Tarmac · Drainage</code></td>
docs/sanity-training-manual.html:912:        <td><code>Emergency tarmac footpath repairs at Sutton High School, completed over a weekend to minimise disruption.</code></td>
docs/sanity-training-manual.html:916:        <td><code>100sqm tarmac driveway installation with base course and SMA wearing course in Fetcham, Surrey.</code></td>
docs/sanity-training-manual.html:933:        <td>Describe the photo factually. <code>Completed tarmac driveway with granite sett edging, West Humble</code> — not <code>photo1</code></td>
docs/sanity-training-manual.html:961:        <td>If primarily a driveway, select <code>Driveways</code> even if surfacing was involved.</td>
docs/sanity-training-manual.md:63:- Example: `Tarmac Driveway, Fetcham, Surrey`
docs/sanity-training-manual.md:67:The web address for this project page, e.g. `/projects/tarmac-driveway-fetcham`.
docs/sanity-training-manual.md:82:- Surfacing
docs/sanity-training-manual.md:102:- Example: `Tarmac · Drainage`
docs/sanity-training-manual.md:157:- Each photo has an optional **Caption** — a short label shown on the photo, e.g. `Surfacing, base course`.
docs/sanity-training-manual.md:227:- Avoid jargon where possible, but technical terms (tarmac, macadam, SMA, etc.) are fine when relevant — the audience understands them.
docs/sanity-training-manual.md:232:- Service types are lowercase unless starting a sentence: `tarmac`, `drainage`, `earthworks`.
docs/sanity-training-manual.md:242:- Example: `Emergency tarmac footpath repairs at Sutton High School, completed over a weekend to minimise disruption.`
docs/sanity-training-manual.md:245:- Always fill in Alt text. Describe the photo factually: `Completed tarmac driveway with granite sett edging, West Humble` not `photo1`.
docs/sanity-training-manual.md:250:- Always select the most specific category — if the project is primarily a driveway, select `Driveways` even if surfacing was involved.
astro.config.mjs:24:    '/project-tarmac-driveway': '/projects/tarmac-driveway',
astro.config.mjs:25:    '/project-tarmac-driveway-fetcham': '/projects/tarmac-driveway-fetcham',
astro.config.mjs:26:    '/project-tarmac-repairs-sutton': '/projects/tarmac-repairs-sutton',
```

## 2. Surfacing-named static assets (filename inventory — no text match, but surfacing-branded files)

```
public/assets/img/Commercial-Surfacing.png
public/assets/img/Kerbing.jpg
public/assets/img/Surface water drainage.jpg
public/assets/img/block-paving.jpeg
public/assets/img/paving.jpg
public/assets/img/projects/tarmac-driveway-2.jpg
public/assets/img/projects/tarmac-driveway-3.jpg
public/assets/img/projects/tarmac-driveway-4.jpg
public/assets/img/projects/tarmac-driveway-fetcham-2.jpg
public/assets/img/projects/tarmac-driveway-fetcham-3.jpg
public/assets/img/projects/tarmac-driveway-fetcham-4.jpg
public/assets/img/projects/tarmac-driveway-fetcham.jpg
public/assets/img/projects/tarmac-driveway.jpg
public/assets/img/projects/tarmac-repairs-sutton-2.jpg
public/assets/img/projects/tarmac-repairs-sutton-3.jpg
public/assets/img/projects/tarmac-repairs-sutton-4.jpg
public/assets/img/projects/tarmac-repairs-sutton.jpg
public/assets/img/services/surfacing-carpark.jpg
public/assets/img/services/surfacing-hero.jpg
public/assets/img/services/surfacing-kerbing.jpg
public/assets/img/services/surfacing-reinstatement.jpg
public/assets/img/services/surfacing-schools.jpg
public/assets/img/surfacing.jpg
```

## 3. Sanity content documents (live query, 2026-08-18)

`*[_type == "project"]` returned 10 published documents. Surfacing-related:

| Document ID | Title | Slug | Categories | Action |
|---|---|---|---|---|
| `project-tarmac-driveway` | Tarmac Driveway | `tarmac-driveway` | Driveways, Surfacing | **Unpublish in Sanity (manual)** — excluded from queries + 301 in this deployment |
| `project-tarmac-driveway-fetcham` | Tarmac Driveway, Fetcham, Surrey | `tarmac-driveway-fetcham` | Driveways, Surfacing | **Unpublish in Sanity (manual)** — excluded from queries + 301 in this deployment |
| `project-tarmac-repairs-sutton` | Tarmac Repairs, Sutton High School | `tarmac-repairs-sutton` | Surfacing | **Unpublish in Sanity (manual)** — excluded from queries + 301 in this deployment |
| `project-southbank-centre` | Southbank Centre | `southbank-centre` | Surfacing, Groundworks, Drainage | **Retain** (groundworks/drainage flagship). **Manual CMS edit**: remove "Surfacing" from categories and from the `services` string; review body copy for surfacing references |

The brief predicted four surfacing case studies ("likely a block paving job and a car park job"); the live dataset contains **three pure-surfacing projects** (two tarmac driveways + the Sutton school tarmac repair, which is the car-park-adjacent job) and one mixed project (Southbank Centre). The remaining six documents (complete-landscape, concrete-base-cobham, domestic-earthworks, drainage-ascot, landscape-guildford, site-clearance-earthworks) contain no surfacing categories and are retained.

Also flagged for manual Sanity review (cannot be fixed from the repo): body text (Portable Text) and image alt/captions of retained projects may mention tarmac/surfacing — notably `project-southbank-centre`.

## 4. Structural inventory by change area

| Area | Location | What was found |
|---|---|---|
| Strapline (4 services) | `src/components/UtilityBar.astro:6` | "Demolition, Groundworks, Earthworks & Surfacing across Surrey & the Home Counties" — site-wide via BaseLayout |
| Main nav | `src/components/Nav.astro:24` (desktop dropdown), `:56` (mobile drawer) | "Commercial Surfacing" → `/surfacing` |
| Footer nav | `src/components/Footer.astro:18` | "Commercial Surfacing" → `/surfacing` |
| Homepage hero rotator | `src/pages/index.astro:122–128` + `src/scripts/app.js:33` | "Commercial Surfacing" word + aria-label |
| Homepage services grid (4 cards) | `src/pages/index.astro:209–216`; `public/styles.css:637` (`repeat(4, 1fr)`) | Surfacing card; grid built for 4 |
| Homepage "four disciplines" | `src/pages/index.astro:177–178` | H2 lists 4 services; lede says "Four core disciplines" |
| Homepage surfacing feature section | `src/pages/index.astro:295–314` | Full "Commercial Surfacing" feature block |
| Homepage static projects grid | `src/pages/index.astro:409–416` | "Surfacing / Kerbing & access road" card |
| Homepage car-park testimonial | `src/pages/index.astro:483–494` + t-dots `:521–526` | School car-park resurfacing quote (Sarah K.) |
| Homepage stats counters | `src/pages/index.astro:349–368` + `src/scripts/app.js:99–122` | `data-target` counters render `0` pre-JS (Part C1) |
| Homepage AI answer block | `src/pages/index.astro:168` | 4-service description incl. "tarmac surfacing" |
| Homepage JSON-LD | `src/pages/index.astro:21` (description), `:74` (Service offer) | Surfacing service in LocalBusiness catalog |
| Homepage meta/OG | `src/pages/index.astro:80–82` | Title/description/ogTitle mention Surfacing |
| Homepage about + bullets | `src/pages/index.astro:262, 268` | "…and surfacing contractor…" |
| Homepage quote form | `src/pages/index.astro:572` | "Commercial Surfacing" checkbox |
| Services page | `src/pages/services.astro:6, 23, 32, 100–119, 126–130` | Meta, lede, "four core disciplines", full surfacing section (`#commercial-surfacing`), residential surfacing band ("Tarmac Driveways", "Resin Bound") |
| Surfacing page | `src/pages/surfacing.astro` (47 matches) | Entire page — **delete** |
| Surfacing LP | `src/pages/lp/surfacing.astro` (44 matches) | Entire page — **delete** |
| Retained LP forms | `src/pages/lp/{agricultural,demolition,drainage,earthworks,groundworks}.astro` (~line 200/181) | "Commercial Surfacing" checkbox in each quote form |
| LP drainage copy | `src/pages/lp/drainage.astro:83` | "car parks" in drainage body copy |
| Contact page | `src/pages/contact.astro:6, 75` | Meta description + "Commercial Surfacing" checkbox |
| About page | `src/pages/about.astro:6, 24, 36, 39, 75–78` | Meta, lede, intro, Commercial Surfacing card |
| Sectors page | `src/pages/sectors.astro:13, 32, 40, 73` | Hero + sector photos use `surfacing.jpg`; copy mentions surfacing |
| Projects page | `src/pages/projects.astro:10` | Meta description mentions surfacing |
| Groundworks review copy | `src/pages/groundworks-review.astro:24, 60, 208` | Copy + link to `/surfacing` (noindex review page) |
| llms.txt | `public/llms.txt:3, 8, 12, 29` | 4-discipline description, surfacing service, surfacing URL |
| Sanity schema | `studio/schemaTypes/project.ts:3, 46, 94` | 'Surfacing'/'Driveways' category options, tarmac/surfacing example text |
| CMS training manual | `public/training-manual/index.html` (13), `docs/sanity-training-manual.{md,html}` (10/13) | Tarmac/surfacing worked examples |
| Legacy redirects | `astro.config.mjs:24–26` | `/project-tarmac-*` → `/projects/tarmac-*` (re-point to `/projects`) |
| Forms email template | `src/pages/api/contact.ts:40, 60` | Renders submitted `svc` values verbatim — no hardcoded surfacing; no change needed beyond checkbox removal |
| YTQ webhook payload | `src/layouts/BaseLayout.astro` (YourTradeQuotes connector) | Serialises form fields generically — no hardcoded surfacing |
| Images | `public/assets/img/` | `surfacing.jpg`, `Commercial-Surfacing.png`, `Kerbing.jpg`, `services/surfacing-*.{jpg,webp}` (5), `img/projects/tarmac-*.jpg` (12) — delete once unreferenced |

## 5. Explicitly out of scope / retained

- Five retained LP pages (`/lp/groundworks`, `/lp/earthworks`, `/lp/drainage`, `/lp/demolition`, `/lp/agricultural`) — untouched except (a) removing the Commercial Surfacing form option (Part B7 applies to "every form") and (b) the single "car parks" phrase in `/lp/drainage` body copy (Part B10/D2 sweep).
- `sitemap-index.xml` / `sitemap-0.xml` filenames — unchanged.
- Google Business Profile — handled separately by a human.
- Block paving / hard-landscaping references tied to retained Sanity "Hard Landscaping" projects.
- Screenshots (binary PNGs) under `public/training-manual/Screenshots/` and `docs/Screenshots/` — may depict old CMS content; flagged, not modified.
- Root-level working docs (ACTION-PLAN.md, FULL-AUDIT-REPORT.md, PASTEL-SIGNOFF.md, approval-sheet.csv, pastel-comments CSV, etc.) — historical working papers, not shipped to the site. Left as-is (git history equivalent).
