import heroFleetImg from '../assets/images/hero_rental_fleet_1794672684541.jpg';
import carMpvImg from '../assets/images/car_mpv_zenix_1794672684036.jpg';
import carSuvImg from '../assets/images/car_suv_fortuner_1794672684762.jpg';
import carEvImg from '../assets/images/car_ev_ioniq_1794672685380.jpg';
import carSedanImg from '../assets/images/car_sedan_camry_1794672685228.jpg';

export const HERO_FLEET_IMAGE = heroFleetImg;

export const VEHICLE_CATEGORY_IMAGES: Record<string, string> = {
  MPV: carMpvImg,
  SUV: carSuvImg,
  EV: carEvImg,
  Sedan: carSedanImg,
};

const BUNDLED_IMAGE_LOOKUP: Record<string, string> = {
  'hero_rental_fleet_1794672684541.jpg': heroFleetImg,
  'car_mpv_zenix_1794672684036.jpg': carMpvImg,
  'car_suv_fortuner_1794672684762.jpg': carSuvImg,
  'car_ev_ioniq_1794672685380.jpg': carEvImg,
  'car_sedan_camry_1794672685228.jpg': carSedanImg,
};

/**
 * Resolves vehicle image URLs stored in PostgreSQL (e.g. "/src/assets/images/...")
 * into Vite-bundled asset URLs so images load cleanly both in dev and static dist builds
 * (including GitHub Pages subpath deployments).
 */
export function resolveVehicleImageUrl(
  rawUrl: string | undefined | null,
  category?: string
): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return VEHICLE_CATEGORY_IMAGES[category || 'MPV'] || carMpvImg;
  }

  for (const [filename, bundledUrl] of Object.entries(BUNDLED_IMAGE_LOOKUP)) {
    if (trimmed.includes(filename)) {
      return bundledUrl;
    }
  }

  return trimmed;
}
