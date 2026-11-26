import test from 'node:test';
import assert from 'node:assert/strict';
import type { Vehicle } from '../types';
import {
  computePriceBounds,
  extractTransmissionOptions,
  filterVehicles,
  hasActiveAdvancedFilters,
  toggleTransmissionSelection,
} from './fleetFilters';

const SAMPLE_VEHICLES: Vehicle[] = [
  {
    id: 1,
    name: 'Toyota Kijang Innova Zenix Q',
    brand: 'Toyota',
    category: 'MPV',
    plateNumber: 'BP 2481 KJN',
    year: 2025,
    transmission: 'Otomatis',
    fuelType: 'Hybrid',
    seats: 7,
    dailyRate: 950_000,
    driverFeePerDay: 200_000,
    imageUrl: '',
    status: 'available',
    features: '[]',
  },
  {
    id: 2,
    name: 'Toyota Fortuner VRZ 4x2',
    brand: 'Toyota',
    category: 'SUV',
    plateNumber: 'BP 1102 ABC',
    year: 2025,
    transmission: 'Otomatis',
    fuelType: 'Diesel',
    seats: 7,
    dailyRate: 1_450_000,
    driverFeePerDay: 200_000,
    imageUrl: '',
    status: 'available',
    features: '[]',
  },
  {
    id: 3,
    name: 'Toyota Avanza 1.5 G MT',
    brand: 'Toyota',
    category: 'MPV',
    plateNumber: 'BP 1901 DEF',
    year: 2024,
    transmission: 'Manual',
    fuelType: 'Bensin',
    seats: 7,
    dailyRate: 550_000,
    driverFeePerDay: 150_000,
    imageUrl: '',
    status: 'available',
    features: '[]',
  },
  {
    id: 4,
    name: 'Toyota Alphard Hybrid',
    brand: 'Toyota',
    category: 'MPV',
    plateNumber: 'BP 1924 NDV',
    year: 2025,
    transmission: 'Otomatis',
    fuelType: 'Hybrid',
    seats: 7,
    dailyRate: 2_450_000,
    driverFeePerDay: 250_000,
    imageUrl: '',
    status: 'available',
    features: '[]',
  },
];

test('computePriceBounds derives 50k-step bounds from vehicle rates and falls back cleanly', () => {
  const bounds = computePriceBounds(SAMPLE_VEHICLES);
  assert.equal(bounds.min, 550_000);
  assert.equal(bounds.max, 2_450_000);
  assert.equal(bounds.step, 50_000);

  const emptyBounds = computePriceBounds([]);
  assert.ok(emptyBounds.max > emptyBounds.min);
});

test('extractTransmissionOptions includes Otomatis and Manual with accurate counts', () => {
  const options = extractTransmissionOptions(SAMPLE_VEHICLES);
  const auto = options.find((o) => o.value === 'Otomatis');
  const manual = options.find((o) => o.value === 'Manual');
  assert.equal(auto?.count, 3);
  assert.equal(manual?.count, 1);
});

test('toggleTransmissionSelection toggles transmission values cleanly', () => {
  const afterAdd = toggleTransmissionSelection([], 'Manual');
  assert.deepEqual(afterAdd, ['Manual']);
  const afterSecond = toggleTransmissionSelection(afterAdd, 'Otomatis');
  assert.deepEqual(afterSecond, ['Manual', 'Otomatis']);
  const afterRemove = toggleTransmissionSelection(afterSecond, 'Manual');
  assert.deepEqual(afterRemove, ['Otomatis']);
});

test('filterVehicles filters accurately by price range and transmission checkboxes', () => {
  const bounds = computePriceBounds(SAMPLE_VEHICLES);

  const manualOnly = filterVehicles(SAMPLE_VEHICLES, {
    category: 'Semua',
    searchQuery: '',
    fuelType: 'Semua',
    transmissions: ['Manual'],
    minPrice: bounds.min,
    maxPrice: bounds.max,
  });
  assert.equal(manualOnly.length, 1);
  assert.equal(manualOnly[0].id, 3);

  const midPriceAuto = filterVehicles(SAMPLE_VEHICLES, {
    category: 'Semua',
    searchQuery: '',
    fuelType: 'Semua',
    transmissions: ['Otomatis'],
    minPrice: 900_000,
    maxPrice: 1_500_000,
  });
  assert.deepEqual(
    midPriceAuto.map((v) => v.id),
    [1, 2]
  );

  assert.equal(
    hasActiveAdvancedFilters(
      {
        category: 'Semua',
        searchQuery: '',
        fuelType: 'Semua',
        transmissions: [],
        minPrice: bounds.min,
        maxPrice: bounds.max,
      },
      bounds
    ),
    false
  );

  assert.equal(
    hasActiveAdvancedFilters(
      {
        category: 'Semua',
        searchQuery: '',
        fuelType: 'Semua',
        transmissions: ['Otomatis'],
        minPrice: bounds.min,
        maxPrice: bounds.max,
      },
      bounds
    ),
    true
  );
});
