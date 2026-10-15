// Idempotent Stripe setup: creates the Starter + Pro products and their monthly
// prices, then prints the env vars to paste into .env.
//
//   npm run stripe:setup
//
// Re-running it reuses any price that already exists, so it is safe to run more
// than once.

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY. Run with: npm run stripe:setup");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// Keep these amounts in sync with the prices shown in lib/data.js.
const PAID_PLANS = [
  { slug: "starter", name: "Starter", amountUsd: 5 },
  { slug: "pro", name: "Pro", amountUsd: 15 },
];

async function findExistingPrice(slug) {
  const prices = await stripe.prices.list({ active: true, limit: 100 });
  return prices.data.find(
    (price) => price.recurring && price.metadata?.plan === slug,
  );
}

async function main() {
  for (const plan of PAID_PLANS) {
    let price = await findExistingPrice(plan.slug);

    if (price) {
      const amount = price.unit_amount / 100;
      if (amount !== plan.amountUsd) {
        console.warn(
          `⚠ Existing ${plan.name} price ${price.id} is $${amount}/mo but the UI ` +
            `shows $${plan.amountUsd}/mo. Update it in the Stripe dashboard, or ` +
            `change lib/data.js to match.`,
        );
      }
      console.log(`Reusing existing ${plan.name} price ${price.id} ($${amount}/mo)`);
    } else {
      const product = await stripe.products.create({
        name: `InterviewLoop ${plan.name}`,
        metadata: { plan: plan.slug },
      });

      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amountUsd * 100,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { plan: plan.slug },
      });

      console.log(`Created ${plan.name} price $${plan.amountUsd}/mo`);
    }

    console.log(
      `NEXT_PUBLIC_STRIPE_PRICE_ID_${plan.slug.toUpperCase()}=${price.id}`,
    );
  }

  console.log(
    [
      "",
      "Next steps:",
      "1. Add the NEXT_PUBLIC_STRIPE_PRICE_ID_* vars above to .env",
      "2. Point a webhook at /api/webhooks/stripe. In development:",
      "     stripe listen --forward-to localhost:3000/api/webhooks/stripe",
      "   Subscribe to: checkout.session.completed, invoice.paid,",
      "                customer.subscription.updated, customer.subscription.deleted",
      "   Copy the printed whsec_... into STRIPE_WEBHOOK_SECRET.",
      "3. Dashboard → Settings → Billing → Customer portal: enable plan",
      "   switching so 'Switch to Pro' / 'Manage billing' buttons work.",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
