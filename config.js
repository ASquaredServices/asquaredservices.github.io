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
  formEndpoint: "https://script.google.com/macros/s/AKfycbyzryEVeuVBUS5qEPAiH1n6NVek3Ipk2cdruEaE4mfFig8IAWzFaIKBV6wCeN5eT0Tr/exec",

  // Shown on the home page and in form messages. Leave "" to hide.
  contact: {
    phone: "617-682-6164",
    email: "adriandthaler@icloud.com",
  },

  // The notes appear under the payment choices when that option is picked:
  // "note" on regular orders, "passNote" on the Season Pass. An option with
  // "other: true" also shows a box asking which payment method they'd like.
  paymentMethods: [
    {
      name: "Cash",
      note: "Pay us in cash when we finish the job. If you won't be home, leave it in an envelope marked “A²” and tell us where to find it in the comments.",
      passNote: "Pay at the first storm: hand it to us when we come to shovel, or leave it in an envelope marked “A²” and tell us where to find it in the comments.",
    },
    {
      name: "Venmo",
      note: "When the job is done, we'll email you our Venmo so you can pay.",
      passNote: "Pay up front: when we confirm your pass, we'll email you our Venmo so you can pay.",
    },
    {
      name: "Other",
      other: true,
      note: "Tell us how you'd like to pay, and we'll get back to you to work it out.",
      passNote: "Tell us how you'd like to pay, and we'll work out the details when we confirm your pass.",
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
    ],
    sidewalk: [
      { label: "None", price: 0 },
      { label: "Sidewalk", price: 10 },
    ],
    // Add-on: clearing snow off cars. Not affected by the snowfall bonus.
    cars: [
      { label: "None", price: 0 },
      { label: "1 car", price: 10 },
      { label: "2 cars", price: 20 },
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
  },
};
