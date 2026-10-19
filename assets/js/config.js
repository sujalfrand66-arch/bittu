/* ============================================
   BITTU TELECOM — Site Configuration
   All configurable values in one place.
   Owner: Update these values before deploying.
   ============================================ */

const SITE_CONFIG = {
  // Business Information
  businessName: 'BITTU WHOLESALER',
  businessTagline: 'B2B Wholesale Electronics & Gadgets Supplier',
  businessType: 'Wholesale Supplier',

  // Contact — REPLACE WITH VERIFIED DETAILS
  phone: '+91-XXXXX-XXXXX',        // Replace with actual phone
  phoneDisplay: 'XXXXX-XXXXX',     // Display version
  whatsappNumber: '91XXXXXXXXXX',   // WhatsApp number without + or spaces
  email: 'contact@bittutelecom.in', // Replace with actual email

  // Address — REPLACE WITH VERIFIED DETAILS
  address: {
    street: '[Verified Street Address]',  // Replace
    locality: 'Goniana Mandi',
    city: 'Goniana Mandi',
    district: 'Bathinda',
    state: 'Punjab',
    country: 'India',
    pincode: '151201',  // Verify pincode
  },

  // Coordinates — VERIFY BEFORE DEPLOYING
  geo: {
    latitude: 30.3831,   // Approximate — verify
    longitude: 74.8539,  // Approximate — verify
  },

  // Website
  domain: 'https://www.bittutelecom.in',  // Replace with actual domain
  siteName: 'BITTU WHOLESALER',

  // Business Hours — UPDATE TO ACTUAL HOURS
  hours: {
    weekdays: '09:00 AM – 08:00 PM',
    saturday: '09:00 AM – 08:00 PM',
    sunday: '10:00 AM – 02:00 PM',
    structured: {
      'Mo-Sa': '09:00-20:00',
      'Su': '10:00-14:00',
    },
  },

  // Google Maps Embed URL — REPLACE WITH ACTUAL EMBED URL
  mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13741.87!2d74.85!3d30.38!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39172e27027878d3%3A0xc3457a82bfa32dbf!2sGoniana%2C%20Punjab%20151201!5e0!3m2!1sen!2sin!4v1700000000000',
  mapDirectionsUrl: 'https://www.google.com/maps/dir//Goniana+Mandi,+Punjab/',

  // Service Areas
  primaryMarket: 'Goniana Mandi',
  serviceAreas: [
    'Goniana Mandi',
    'Bathinda',
    'Gidderbaha',
    'Malout',
    'Muktsar',
    'Faridkot',
    'Kotkapura',
    'Mansa',
  ],

  // Social Profiles — ADD WHEN AVAILABLE
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
  },

  // Analytics — ADD WHEN AVAILABLE
  analytics: {
    ga4MeasurementId: '',  // e.g., 'G-XXXXXXXXXX'
    searchConsoleVerification: '', // HTML meta tag content
  },

  // Year
  currentYear: new Date().getFullYear(),
};

// WhatsApp Enquiry URL Generator
function getWhatsAppUrl(message) {
  const encodedMessage = encodeURIComponent(message || 'Hi, I am interested in wholesale products from BITTU WHOLESALER, Goniana Mandi. Please share details.');
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
}

// Product-specific WhatsApp URL
function getProductWhatsAppUrl(productName) {
  const message = `Hi, I am interested in buying "${productName}" in wholesale (MOQ 20+ pcs) from BITTU WHOLESALER. Please share wholesale rate and availability.`;
  return getWhatsAppUrl(message);
}

// Click-to-call URL
function getCallUrl() {
  return `tel:${SITE_CONFIG.phone}`;
}

// Make config immutable
Object.freeze(SITE_CONFIG);
Object.freeze(SITE_CONFIG.address);
Object.freeze(SITE_CONFIG.geo);
Object.freeze(SITE_CONFIG.hours);
Object.freeze(SITE_CONFIG.social);
Object.freeze(SITE_CONFIG.analytics);
