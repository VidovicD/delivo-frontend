import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAddress } from "../../contexts/AddressContext";

import "./ExplorePage.css";

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

function ExplorePage() {
  const [showPicker, setShowPicker] = useState(false);

  const {
    savedAddresses,
    activeAddress,
    setActiveById,
    deleteAddressById,
  } = useAddress();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ACTIVE ADDRESS:", activeAddress);

    const lat = activeAddress?.lat;
    const lng = activeAddress?.lng;

    console.log("ACTIVE LAT/LNG:", lat, lng);

    if (lat == null || lng == null) {
      console.log("NO LAT/LNG → SKIP FETCH");
      setRestaurants([]);
      setLoading(false);
      return;
    }

    const loadRestaurants = async () => {
      console.log("FETCHING RESTAURANTS…");
      setLoading(true);

      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, address, lat, lng");

      console.log("SUPABASE RESPONSE:", { data, error });

      if (error) {
        console.error("SUPABASE ERROR:", error);
        setRestaurants([]);
        setLoading(false);
        return;
      }

      const mapped =
        (data || []).map((r) => ({
          ...r,
          distanceKm:
            r.lat != null && r.lng != null
              ? getDistanceKm(lat, lng, r.lat, r.lng)
              : null,
        }));

      console.log("MAPPED RESTAURANTS:", mapped);

      setRestaurants(mapped);
      setLoading(false);
    };

    loadRestaurants();
  }, [activeAddress?.lat, activeAddress?.lng]);

  return (
    <div className="explore">
      <div className="explore__header">
        <h1 className="explore__title">Prodavnice</h1>

        {savedAddresses.length > 0 && activeAddress && (
          <div className="address-picker">
            <button
              className="address-picker__trigger"
              type="button"
              onClick={() => setShowPicker((v) => !v)}
            >
              <span
                className="address-picker__value"
                title={activeAddress.address}
              >
                {activeAddress.address}
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
                        await setActiveById(a.id);
                        setShowPicker(false);
                      }}
                    >
                      <strong>{a.label}</strong>
                      <span>{a.address}</span>
                    </button>

                    {savedAddresses.length > 1 && (
                      <button
                        className="address-picker__delete"
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await deleteAddressById(a.id);
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
                      window.dispatchEvent(
                        new CustomEvent("open-add-address")
                      );
                    }}
                  >
                    + Nova adresa
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {savedAddresses.length === 0 && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="address-picker__new"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("open-add-address"));
              }}
            >
              + Dodaj adresu
            </button>
          </div>
        )}
      </div>

      {loading && (
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Učitavanje ponude…
        </p>
      )}

      {!loading && !activeAddress && (
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Unesite adresu za prikaz ponude.
        </p>
      )}

      {!loading && activeAddress && (
        <div className="explore__grid">
          {restaurants.map((r) => (
            <div key={r.id} className="restaurant-card">
              <div className="restaurant-card__name">{r.name}</div>
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

export default ExplorePage;
