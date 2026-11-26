export interface BatamWaypoint {
  label: string;
  lat: number;
  lng: number;
  heading: number;
  defaultSpeedKmh: number;
}

export const BATAM_GPS_WAYPOINTS: BatamWaypoint[] = [
  {
    label: 'Pool Batam Centre (Jl. Engku Putri)',
    lat: 1.1286,
    lng: 104.0539,
    heading: 90,
    defaultSpeedKmh: 0,
  },
  {
    label: 'Bandara Internasional Hang Nadim',
    lat: 1.1210,
    lng: 104.1186,
    heading: 285,
    defaultSpeedKmh: 46,
  },
  {
    label: 'Pelabuhan Ferry Harbour Bay',
    lat: 1.1536,
    lng: 104.0005,
    heading: 145,
    defaultSpeedKmh: 38,
  },
  {
    label: 'Kawasan Bisnis Nagoya Hill',
    lat: 1.1422,
    lng: 104.0138,
    heading: 115,
    defaultSpeedKmh: 32,
  },
  {
    label: 'Nongsa Pura & Resort Coast',
    lat: 1.1895,
    lng: 104.0958,
    heading: 210,
    defaultSpeedKmh: 54,
  },
  {
    label: 'Kawasan Industri Kabil',
    lat: 1.0872,
    lng: 104.1292,
    heading: 310,
    defaultSpeedKmh: 48,
  },
  {
    label: 'Jembatan 1 Barelang',
    lat: 0.9814,
    lng: 104.0419,
    heading: 15,
    defaultSpeedKmh: 58,
  },
];

export function computeNextBatamWaypoint(params: {
  currentLat?: string | number;
  currentLng?: string | number;
  vehicleId: number;
  requestedStatus?: string;
}) {
  const latNum = Number(params.currentLat);
  const lngNum = Number(params.currentLng);

  let closestIndex = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    BATAM_GPS_WAYPOINTS.forEach((wp, idx) => {
      const dist = Math.hypot(wp.lat - latNum, wp.lng - lngNum);
      if (dist < bestDist) {
        bestDist = dist;
        closestIndex = idx;
      }
    });
  } else {
    closestIndex = params.vehicleId % BATAM_GPS_WAYPOINTS.length;
  }

  const nextIndex = (closestIndex + 1) % BATAM_GPS_WAYPOINTS.length;
  const next = BATAM_GPS_WAYPOINTS[nextIndex];
  const status =
    params.requestedStatus ||
    (nextIndex === 0 ? 'parked' : 'en_route');

  return {
    currentLat: next.lat.toFixed(4),
    currentLng: next.lng.toFixed(4),
    currentHeading: next.heading,
    currentSpeedKmh: status === 'parked' ? 0 : next.defaultSpeedKmh || 42,
    trackingStatus: status,
    trackingLocationLabel: next.label,
  };
}

export interface OwnerShareSummary {
  grossPaidRevenue: number;
  ownerNetPayout: number;
  platformFeeAmount: number;
  paidBookingsCount: number;
}

export function computeOwnerShareBreakdown(
  bookings: Array<{
    paymentStatus: string;
    bookingStatus: string;
    baseAmount: number;
    vehicle?: { ownerSharePercent?: number | null };
  }>
): OwnerShareSummary {
  let grossPaidRevenue = 0;
  let ownerNetPayout = 0;
  let paidBookingsCount = 0;

  for (const b of bookings) {
    if (b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled') {
      const share = Math.min(95, Math.max(50, Number(b.vehicle?.ownerSharePercent ?? 80)));
      const ownerPart = Math.round((b.baseAmount * share) / 100);
      grossPaidRevenue += b.baseAmount;
      ownerNetPayout += ownerPart;
      paidBookingsCount += 1;
    }
  }

  return {
    grossPaidRevenue,
    ownerNetPayout,
    platformFeeAmount: Math.max(0, grossPaidRevenue - ownerNetPayout),
    paidBookingsCount,
  };
}
