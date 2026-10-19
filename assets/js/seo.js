/* ============================================
   BITTU TELECOM — SEO Helpers
   JSON-LD structured data injection
   ============================================ */

/* ---------- Organization Schema ---------- */
function injectOrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': SITE_CONFIG.businessName,
    'url': SITE_CONFIG.domain,
    'description': 'Wholesale supplier of electronics, gadgets, LED lights, solar lights, and electrical products in Goniana Mandi, Punjab.',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': SITE_CONFIG.address.street,
      'addressLocality': SITE_CONFIG.address.locality,
      'addressRegion': SITE_CONFIG.address.state,
      'postalCode': SITE_CONFIG.address.pincode,
      'addressCountry': 'IN',
    },
    'telephone': SITE_CONFIG.phone,
    'email': SITE_CONFIG.email,
    'areaServed': SITE_CONFIG.serviceAreas.map(area => ({
      '@type': 'Place',
      'name': area + ', Punjab, India',
    })),
  };

  // Add social profiles only if they exist
  const sameAs = [];
  if (SITE_CONFIG.social.facebook) sameAs.push(SITE_CONFIG.social.facebook);
  if (SITE_CONFIG.social.instagram) sameAs.push(SITE_CONFIG.social.instagram);
  if (SITE_CONFIG.social.youtube) sameAs.push(SITE_CONFIG.social.youtube);
  if (sameAs.length > 0) schema.sameAs = sameAs;

  injectSchema(schema);
}

/* ---------- LocalBusiness / Store Schema ---------- */
function injectLocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    'name': SITE_CONFIG.businessName,
    'description': 'Wholesale supplier of electronics, gadgets, LED lights, solar lights, neon lights, and electrical products in Goniana Mandi, Punjab, India. Serving retailers and bulk buyers across Bathinda, Muktsar, Faridkot, and surrounding areas.',
    'url': SITE_CONFIG.domain,
    'telephone': SITE_CONFIG.phone,
    'email': SITE_CONFIG.email,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': SITE_CONFIG.address.street,
      'addressLocality': SITE_CONFIG.address.locality,
      'addressRegion': SITE_CONFIG.address.state,
      'postalCode': SITE_CONFIG.address.pincode,
      'addressCountry': 'IN',
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': SITE_CONFIG.geo.latitude,
      'longitude': SITE_CONFIG.geo.longitude,
    },
    'openingHoursSpecification': Object.entries(SITE_CONFIG.hours.structured).map(([days, hours]) => {
      const [open, close] = hours.split('-');
      return {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': days.split(',').map(d => d.trim()),
        'opens': open,
        'closes': close,
      };
    }),
    'priceRange': '₹₹',
    'currenciesAccepted': 'INR',
    'paymentAccepted': 'Cash, UPI, Bank Transfer',
    'areaServed': SITE_CONFIG.serviceAreas.map(area => ({
      '@type': 'Place',
      'name': area + ', Punjab, India',
    })),
  };

  injectSchema(schema);
}

/* ---------- WebSite Schema ---------- */
function injectWebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': SITE_CONFIG.siteName,
    'url': SITE_CONFIG.domain,
    'description': 'Official website of Bittu Telecom Wholesaler — wholesale electronics, gadgets, and lighting products from Goniana Mandi, Punjab.',
  };

  injectSchema(schema);
}

/* ---------- Breadcrumb Schema ---------- */
function injectBreadcrumbSchema(items) {
  // items: [{name, url}, ...]
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map(function (item, index) {
      const element = {
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
      };
      if (item.url) {
        element.item = item.url;
      }
      return element;
    }),
  };

  injectSchema(schema);
}

/* ---------- FAQ Schema ---------- */
function injectFAQSchema(faqs) {
  // faqs: [{question, answer}, ...]
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(function (faq) {
      return {
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      };
    }),
  };

  injectSchema(schema);
}

/* ---------- Helper: Inject Schema Script ---------- */
function injectSchema(schemaObject) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schemaObject);
  document.head.appendChild(script);
}
