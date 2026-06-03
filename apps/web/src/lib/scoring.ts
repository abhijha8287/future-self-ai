export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function parseMoney(text?: string) {
  if (!text) return undefined;
  const numeric = text.replace(/[^0-9.]/g, "");
  return numeric ? Number(numeric) : undefined;
}

export function rupee(value: number) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

export function futureValue(amount: number, years = 10, annualReturn = 0.11) {
  return Math.round(amount * Math.pow(1 + annualReturn, years));
}
