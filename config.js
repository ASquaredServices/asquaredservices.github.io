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

  // The notes appear under the payment choices when that option is picked:
  // "note" on regular orders, "passNote" on the Season Pass.
  paymentMethods: [
    {
      name: "Cash",
      note: "Pay us in cash when we finish the job. If you won't be home, leave it in an envelope marked “A²” and tell us where to find it in the comments.",
      passNote: "Pay at the first storm: hand it to us when we come to shovel, or leave it in an envelope marked “A²” and tell us where to find it in the comments.",
    },
    {
      name: "Check",
      note: "Pay by check when we finish the job. Hand it to us, or leave it in an envelope marked “A²” and tell us where to find it in the comments.",
      passNote: "Pay at the first storm: hand us a check when we come to shovel, or leave it in an envelope marked “A²” and tell us where to find it in the comments.",
    },
    {
      name: "Venmo",
      note: "When the job is done, we'll text or email you our Venmo so you can pay.",
      passNote: "Pay up front: when we confirm your pass, we'll text or email you our Venmo so you can pay.",
    },
    {
      name: "PayPal",
      note: "When the job is done, we'll text or email you our PayPal so you can pay.",
      passNote: "Pay up front: when we confirm your pass, we'll text or email you our PayPal so you can pay.",
    },
    {
      name: "Zelle",
      note: "When the job is done, we'll text or email you our Zelle info so you can pay.",
      passNote: "Pay up front: when we confirm your pass, we'll text or email you our Zelle info so you can pay.",
    },
  ],

  fall: {
    pricePerBag: 5, // per full 30-gallon bag of leaves
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
    // "Not sure" (extra: null) means we measure the snow on the day.
    snowfall: [
      { label: "0–4 in", extra: 0 },
      { label: "4–8 in", extra: 0.5 },
      { label: "8+ in", extra: 1 },
      { label: "Not sure", extra: null },
    ],
    // Snow melt is free once the order (before snow melt) reaches "freeFrom"
    // dollars. A $45 order plus $5 snow melt is $50, not free.
    snowMelt: { price: 5, freeFrom: 50 },
  },

  seasonPass: {
    price: 200,
    // Which winter the pass is for. It runs from the first snowstorm that
    // stays overnight to the last one.
    season: "2026–27",
  },
};
