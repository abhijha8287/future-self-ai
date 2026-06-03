import type { DecisionRecord } from "@/types/decision";

const store = globalThis as typeof globalThis & {
  __futureselfHistory?: DecisionRecord[];
};

const records = store.__futureselfHistory ?? [];
store.__futureselfHistory = records;

export function listDecisionRecords() {
  return [...records].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function addDecisionRecord(record: DecisionRecord) {
  const existingIndex = records.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.unshift(record);
  }
  return record;
}

export function addDecisionRecords(nextRecords: DecisionRecord[]) {
  nextRecords.forEach(addDecisionRecord);
  return listDecisionRecords();
}

export function clearDecisionRecords() {
  records.splice(0, records.length);
}
