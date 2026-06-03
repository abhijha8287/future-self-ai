import type { DecisionContext, DecisionType } from "../lib/types";

type Detection = {
  type: DecisionType;
  selectors: string[];
};

const detections: Detection[] = [
  {
    type: "purchase",
    selectors: [
      "#buy-now-button",
      "#add-to-cart-button",
      "#submitOrderButtonId",
      "input[name='submit.buy-now']",
      "input[name='submit.add-to-cart']",
      "input[aria-labelledby*='buy-now']",
      "input[title*='Buy Now']",
      "button:has-text('Buy Now')",
      "button:has-text('Add to Cart')",
      "button:has-text('Place Order')",
      "span:has-text('Buy Now')",
      "span:has-text('Add to Cart')"
    ]
  },
  { type: "email", selectors: ["div[role='button'][data-tooltip*='Send']", "div[role='button'][aria-label*='Send']"] },
  { type: "job", selectors: ["button[aria-label*='Apply']", "button:has-text('Apply')", "a:has-text('Apply')"] },
  { type: "subscription", selectors: ["button:has-text('Subscribe')", "button:has-text('Start trial')"] },
  { type: "investment", selectors: ["button:has-text('Buy')", "button:has-text('Invest')", "button:has-text('Place order')"] }
];

export function detectAction(target: EventTarget | null): DecisionContext | null {
  if (!(target instanceof Element)) return null;
  const button = findActionElement(target);
  if (!button || button.dataset.futureselfProceed === "true") return null;

  const label = actionLabel(button);
  const detection = detections.find((candidate) => {
    if (candidate.selectors.some((selector) => safeMatches(button, selector))) return true;
    return labelMatches(candidate.type, label);
  });

  if (!detection) return null;

  return {
    decisionType: detection.type,
    website: websiteName(),
    title: extractTitle(detection.type),
    price: extractPrice(),
    category: extractCategory(),
    emailBody: detection.type === "email" ? extractEmailBody() : undefined,
    jobTitle: detection.type === "job" ? extractJobTitle() : undefined,
    company: detection.type === "job" ? extractCompany() : undefined,
    salary: detection.type === "job" ? extractSalary() : undefined,
    actionLabel: label,
    url: location.href,
    capturedAt: new Date().toISOString()
  };
}

export function replayAction(element: HTMLElement) {
  element.dataset.futureselfProceed = "true";
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
  element.click();
  setTimeout(() => delete element.dataset.futureselfProceed, 1200);
}

function findActionElement(element: Element) {
  return element.closest(
    [
      "button",
      "a",
      "input[type='button']",
      "input[type='submit']",
      "[role='button']",
      "#buy-now-button",
      "#add-to-cart-button",
      "#submitOrderButtonId",
      ".a-button",
      ".a-button-input"
    ].join(",")
  ) as HTMLElement | null;
}

function safeMatches(element: Element, selector: string) {
  if (selector.includes(":has-text")) {
    const text = selector.match(/:has-text\('(.+)'\)/)?.[1]?.toLowerCase();
    const base = selector.split(":has-text")[0];
    return (!base || element.matches(base)) && Boolean(text && element.textContent?.toLowerCase().includes(text));
  }
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function labelMatches(type: DecisionType, label: string) {
  const normalized = label.toLowerCase();
  const words: Record<DecisionType, string[]> = {
    purchase: ["buy now", "place order", "checkout"],
    email: ["send"],
    job: ["apply", "submit application"],
    subscription: ["subscribe", "start trial", "upgrade"],
    investment: ["invest", "buy", "place order"]
  };
  return words[type].some((word) => normalized.includes(word));
}

function actionLabel(element: HTMLElement) {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("data-tooltip") ||
    element.getAttribute("title") ||
    element.getAttribute("value") ||
    element.querySelector("input")?.getAttribute("value") ||
    element.querySelector("[aria-label]")?.getAttribute("aria-label") ||
    element.textContent ||
    "Important action"
  ).trim();
}

function websiteName() {
  const host = location.hostname.replace(/^www\./, "");
  if (host.includes("amazon")) return "Amazon";
  if (host.includes("flipkart")) return "Flipkart";
  if (host.includes("mail.google")) return "Gmail";
  if (host.includes("linkedin")) return "LinkedIn Jobs";
  if (host.includes("naukri")) return "Naukri";
  if (host.includes("indeed")) return "Indeed";
  if (host.includes("zerodha")) return "Zerodha";
  if (host.includes("groww")) return "Groww";
  return host;
}

function extractTitle(type: DecisionType) {
  if (type === "email") return document.querySelector("input[name='subjectbox']")?.getAttribute("value") || "Email draft";
  return (
    text("#productTitle") ||
    text("span.B_NuCI") ||
    text("h1") ||
    document.title.split("|")[0].trim()
  );
}

function extractPrice() {
  const candidates = [
    "#priceblock_ourprice",
    "#priceblock_dealprice",
    "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen",
    ".a-price .a-offscreen",
    ".a-price-whole",
    ".apexPriceToPay .a-offscreen",
    "._30jeq3",
    "[data-testid='price']",
    "[class*='price']"
  ];
  for (const selector of candidates) {
    const value = text(selector);
    const parsed = parsePrice(value);
    if (parsed) return parsed;
  }
  return undefined;
}

function parsePrice(value?: string) {
  if (!value) return undefined;
  const number = value.replace(/[^0-9.]/g, "");
  return number ? Math.round(Number(number)) : undefined;
}

function extractCategory() {
  return text("#wayfinding-breadcrumbs_feature_div") || text("._1MR4o5") || "General";
}

function extractEmailBody() {
  const body = document.querySelector("[aria-label='Message Body'], div[role='textbox'][contenteditable='true']");
  return body?.textContent?.trim();
}

function extractJobTitle() {
  return text(".job-details-jobs-unified-top-card__job-title") || text("h1") || document.title;
}

function extractCompany() {
  return text(".job-details-jobs-unified-top-card__company-name") || text("[class*='company']") || undefined;
}

function extractSalary() {
  const body = document.body.textContent || "";
  return body.match(/(?:Rs\.?|₹|\$)\s?[0-9,.]+(?:\s?-\s?(?:Rs\.?|₹|\$)?\s?[0-9,.]+)?/i)?.[0];
}

function text(selector: string) {
  return document.querySelector(selector)?.textContent?.replace(/\s+/g, " ").trim();
}
