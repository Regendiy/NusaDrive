import type { Vehicle } from '../types';

export interface PriceBounds {
  min: number;
  max: number;
  step: number;
}

export interface FleetFilterCriteria {
  category: string;
  searchQuery: string;
  fuelType: string;
  transmissions: string[];
  minPrice: number;
  maxPrice: number;
}

const DEFAULT_STEP = 50_000;
const FALLBACK_BOUNDS: PriceBounds = {
  min: 500_000,
  max: 3_000_000,
  step: DEFAULT_STEP,
};

export function computePriceBounds(vehicles: Vehicle[]): PriceBounds {
  if (vehicles.length === 0) {
    return FALLBACK_BOUNDS;
  }

  let rawMin = Infinity;
  let rawMax = -Infinity;
  for (const v of vehicles) {
    if (Number.isFinite(v.dailyRate)) {
      if (v.dailyRate < rawMin) rawMin = v.dailyRate;
      if (v.dailyRate > rawMax) rawMax = v.dailyRate;
    }
  }

  if (!Number.isFinite(rawMin) || !Number.isFinite(rawMax)) {
    return FALLBACK_BOUNDS;
  }

  const min = Math.floor(rawMin / DEFAULT_STEP) * DEFAULT_STEP;
  let max = Math.ceil(rawMax / DEFAULT_STEP) * DEFAULT_STEP;
  if (max <= min) {
    max = min + DEFAULT_STEP * 4;
  }

  return { min, max, step: DEFAULT_STEP };
}

export function extractTransmissionOptions(vehicles: Vehicle[]): Array<{
  value: string;
  count: number;
}> {
  const counts = new Map<string, number>();
  for (const v of vehicles) {
    const label = v.transmission?.trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const preferredOrder = ['Otomatis', 'Manual'];
  const keys = Array.from(new Set([...preferredOrder, ...counts.keys()]));

  return keys.map((value) => ({
    value,
    count: counts.get(value) ?? 0,
  }));
}

export function toggleTransmissionSelection(
  current: string[],
  value: string
): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}

export function filterVehicles(
  vehicles: Vehicle[],
  criteria: FleetFilterCriteria
): Vehicle[] {
  const q = criteria.searchQuery.trim().toLowerCase();

  return vehicles.filter((v) => {
    const catOk = criteria.category === 'Semua' || v.category === criteria.category;
    if (!catOk) return false;

    const fuelOk = criteria.fuelType === 'Semua' || v.fuelType === criteria.fuelType;
    if (!fuelOk) return false;

    const transmissionOk =
      criteria.transmissions.length === 0 ||
      criteria.transmissions.includes(v.transmission);
    if (!transmissionOk) return false;

    const priceOk =
      v.dailyRate >= criteria.minPrice && v.dailyRate <= criteria.maxPrice;
    if (!priceOk) return false;

    if (!q) return true;
    return (
      v.name.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.plateNumber.toLowerCase().includes(q)
    );
  });
}

export function hasActiveAdvancedFilters(
  criteria: FleetFilterCriteria,
  bounds: PriceBounds
): boolean {
  return (
    criteria.category !== 'Semua' ||
    criteria.searchQuery.trim().length > 0 ||
    criteria.fuelType !== 'Semua' ||
    criteria.transmissions.length > 0 ||
    criteria.minPrice > bounds.min ||
    criteria.maxPrice < bounds.max
  );
}
