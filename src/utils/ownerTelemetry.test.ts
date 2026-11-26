import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BATAM_GPS_WAYPOINTS,
  computeNextBatamWaypoint,
  computeOwnerShareBreakdown,
} from './ownerTelemetry.ts';

test('computeNextBatamWaypoint advances along Batam corridors', () => {
  const first = BATAM_GPS_WAYPOINTS[0];
  const next = computeNextBatamWaypoint({
    currentLat: first.lat,
    currentLng: first.lng,
    vehicleId: 1,
  });

  assert.equal(next.trackingLocationLabel, BATAM_GPS_WAYPOINTS[1].label);
  assert.equal(next.trackingStatus, 'en_route');
  assert.ok(next.currentSpeedKmh > 0);

  const parked = computeNextBatamWaypoint({
    currentLat: BATAM_GPS_WAYPOINTS[1].lat,
    currentLng: BATAM_GPS_WAYPOINTS[1].lng,
    vehicleId: 1,
    requestedStatus: 'parked',
  });
  assert.equal(parked.trackingStatus, 'parked');
  assert.equal(parked.currentSpeedKmh, 0);
});

test('computeOwnerShareBreakdown calculates 80/20 net owner payout on paid non-cancelled bookings', () => {
  const result = computeOwnerShareBreakdown([
    {
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      baseAmount: 2000000,
      vehicle: { ownerSharePercent: 80 },
    },
    {
      paymentStatus: 'paid',
      bookingStatus: 'cancelled',
      baseAmount: 1000000,
      vehicle: { ownerSharePercent: 80 },
    },
    {
      paymentStatus: 'unpaid',
      bookingStatus: 'pending',
      baseAmount: 1500000,
      vehicle: { ownerSharePercent: 85 },
    },
  ]);

  assert.equal(result.paidBookingsCount, 1);
  assert.equal(result.grossPaidRevenue, 2000000);
  assert.equal(result.ownerNetPayout, 1600000);
  assert.equal(result.platformFeeAmount, 400000);
});
