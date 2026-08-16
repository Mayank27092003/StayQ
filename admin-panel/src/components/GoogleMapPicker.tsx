"use client";

import React, { useEffect, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDcAw5j9JR1kWYLosJMwi8dqMPLF0x3OBc";

interface GoogleMapPickerProps {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  onLocationChange: (loc: {
    lat: number;
    lng: number;
    city?: string;
    locality?: string;
    state?: string;
    country?: string;
    pincode?: string;
    formattedAddress?: string;
  }) => void;
}

const CITY_PRESETS: Record<string, { lat: number; lng: number; state: string; country: string }> = {
  Goa: { lat: 15.5182, lng: 73.7634, state: "Goa", country: "India" },
  Manali: { lat: 32.2432, lng: 77.1892, state: "Himachal Pradesh", country: "India" },
  Mumbai: { lat: 19.076, lng: 72.8777, state: "Maharashtra", country: "India" },
  Bengaluru: { lat: 12.9716, lng: 77.5946, state: "Karnataka", country: "India" },
  "New Delhi": { lat: 28.6139, lng: 77.209, state: "Delhi", country: "India" },
  Udaipur: { lat: 24.5854, lng: 73.7125, state: "Rajasthan", country: "India" },
  Rishikesh: { lat: 30.0869, lng: 78.2676, state: "Uttarakhand", country: "India" },
  Dubai: { lat: 25.2048, lng: 55.2708, state: "Dubai", country: "United Arab Emirates" },
  Bali: { lat: -8.4095, lng: 115.1889, state: "Bali", country: "Indonesia" },
};

declare global {
  interface Window {
    google: any;
    initStayQGoogleMap?: () => void;
  }
}

export default function GoogleMapPicker({
  lat,
  lng,
  city,
  state,
  country,
  pincode,
  onLocationChange,
}: GoogleMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [currentAddressSnippet, setCurrentAddressSnippet] = useState<string>("");

  // Load Google Maps script once
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById("stayq-gmaps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "stayq-gmaps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      script.onerror = () => {
        console.warn("Failed to load Google Maps script, falling back to manual coordinate inputs.");
        setLoadError(true);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setMapLoaded(true));
      existingScript.addEventListener("error", () => setLoadError(true));
    }
  }, []);

  // Reverse Geocode helper to extract City, Locality, State, Country, Pincode
  const reverseGeocode = (newLat: number, newLng: number) => {
    if (!window.google?.maps?.Geocoder) return;
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }

    geocoderRef.current.geocode(
      { location: { lat: newLat, lng: newLng } },
      (results: any[], status: string) => {
        if (status === "OK" && results && results[0]) {
          const result = results[0];
          setCurrentAddressSnippet(result.formatted_address || "");

          let detectedLocality = "";
          let detectedCity = "";
          let detectedState = "";
          let detectedCountry = "";
          let detectedPincode = "";

          result.address_components?.forEach((comp: any) => {
            const types = comp.types || [];
            if (types.includes("sublocality") || types.includes("sublocality_level_1") || types.includes("neighborhood")) {
              detectedLocality = comp.long_name;
            }
            if (types.includes("locality")) {
              detectedCity = comp.long_name;
            } else if (!detectedCity && types.includes("administrative_area_level_2")) {
              detectedCity = comp.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              detectedState = comp.long_name;
            }
            if (types.includes("country")) {
              detectedCountry = comp.long_name;
            }
            if (types.includes("postal_code")) {
              detectedPincode = comp.long_name;
            }
          });

          onLocationChange({
            lat: newLat,
            lng: newLng,
            city: detectedCity,
            locality: detectedLocality,
            state: detectedState,
            country: detectedCountry,
            pincode: detectedPincode,
            formattedAddress: result.formatted_address,
          });
        } else {
          onLocationChange({ lat: newLat, lng: newLng });
        }
      }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || !window.google?.maps) return;

    const initialPos = {
      lat: Number(lat) || 15.5182,
      lng: Number(lng) || 73.7634,
    };

    // Create Map
    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: initialPos,
      zoom: 14,
      mapTypeId: mapType,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
    });
    mapInstanceRef.current = map;

    // Create Draggable Marker
    const marker = new window.google.maps.Marker({
      position: initialPos,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: "Property Location (Drag to adjust)",
    });
    markerInstanceRef.current = marker;

    // Marker Drag End Listener
    marker.addListener("dragend", (e: any) => {
      const newLat = Number(e.latLng.lat().toFixed(6));
      const newLng = Number(e.latLng.lng().toFixed(6));
      reverseGeocode(newLat, newLng);
    });

    // Map Click Listener (move marker on click)
    map.addListener("click", (e: any) => {
      const newLat = Number(e.latLng.lat().toFixed(6));
      const newLng = Number(e.latLng.lng().toFixed(6));
      marker.setPosition({ lat: newLat, lng: newLng });
      reverseGeocode(newLat, newLng);
    });

    // Setup Places Search Autocomplete
    if (searchInputRef.current && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "name", "formatted_address", "address_components"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const newLat = Number(place.geometry.location.lat().toFixed(6));
        const newLng = Number(place.geometry.location.lng().toFixed(6));

        map.setCenter({ lat: newLat, lng: newLng });
        map.setZoom(16);
        marker.setPosition({ lat: newLat, lng: newLng });

        let detectedLocality = "";
        let detectedCity = "";
        let detectedState = "";
        let detectedCountry = "";
        let detectedPincode = "";

        place.address_components?.forEach((comp: any) => {
          const types = comp.types || [];
          if (types.includes("sublocality") || types.includes("neighborhood")) {
            detectedLocality = comp.long_name;
          }
          if (types.includes("locality")) {
            detectedCity = comp.long_name;
          } else if (!detectedCity && types.includes("administrative_area_level_2")) {
            detectedCity = comp.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            detectedState = comp.long_name;
          }
          if (types.includes("country")) {
            detectedCountry = comp.long_name;
          }
          if (types.includes("postal_code")) {
            detectedPincode = comp.long_name;
          }
        });

        setCurrentAddressSnippet(place.formatted_address || place.name || "");
        onLocationChange({
          lat: newLat,
          lng: newLng,
          city: detectedCity,
          locality: detectedLocality,
          state: detectedState,
          country: detectedCountry,
          pincode: detectedPincode,
          formattedAddress: place.formatted_address,
        });
      });
    }
  }, [mapLoaded]);

  // Keep marker position synced if external lat/lng changes
  useEffect(() => {
    if (markerInstanceRef.current && mapInstanceRef.current && lat && lng) {
      const curPos = markerInstanceRef.current.getPosition();
      if (!curPos || Math.abs(curPos.lat() - lat) > 0.0001 || Math.abs(curPos.lng() - lng) > 0.0001) {
        const newPos = { lat: Number(lat), lng: Number(lng) };
        markerInstanceRef.current.setPosition(newPos);
        mapInstanceRef.current.panTo(newPos);
      }
    }
  }, [lat, lng]);

  const handleToggleMapType = () => {
    const nextType = mapType === "roadmap" ? "hybrid" : "roadmap";
    setMapType(nextType);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(nextType);
    }
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat: newLat, lng: newLng });
          mapInstanceRef.current.setZoom(16);
          markerInstanceRef.current.setPosition({ lat: newLat, lng: newLng });
        }
        reverseGeocode(newLat, newLng);
      },
      (err) => {
        setIsDetectingGps(false);
        alert(`Could not fetch GPS location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePresetCity = (cityName: string) => {
    const preset = CITY_PRESETS[cityName];
    if (preset) {
      if (mapInstanceRef.current && markerInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: preset.lat, lng: preset.lng });
        mapInstanceRef.current.setZoom(14);
        markerInstanceRef.current.setPosition({ lat: preset.lat, lng: preset.lng });
      }
      onLocationChange({
        lat: preset.lat,
        lng: preset.lng,
        city: cityName,
        state: preset.state,
        country: preset.country,
      });
    }
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      {/* Top Header & Search Bar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "22px" }}>
            location_on
          </span>
          <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>Google Maps Interactive Pinning</strong>
          <span style={{ fontSize: "0.72rem", background: "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: "6px", color: "#64748b", fontWeight: 700 }}>
            Live API
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            type="button"
            onClick={handleToggleMapType}
            style={{
              padding: "0.35rem 0.65rem",
              borderRadius: "8px",
              background: mapType === "hybrid" ? "#0f172a" : "#f1f5f9",
              color: mapType === "hybrid" ? "#ffffff" : "#334155",
              fontSize: "0.75rem",
              fontWeight: 700,
              border: "1px solid #cbd5e1",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>layers</span>
            {mapType === "hybrid" ? "Satellite" : "Map View"}
          </button>

          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isDetectingGps}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#0f172a",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#0284c7" }}>
              my_location
            </span>
            {isDetectingGps ? "Detecting GPS..." : "Auto-detect GPS"}
          </button>

          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "8px",
              background: "rgba(157, 0, 255, 0.08)",
              color: "#9D00FF",
              fontSize: "0.75rem",
              fontWeight: 700,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>open_in_new</span>
            Open in Google Maps
          </a>
        </div>
      </div>

      {/* Places Autocomplete Search Box */}
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b", display: "flex", alignItems: "center", pointerEvents: "none" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>search</span>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search place, hotel, landmark, city (e.g. Candolim Beach, Baga, Taj Palace)..."
          style={{
            width: "100%",
            padding: "0.6rem 0.75rem 0.6rem 2.2rem",
            fontSize: "0.85rem",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            outline: "none",
            background: "#f8fafc",
          }}
        />
      </div>

      {/* Embedded Google Map Canvas */}
      <div style={{ position: "relative", width: "100%", height: "260px", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {!mapLoaded && !loadError && (
          <div style={{ position: "absolute", inset: 0, background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#64748b" }}>
            <div style={{ width: "24px", height: "24px", border: "3px solid #cbd5e1", borderTopColor: "#9D00FF", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Loading Google Maps...</span>
          </div>
        )}

        {loadError && (
          <div style={{ position: "absolute", inset: 0, background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "#ef4444", fontSize: "32px" }}>map</span>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.25rem 0" }}>
              Google Maps API loaded offline. You can manually adjust coordinates below or click presets.
            </p>
          </div>
        )}
      </div>

      {/* Pin Location Status Banner */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.78rem", color: "#475569", background: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#10b981" }}>touch_app</span>
          <span>Click anywhere on map or drag red marker to reposition pin.</span>
        </div>
        {currentAddressSnippet && (
          <div style={{ fontWeight: 600, color: "#0f172a", maxWidth: "420px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📍 {currentAddressSnippet}
          </div>
        )}
      </div>

      {/* Manual Coordinates & City Presets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "0.75rem", alignItems: "center" }}>
        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.2rem" }}>
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => onLocationChange({ lat: Number(e.target.value), lng })}
            style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.2rem" }}>
            Longitude
          </label>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => onLocationChange({ lat, lng: Number(e.target.value) })}
            style={{ width: "100%", padding: "0.45rem 0.65rem", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontFamily: "monospace" }}
          />
        </div>

        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "0.2rem" }}>
            Quick City Presets
          </label>
          <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
            {Object.keys(CITY_PRESETS).map((cName) => (
              <button
                key={cName}
                type="button"
                onClick={() => handlePresetCity(cName)}
                style={{
                  padding: "0.2rem 0.45rem",
                  borderRadius: "6px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                {cName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
