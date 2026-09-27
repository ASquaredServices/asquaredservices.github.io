// =====================================================================
//  A Squared Services: site settings
//
//  Change prices, payment options and contact info here. Every price
//  shown on the website comes from this file.
// =====================================================================

window.A2_CONFIG = {
  // The Google Apps Script "Web app" link that saves requests to the
  // Google Sheet (see google-sheet/SETUP.md). While this is empty, the
  // forms work but show a note that online booking isn't switched on yet.
  formEndpoint: "",

  // Shown on the home page and in form messages. Leave "" to hide.
  contact: {
    phone: "", // e.g. "(617) 555-0123"
    email: "", // e.g. "asquaredservices@gmail.com"
  },

  paymentMethods: ["Cash", "Check", "Venmo", "PayPal", "Zelle"],

  fall: {
    pricePerBag: 10, // per full 30-gallon bag of leaves
    maxBags: 99,
  },

  winter: {
    driveway: [
      { label: "None", price: 0 },
      { label: "1 space", price: 20 },
      { label: "2 spaces", price: 30 },
      { label: "3+ spaces", price: 40 },
    ],
    sidewalk: [
      { label: "None", price: 0 },
      { label: "Sidewalk", price: 10 },
    ],
    // "extra" is added on top of the base cost: 0.5 means +50%.
    snowfall: [
      { label: "0–4 in", extra: 0 },
      { label: "4–8 in", extra: 0.5 },
      { label: "8+ in", extra: 1 },
    ],
    // Snow melt is free when the order is over "freeOver" dollars.
    snowMelt: { price: 5, freeOver: 50 },
  },

  seasonPass: {
    price: 200,
  },
};
