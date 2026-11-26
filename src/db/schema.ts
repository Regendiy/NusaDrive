import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  phone: text('phone').default(''),
  role: text('role').notNull().default('customer'), // 'admin' | 'owner' | 'customer'
  createdAt: timestamp('created_at').defaultNow(),
});

export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(), // 'MPV' | 'SUV' | 'Sedan' | 'EV'
  plateNumber: text('plate_number').notNull().unique(),
  year: integer('year').notNull(),
  transmission: text('transmission').notNull(), // 'Otomatis' | 'Manual'
  fuelType: text('fuel_type').notNull(), // 'Bensin' | 'Hybrid' | 'Listrik' | 'Diesel'
  seats: integer('seats').notNull(),
  dailyRate: integer('daily_rate').notNull(),
  driverFeePerDay: integer('driver_fee_per_day').notNull().default(200000),
  imageUrl: text('image_url').notNull(),
  status: text('status').notNull().default('available'), // 'available' | 'rented' | 'maintenance'
  features: text('features').notNull().default('[]'),
  ownerUid: text('owner_uid'),
  ownerName: text('owner_name').notNull().default('Mitra NusaDrive Batam'),
  ownerWhatsapp: text('owner_whatsapp').notNull().default('628117700123'),
  ownerSharePercent: integer('owner_share_percent').notNull().default(80),
  currentLat: text('current_lat').notNull().default('1.1286'),
  currentLng: text('current_lng').notNull().default('104.0539'),
  currentSpeedKmh: integer('current_speed_kmh').notNull().default(0),
  currentHeading: integer('current_heading').notNull().default(0),
  trackingStatus: text('tracking_status').notNull().default('parked'), // 'parked' | 'en_route' | 'idle'
  trackingLocationLabel: text('tracking_location_label').notNull().default('Pool Batam Centre'),
  gpsUpdatedAt: timestamp('gps_updated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerWhatsapp: text('customer_whatsapp').notNull(),
  vehicleId: integer('vehicle_id')
    .references(() => vehicles.id)
    .notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(),     // YYYY-MM-DD
  totalDays: integer('total_days').notNull(),
  withDriver: boolean('with_driver').notNull().default(false),
  pickupLocation: text('pickup_location').notNull(),
  notes: text('notes').default(''),
  ktpNumber: text('ktp_number').notNull().default(''),
  ktpPhotoData: text('ktp_photo_data').notNull().default(''),
  kkPhotoData: text('kk_photo_data').notNull().default(''),
  simPhotoData: text('sim_photo_data').notNull().default(''),
  selfiePhotoData: text('selfie_photo_data').notNull().default(''),
  termsAccepted: boolean('terms_accepted').notNull().default(true),
  kycStatus: text('kyc_status').notNull().default('pending'), // 'pending' | 'verified' | 'rejected'
  kycNotes: text('kyc_notes').notNull().default(''),
  baseAmount: integer('base_amount').notNull(),
  driverAmount: integer('driver_amount').notNull(),
  taxAmount: integer('tax_amount').notNull(),
  totalAmount: integer('total_amount').notNull(),
  bookingStatus: text('booking_status').notNull().default('pending'), // 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
  paymentStatus: text('payment_status').notNull().default('unpaid'),  // 'unpaid' | 'paid' | 'refunded'
  paymentMethod: text('payment_method').default(''),
  paymentReference: text('payment_reference').default(''),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const whatsappNotifications = pgTable('whatsapp_notifications', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id').references(() => bookings.id),
  bookingCode: text('booking_code').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  recipientName: text('recipient_name').notNull(),
  eventType: text('event_type').notNull(), // 'booking_created' | 'payment_confirmed' | 'pickup_ready' | 'rental_completed' | 'booking_cancelled'
  messageBody: text('message_body').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('delivered'),
  providerRef: text('provider_ref').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userUid],
    references: [users.uid],
  }),
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
  notifications: many(whatsappNotifications),
}));

export const whatsappNotificationsRelations = relations(whatsappNotifications, ({ one }) => ({
  booking: one(bookings, {
    fields: [whatsappNotifications.bookingId],
    references: [bookings.id],
  }),
}));
