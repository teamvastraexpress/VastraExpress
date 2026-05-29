'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapPin, Phone, Navigation, Clock, Building2, Loader2, ArrowLeft } from 'lucide-react';
import type { MapFacility } from '@/types';

/** Build the Google Maps embed URL (free, no API key required) */
function buildEmbedUrl(coordinates: string, zoom: number): string {
  return `https://maps.google.com/maps?q=${coordinates}&z=${zoom}&output=embed`;
}

/* ─── Skeleton loader ──────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="h-4 bg-white/10 rounded w-3/4" />
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-1/2" />
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export function StoreLocationsMap() {
  const [facilities, setFacilities] = useState<MapFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  
  // Hovered store ID (for syncing state with the left list cards)
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  // Clicked/selected store ID (for zooming map)
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);

  /* ── Fetch facilities from the public endpoint ── */
  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/facilities/public`);
      if (!res.ok) throw new Error('Failed to load store locations');
      const data: MapFacility[] = await res.json();
      // Cast Prisma Decimal strings to numbers
      const normalized = data.map((f) => ({
        ...f,
        latitude: Number(f.latitude),
        longitude: Number(f.longitude),
      }));
      setFacilities(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load store locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  /* ── Derive city list from facility data ── */
  const cities = useMemo(() => {
    const names = Array.from(new Set(facilities.map((f) => f.city?.name).filter(Boolean))) as string[];
    return names.sort();
  }, [facilities]);

  // Auto-select the first city once data loads
  useEffect(() => {
    if (cities.length > 0 && !activeCity) {
      setActiveCity(cities[0]);
    }
  }, [cities, activeCity]);

  /* ── Filter facilities for the active city ── */
  const activeFacilities = useMemo(() => {
    if (!activeCity) return facilities.filter((f) => f.isActive);
    return facilities.filter((f) => f.isActive && f.city?.name === activeCity);
  }, [facilities, activeCity]);

  /* ── Build the iframe embed URL based on selection state ── */
  const embedUrl = useMemo(() => {
    if (selectedStoreId) {
      const facility = activeFacilities.find((f) => f.id === selectedStoreId);
      if (facility) {
        return buildEmbedUrl(`${facility.latitude},${facility.longitude}`, 16);
      }
    }
    
    // Default city view: show all active facilities of this city in a multi-coordinate search query
    if (activeFacilities.length > 0) {
      const coordsQuery = activeFacilities
        .map((f) => `${f.latitude},${f.longitude}`)
        .join('&q=');
      return buildEmbedUrl(coordsQuery, 13);
    }

    // Fallback to active city text search if no active facilities exist
    return buildEmbedUrl(activeCity ?? 'Patna', 13);
  }, [selectedStoreId, activeFacilities, activeCity]);

  /* ── Handlers ── */
  const handleHover = (id: number | null) => setActiveStoreId(id);

  const handleSelectStore = (id: number) => {
    setSelectedStoreId((prev) => (prev === id ? null : id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectStore(id);
    }
  };

  // Reset map loaded state when embed URL changes
  useEffect(() => { setMapLoaded(false); }, [embedUrl]);

  // Clear selected store when changing cities
  const handleCityChange = (city: string) => {
    setActiveCity(city);
    setSelectedStoreId(null);
    setActiveStoreId(null);
  };

  return (
    <section id="store-locations" className="relative isolate overflow-hidden bg-[#07111C] py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-[#07111C] via-[#0C1A2F] to-[#07111C]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section heading ── */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="kicker-chip border border-white/10 bg-white/5 text-[#4EAEE5]">
            Our Locations
          </span>
          <h2
            className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Find a Store Near You
          </h2>
          <p className="mt-5 text-base leading-8 text-white/80">
            Explore our active facilities across cities. Hover to highlight or click to zoom in on a location.
          </p>
        </div>

        {/* ── City toggle ── */}
        {cities.length > 1 && (
          <div className="mt-10 flex justify-center gap-2 flex-wrap">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 border cursor-pointer ${
                  activeCity === city
                    ? 'bg-[#4EAEE5] text-[#07111C] border-[#4EAEE5] shadow-brand'
                    : 'border-white/20 text-white/70 hover:border-[#4EAEE5]/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* ── Content area ── */}
        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          {/* LEFT – Facility cards (40%) */}
          <div className="lg:col-span-2 space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={fetchFacilities} className="mt-3 text-sm font-semibold text-[#4EAEE5] hover:underline cursor-pointer">
                  Try again
                </button>
              </div>
            ) : activeFacilities.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur">
                <Building2 className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-4 text-sm font-semibold text-white/60">
                  Coming soon to {activeCity ?? 'this area'} — stay tuned!
                </p>
              </div>
            ) : (
              activeFacilities.map((facility) => {
                const isSelected = selectedStoreId === facility.id;
                const isHovered = activeStoreId === facility.id;
                const isActive = isSelected || isHovered;
                
                return (
                  <div
                    key={facility.id}
                    onMouseEnter={() => handleHover(facility.id)}
                    onMouseLeave={() => handleHover(null)}
                    onFocus={() => handleHover(facility.id)}
                    onBlur={() => handleHover(null)}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectStore(facility.id)}
                    onKeyDown={(e) => handleKeyDown(e, facility.id)}
                    aria-label={`${facility.name} — ${facility.address}`}
                    className={`group rounded-xl border p-4 transition-all duration-300 cursor-pointer outline-none ${
                      isActive
                        ? 'border-[#4EAEE5]/70 bg-[#4EAEE5]/[0.08] shadow-brand -translate-y-0.5'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Name */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-[#4EAEE5] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                        {facility.name}
                      </h3>
                      <span className="flex-shrink-0 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-wider">
                        Active
                      </span>
                    </div>

                    {/* Address */}
                    <div className="mt-2 flex items-start gap-2 text-xs text-white/60">
                      <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-[#4EAEE5]/70" />
                      <span className="leading-relaxed">{facility.address}</span>
                    </div>

                    {/* Phone */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
                      <Phone className="h-3 w-3 flex-shrink-0 text-[#4EAEE5]/70" />
                      <span>{facility.contactNumber}</span>
                    </div>

                    {/* GPS Radius */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
                      <Navigation className="h-3 w-3 flex-shrink-0 text-[#4EAEE5]/70" />
                      <span>GPS Serviceable — 5km Radius</span>
                    </div>

                    {/* Operating Hours */}
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-white/60">
                      <Clock className="h-3 w-3 flex-shrink-0 text-[#4EAEE5]/70" />
                      <span>Mon–Sat · 9:00 AM – 8:00 PM</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT – Google Maps Embed (60%) */}
          <div className="lg:col-span-3 relative min-h-[280px] md:min-h-[400px] rounded-2xl border border-white/10 overflow-hidden shadow-brand-lg">
            {/* Google Maps iframe */}
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              title={`Map showing ${activeCity ?? 'store'} locations`}
              onLoad={() => setMapLoaded(true)}
            />

            {/* Floating Back to City View button */}
            {selectedStoreId && (
              <button
                onClick={() => setSelectedStoreId(null)}
                className="absolute top-4 left-4 z-40 flex items-center gap-2 rounded-lg bg-[#0C1A2F]/90 px-3 py-1.5 text-xs font-bold text-white border border-[#4EAEE5]/30 hover:border-[#4EAEE5]/60 hover:bg-[#0C1A2F] transition-all cursor-pointer shadow-lively"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#4EAEE5]" />
                Back to City View
              </button>
            )}

            {/* Loading spinner overlay while iframe loads */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#0C1A2F]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-[#4EAEE5] animate-spin" />
                  <p className="text-xs text-white/40 font-medium">Loading map…</p>
                </div>
              </div>
            )}

            {/* "No stores" overlay */}
            {!loading && activeFacilities.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#0C1A2F]/80">
                <p className="text-sm text-white/30 font-semibold">No facilities in this region yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
