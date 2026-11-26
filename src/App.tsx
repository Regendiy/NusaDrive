import { useCallback, useEffect, useRef, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase';
import { AppView, Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FleetCatalog } from './components/FleetCatalog';
import { ServiceMechanismSection } from './components/ServiceMechanismSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FAQSection } from './components/FAQSection';
import { BookingModal } from './components/BookingModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BatamPickupMap } from './components/BatamPickupMap';
import { FleetTrackingMap } from './components/FleetTrackingMap';
import { CustomerDashboard } from './components/CustomerDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import type {
  Booking,
  UserProfile,
  UserRole,
  Vehicle,
  WhatsappNotificationLog,
} from './types';
import {
  resolveInitialTheme,
  THEME_STORAGE_KEY,
  ThemeMode,
  toggleThemeMode,
} from './utils/theme';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const prefersDark =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      return resolveInitialTheme({ stored, prefersDark });
    } catch {
      return 'light';
    }
  });
  const [activeView, setActiveView] = useState<AppView>('armada');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<WhatsappNotificationLog[]>([]);

  const [bookingVehicle, setBookingVehicle] = useState<Vehicle | null>(null);
  const [quickFilters, setQuickFilters] = useState<{
    startDate?: string;
    endDate?: string;
    pickupLocation?: string;
  }>({});
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => toggleThemeMode(prev));
  }, []);

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  const getAuthToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

  const fetchVehicles = useCallback(async () => {
    setVehiclesLoading(true);
    setVehiclesError(null);
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat armada.');
      }
      setVehicles(data.vehicles || []);
    } catch (err: any) {
      setVehiclesError(err.message || 'Gagal memuat armada kendaraan.');
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const fetchAuthenticatedData = useCallback(async (roleOverride?: string) => {
    const token = await getAuthToken();
    if (!token) return;

    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const meRes = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        throw new Error('Gagal menyinkronkan profil pengguna.');
      }
      const meData = await meRes.json();
      const profile: UserProfile = meData.user;
      setUserProfile(profile);

      const effectiveRole = roleOverride || profile.role;
      const scopeParam = effectiveRole === 'admin' ? '?scope=all' : '';

      const requests: Promise<Response>[] = [
        fetch(`/api/bookings${scopeParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/notifications${scopeParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];
      if (effectiveRole === 'owner' || effectiveRole === 'admin') {
        requests.push(
          fetch('/api/owner/bookings', {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
      }

      const [bRes, nRes, obRes] = await Promise.all(requests);

      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData.notifications || []);
      }
      if (obRes && obRes.ok) {
        const obData = await obRes.json();
        setOwnerBookings(obData.bookings || []);
      } else if (effectiveRole === 'customer') {
        setOwnerBookings([]);
      }
    } catch (err: any) {
      setBookingsError(err.message || 'Gagal memuat data transaksi.');
    } finally {
      setBookingsLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (!fbUser) {
        setUserProfile(null);
        setBookings([]);
        setNotifications([]);
        return;
      }

      await fetchAuthenticatedData();

      // Open real-time SSE stream for WhatsApp notifications & booking updates
      try {
        const token = await fbUser.getIdToken();
        const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
        eventSourceRef.current = es;

        es.addEventListener('whatsapp_notification', (event) => {
          try {
            const log: WhatsappNotificationLog = JSON.parse((event as MessageEvent).data);
            setNotifications((prev) => {
              if (prev.some((p) => p.id === log.id)) return prev;
              return [log, ...prev];
            });
            showToast(`Notifikasi WhatsApp terkirim ke +${log.recipientPhone} (${log.bookingCode})`);
          } catch {
            // Ignore malformed event
          }
        });

        es.addEventListener('booking_updated', () => {
          fetchAuthenticatedData();
          fetchVehicles();
        });

        es.addEventListener('vehicle_updated', () => {
          fetchVehicles();
        });

        es.addEventListener('vehicle_tracked', (event) => {
          try {
            const tracked: Vehicle = JSON.parse((event as MessageEvent).data);
            setVehicles((prev) =>
              prev.map((v) => (v.id === tracked.id ? { ...v, ...tracked } : v))
            );
          } catch {
            fetchVehicles();
          }
        });
      } catch {
        // SSE optional degradation
      }
    });

    return () => {
      unsub();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [fetchAuthenticatedData, fetchVehicles, showToast]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
      showToast('Berhasil masuk dengan akun Google.');
    } catch (err: any) {
      showToast(err?.message || 'Login dibatalkan atau gagal.');
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveView('armada');
    showToast('Anda telah keluar dari sesi.');
  };

  const handleSwitchRole = async (role: UserRole) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch('/api/me/role', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const data = await res.json();
      setUserProfile(data.user);
      await fetchAuthenticatedData(role);
      const label =
        role === 'admin'
          ? 'Admin'
          : role === 'owner'
          ? 'Pemilik Mobil'
          : 'Pelanggan';
      showToast(`Beralih ke mode ${label}.`);
    }
  };

  const handleClaimDemoVehicles = async () => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch('/api/owner/claim-demo', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchVehicles();
      await fetchAuthenticatedData();
      showToast('Unit mitra berhasil dihubungkan ke akun Pemilik Mobil Anda.');
    }
  };

  const handleSimulateVehiclePing = async (vehicleId: number, requestedStatus?: string) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/vehicles/${vehicleId}/tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ trackingStatus: requestedStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.vehicle) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === data.vehicle.id ? { ...v, ...data.vehicle } : v))
        );
        showToast(
          `GPS ${data.vehicle.name} diperbarui: ${data.vehicle.trackingLocationLabel}`
        );
      }
    }
  };

  const handleUpdateKyc = async (
    bookingId: number,
    kycStatus: 'verified' | 'rejected' | 'pending',
    kycNotes: string
  ) => {
    const token = await getAuthToken();
    if (!token) return { ok: false, error: 'Sesi otentikasi tidak valid.' };
    const res = await fetch(`/api/bookings/${bookingId}/kyc`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kycStatus, kycNotes }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchAuthenticatedData();
    showToast(`Status verifikasi dokumen diperbarui ke ${kycStatus}.`);
    return { ok: true };
  };

  const handleBookingCreated = async (bookingId: number) => {
    setBookingVehicle(null);
    await fetchAuthenticatedData();
    setActiveView('pelanggan');
    showToast('Pemesanan tercatat dan notifikasi WhatsApp telah dikirim.');

    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch('/api/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const created = (data.bookings || []).find((b: Booking) => b.id === bookingId);
      if (created) {
        setPayingBooking(created);
      }
    }
  };

  const handlePaymentSuccess = async (updatedBooking: Booking) => {
    setPayingBooking(null);
    setBookings((prev) => prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)));
    setReceiptBooking(updatedBooking);
    await fetchAuthenticatedData();
    showToast(`Pembayaran ${updatedBooking.bookingCode} lunas. Struk pembayaran & WhatsApp siap!`);
  };

  const handleCancelBooking = async (bookingId: number) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingStatus: 'cancelled' }),
    });
    if (res.ok) {
      await fetchAuthenticatedData();
      await fetchVehicles();
      showToast('Pemesanan dibatalkan dan pemberitahuan WhatsApp dikirim.');
    }
  };

  const handleCreateVehicle = async (payload: {
    name: string;
    brand: string;
    category: string;
    plateNumber: string;
    year: number;
    transmission: string;
    fuelType: string;
    seats: number;
    dailyRate: number;
    driverFeePerDay: number;
    imageUrl: string;
  }) => {
    const token = await getAuthToken();
    if (!token) return { ok: false, error: 'Sesi otentikasi tidak valid.' };
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchVehicles();
    showToast(`Unit ${payload.name} ditambahkan ke database.`);
    return { ok: true };
  };

  const handleUpdateVehicleStatus = async (id: number, status: string) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchVehicles();
      showToast('Status kendaraan diperbarui.');
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    const token = await getAuthToken();
    if (!token) return { ok: false, error: 'Tidak terautentikasi.' };
    const res = await fetch(`/api/vehicles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error };
    await fetchVehicles();
    showToast('Kendaraan berhasil dihapus.');
    return { ok: true };
  };

  const handleUpdateBookingStatus = async (id: number, bookingStatus: string) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingStatus }),
    });
    if (res.ok) {
      await fetchAuthenticatedData();
      await fetchVehicles();
      showToast('Status pemesanan diperbarui & notifikasi WhatsApp diproses.');
    }
  };

  const handleResendWhatsapp = async (bookingId: number) => {
    const token = await getAuthToken();
    if (!token) return;
    const res = await fetch('/api/notifications/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId }),
    });
    if (res.ok) {
      await fetchAuthenticatedData();
      showToast('Pengingat WhatsApp berhasil dikirim ulang.');
    }
  };

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const appShell = (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 dark:text-amber-50 hover:text-amber-800 dark:hover:text-amber-200"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar
        activeView={activeView}
        onNavigate={setActiveView}
        user={userProfile}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm px-4 py-3 rounded-lg border border-slate-700 shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      <main className="flex-1">
        {activeView === 'armada' && (
          <>
            <HeroSection
              selectedPickupLocation={quickFilters.pickupLocation}
              onExploreFleet={() => {
                document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreMap={() => {
                document.getElementById('peta-batam')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onQuickSearch={({ startDate, endDate, category, pickupLocation }) => {
                setSelectedCategory(category);
                setQuickFilters({ startDate, endDate, pickupLocation });
                document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <FleetCatalog
              vehicles={vehicles}
              loading={vehiclesLoading}
              error={vehiclesError}
              selectedCategory={selectedCategory}
              activeSchedule={quickFilters}
              onClearSchedule={() => {
                setQuickFilters({});
                setSelectedCategory('Semua');
              }}
              onCategoryChange={setSelectedCategory}
              onSelectVehicle={(v) => setBookingVehicle(v)}
              onRetry={fetchVehicles}
            />

            <BatamPickupMap
              theme={theme}
              selectedLocation={quickFilters.pickupLocation}
              onSelectPickupLocation={(loc) => {
                setQuickFilters((prev) => ({ ...prev, pickupLocation: loc }));
                showToast(`Titik pengambilan diatur ke: ${loc}`);
              }}
            />

            <section
              id="pelacakan-armada"
              className="py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <FleetTrackingMap
                  vehicles={vehicles}
                  theme={theme}
                  canSimulatePing={
                    userProfile?.role === 'admin' || userProfile?.role === 'owner'
                  }
                  onSimulateVehiclePing={handleSimulateVehiclePing}
                />
              </div>
            </section>

            <ServiceMechanismSection />

            <TestimonialsSection
              onBookNow={() => {
                document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <FAQSection
              onExploreFleet={() => {
                document.getElementById('katalog-armada')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreMap={() => {
                document.getElementById('peta-batam')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </>
        )}

        {activeView === 'pelanggan' && (
          <CustomerDashboard
            user={userProfile}
            bookings={bookings}
            vehicles={vehicles}
            notifications={notifications}
            loading={bookingsLoading}
            error={bookingsError}
            theme={theme}
            onSignIn={handleSignIn}
            onNewBooking={() => setActiveView('armada')}
            onPayBooking={(b) => setPayingBooking(b)}
            onViewReceipt={(b) => setReceiptBooking(b)}
            onCancelBooking={handleCancelBooking}
          />
        )}

        {activeView === 'pemilik' && (
          <OwnerDashboard
            user={userProfile}
            vehicles={vehicles}
            ownerBookings={ownerBookings}
            loading={bookingsLoading}
            theme={theme}
            onSignIn={handleSignIn}
            onSwitchRole={handleSwitchRole}
            onClaimDemoVehicles={handleClaimDemoVehicles}
            onCreateVehicle={handleCreateVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onSimulateVehiclePing={handleSimulateVehiclePing}
            onUpdateKyc={handleUpdateKyc}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            theme={theme}
            user={userProfile}
            vehicles={vehicles}
            bookings={bookings}
            notifications={notifications}
            loading={bookingsLoading}
            onSignIn={handleSignIn}
            onSwitchRole={handleSwitchRole}
            onCreateVehicle={handleCreateVehicle}
            onUpdateVehicleStatus={handleUpdateVehicleStatus}
            onDeleteVehicle={handleDeleteVehicle}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onUpdateKyc={handleUpdateKyc}
            onSimulateVehiclePing={handleSimulateVehiclePing}
            onResendWhatsapp={handleResendWhatsapp}
            onViewReceipt={(b) => setReceiptBooking(b)}
          />
        )}
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            NusaDrive Fleet &amp; Mobility · Batam, Kepulauan Riau
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView('armada')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Armada
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pelanggan')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Portal Pelanggan
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pemilik')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Pemilik Mobil
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Admin
            </button>
          </div>
          <p>© {new Date().getFullYear()} NusaDrive Batam. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>

      {bookingVehicle && (
        <BookingModal
          vehicle={bookingVehicle}
          initialStartDate={quickFilters.startDate}
          initialEndDate={quickFilters.endDate}
          initialPickupLocation={quickFilters.pickupLocation}
          user={userProfile}
          getAuthToken={getAuthToken}
          onSignIn={handleSignIn}
          onClose={() => setBookingVehicle(null)}
          onBookingCreated={handleBookingCreated}
        />
      )}

      {payingBooking && (
        <PaymentModal
          booking={payingBooking}
          getAuthToken={getAuthToken}
          onClose={() => setPayingBooking(null)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {receiptBooking && (
        <ReceiptModal
          booking={receiptBooking}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </div>
  );

  return googleMapsApiKey ? (
    <APIProvider
      apiKey={googleMapsApiKey}
      language="id"
      region="ID"
      libraries={['places', 'marker']}
    >
      {appShell}
    </APIProvider>
  ) : (
    appShell
  );
}
