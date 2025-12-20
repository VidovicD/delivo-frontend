import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../../supabaseClient";

import {
  getSavedAddresses,
  saveAddress,
  setCurrentAddress,
  deleteAddress,
  touchUserAddress,
} from "../../utils/deliveryAddress";

import "./RestaurantsPage.css";

const MAX_ADDRESSES = 3;

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function parseNumber(v) {
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function RestaurantsPage({ session, addressVersion }) {
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const addressParam = query.get("address");
  const latParam = parseNumber(query.get("lat"));
  const lngParam = parseNumber(query.get("lng"));

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

  const [current, setCurrent] = useState({
    address: null,
    lat: null,
    lng: null,
  });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (addressParam && latParam != null && lngParam != null) return;

    const saved = getSavedAddresses();
    if (!saved.length) return;

    const last = saved[0];

    navigate(
      `/restaurants?address=${encodeURIComponent(last.address)}&lat=${last.lat}&lng=${last.lng}`,
      { replace: true }
    );
  }, [addressParam, latParam, lngParam, navigate]);

  useEffect(() => {
    const stored = getSavedAddresses();
    setSavedAddresses(stored);
    setShowAddressInput(stored.length === 0);
    setShowPicker(false);
  }, [addressVersion, location.search]);

  useEffect(() => {
    if (
      addressParam &&
      latParam != null &&
      lngParam != null
    ) {
      setCurrent({
        address: addressParam,
        lat: latParam,
        lng: lngParam,
      });
    }
  }, [addressParam, latParam, lngParam]);

  useEffect(() => {
    if (current.lat == null || current.lng == null) return;

    const load = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("restaurants")
        .select("id, name, address, lat, lng");

      setRestaurants(
        (data || []).map((r) => ({
          ...r,
          distanceKm:
            r.lat != null && r.lng != null
              ? getDistanceKm(current.lat, current.lng, r.lat, r.lng)
              : null,
        }))
      );

      setLoading(false);
    };

    load();
  }, [current.lat, current.lng]);

  useEffect(() => {
    if (
      current.address &&
      current.lat != null &&
      current.lng != null &&
      !addressParam
    ) {
      navigate(
        `/restaurants?address=${encodeURIComponent(current.address)}&lat=${current.lat}&lng=${current.lng}`,
        { replace: true }
      );
    }
  }, [current.address, current.lat, current.lng, addressParam, navigate]);

  const debouncedSaveUserAddress = (
    address,
    lat,
    lng
  ) => {
    if (!session?.user) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from("user_addresses").upsert(
        {
          user_id: session.user.id,
          label: "Adresa",
          address,
          lat,
          lng,
          last_used: new Date(),
        },
        { onConflict: "user_id,address" }
      );
    }, 600);
  };

  const handlePlaceChanged = async () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const address = place?.formatted_address;
    const loc = place?.geometry?.location;

    if (!address || !loc) return;

    const lat = loc.lat();
    const lng = loc.lng();

    if (session?.user) {
    debouncedSaveUserAddress(address, lat, lng);

      const { data } = await supabase
        .from("user_addresses")
        .select("id, label, address, lat, lng, last_used")
        .eq("user_id", session.user.id)
        .order("last_used", { ascending: false });

      const mapped =
        data?.map((a) => ({
          id: a.id,
          label: a.label,
          address: a.address,
          lat: a.lat,
          lng: a.lng,
          lastUsed: new Date(a.last_used).getTime(),
        })) || [];

      localStorage.setItem(
        "guest_saved_addresses_v1",
        JSON.stringify(mapped)
      );

      setSavedAddresses(mapped);
    } else {
      const updated = saveAddress({ address, lat, lng });
      setSavedAddresses(updated);
    }

    setShowAddressInput(false);
    setShowPicker(false);

    setCurrent({ address, lat, lng });

    navigate(
      `/restaurants?address=${encodeURIComponent(address)}&lat=${lat}&lng=${lng}`,
      { replace: true }
    );
  };

  const handleDeleteAddress = async (a) => {
    if (session?.user) {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", a.id)
        .eq("user_id", session.user.id);

      if (error) return;
    }

    const updated = deleteAddress(a.id);
    setSavedAddresses(updated);

    if (!updated.length) {
      setCurrent({
        address: null,
        lat: null,
        lng: null,
      });
      return;
    }

    const next = updated[0];

    setCurrent({
      address: next.address,
      lat: Number(next.lat),
      lng: Number(next.lng),
    });

    navigate(
      `/restaurants?address=${encodeURIComponent(next.address)}&lat=${next.lat}&lng=${next.lng}`,
      { replace: true }
    );
  };

  return (
    <div className="restaurants">
      <div className="restaurants__header">
        <h1 className="restaurants__title">Restorani</h1>

        {savedAddresses.length > 0 && (
          <div className="address-picker">
            <button
              className="address-picker__trigger"
              type="button"
              onClick={() => setShowPicker((v) => !v)}
            >
              <span className="address-picker__label">Dostava na</span>
              <span className="address-picker__value">
                {current.address}
              </span>
              <span className="address-picker__chevron">▾</span>
            </button>

            {showPicker && (
              <div className="address-picker__menu">
                {savedAddresses.map((a) => (
                  <div key={a.id} className="address-picker__row">
                    <button
                      className="address-picker__option"
                      type="button"
                      onClick={async () => {
                        if (session?.user) {
                          await touchUserAddress(
                            supabase,
                            session.user.id,
                            a.address
                          );
                        }

                        setCurrentAddress(a.id);
                        setShowPicker(false);

                        setCurrent({
                          address: a.address,
                          lat: Number(a.lat),
                          lng: Number(a.lng),
                        });

                        navigate(
                          `/restaurants?address=${encodeURIComponent(a.address)}&lat=${a.lat}&lng=${a.lng}`,
                          { replace: true }
                        );
                      }}
                    >
                      <strong>{a.label}</strong>
                      <span>{a.address}</span>
                    </button>

                    {savedAddresses.length > 1 && (
                      <button
                        className="address-picker__delete"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(a);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {savedAddresses.length < MAX_ADDRESSES && (
                  <button
                    className="address-picker__new"
                    type="button"
                    onClick={() => {
                      setShowPicker(false);
                      setShowAddressInput(true);
                    }}
                  >
                    + Nova adresa
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {showAddressInput && isLoaded && (
          <Autocomplete
            onLoad={setAutocomplete}
            onPlaceChanged={handlePlaceChanged}
            options={{
              types: ["address"],
              componentRestrictions: { country: "rs" },
            }}
          >
            <input
              className="restaurants__address-input"
              placeholder="Unesite adresu…"
              autoFocus
            />
          </Autocomplete>
        )}
      </div>

      {loading && (
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Učitavanje restorana…
        </p>
      )}

      {!loading && (
        <div className="restaurants__grid">
          {restaurants.map((r) => (
            <div key={r.id} className="restaurant-card">
              <div className="restaurant-card__name">
                {r.name}
              </div>
              <div className="restaurant-card__meta">
                <span>{r.address}</span>
                {r.distanceKm != null && (
                  <span>{r.distanceKm.toFixed(1)} km</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RestaurantsPage;
