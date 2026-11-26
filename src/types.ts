export type UserRole = 'admin' | 'owner' | 'customer';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
}

export interface Vehicle {
  id: number;
  name: string;
  brand: string;
  category: 'MPV' | 'SUV' | 'Sedan' | 'EV' | string;
  plateNumber: string;
  year: number;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRate: number;
  driverFeePerDay: number;
  imageUrl: string;
  status: 'available' | 'rented' | 'maintenance' | string;
  features: string;
  ownerUid?: string | null;
  ownerName?: string;
  ownerWhatsapp?: string;
  ownerSharePercent?: number;
  currentLat?: string;
  currentLng?: string;
  currentSpeedKmh?: number;
  currentHeading?: number;
  trackingStatus?: 'parked' | 'en_route' | 'idle' | string;
  trackingLocationLabel?: string;
  gpsUpdatedAt?: string | null;
}

export interface Booking {
  id: number;
  bookingCode: string;
  userUid: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  withDriver: boolean;
  pickupLocation: string;
  notes: string | null;
  ktpNumber: string;
  ktpPhotoData: string;
  kkPhotoData: string;
  simPhotoData: string;
  selfiePhotoData: string;
  termsAccepted: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected' | string;
  kycNotes: string;
  baseAmount: number;
  driverAmount: number;
  taxAmount: number;
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | string;
  paymentMethod: string | null;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string | null;
  vehicle: Vehicle;
}

export interface WhatsappNotificationLog {
  id: number;
  bookingId: number | null;
  bookingCode: string;
  recipientPhone: string;
  recipientName: string;
  eventType: string;
  messageBody: string;
  deliveryStatus: string;
  providerRef: string;
  createdAt: string | null;
}
