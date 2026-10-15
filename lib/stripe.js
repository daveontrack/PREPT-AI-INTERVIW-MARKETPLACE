import "server-only";

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is missing. Add it to .env — see .env.example.",
  );
}

// Server-only Stripe client. Never import this from a client component; the
// secret key must stay on the server.
export const stripe = new Stripe(secretKey);
