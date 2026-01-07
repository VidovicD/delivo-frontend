import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAddress } from "../../contexts/AddressContext";
import { formatAddressDisplay } from "../../utils/addressValidation";

import "./ExplorePage.css";

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
  const {
    activeAddress,
  } = useAddress();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lat = activeAddress?.lat;
    const lng = activeAddress?.lng;

    if (lat == null || lng == null) {
      setRestaurants([]);
      setLoading(false);
      return;
    }

    const loadRestaurants = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, address, lat, lng");

      if (error) {
        setRestaurants([]);
        setLoading(false);
        return;
      }

      setRestaurants(
        (data || []).map((r) => ({
          ...r,
          distanceKm:
            r.lat != null && r.lng != null
              ? getDistanceKm(lat, lng, r.lat, r.lng)
              : null,
        }))
      );

      setLoading(false);
    };

    loadRestaurants();
  }, [activeAddress]);

  return (
    <div className="explore">
      

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
                <span>{formatAddressDisplay(r.address)}</span>
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
