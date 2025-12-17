import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../../supabaseClient";
import "./RestaurantsPage.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

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

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function RestaurantsPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const address = query.get("address");
  const lat = Number(query.get("lat"));
  const lng = Number(query.get("lng"));

  const hasAddress =
    !!address && !Number.isNaN(lat) && !Number.isNaN(lng);

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddressInput, setShowAddressInput] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);

  const [hasSession, setHasSession] = useState(false);

  const canInteract = hasSession && hasAddress;
  const isDisabled = !canInteract;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setHasSession(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, address, lat, lng");

      if (error) {
        setError("Greška pri učitavanju restorana.");
        setRestaurants([]);
      } else {
        setRestaurants(
          (data || []).map((r) => ({
            ...r,
            distanceKm:
              r.lat != null && r.lng != null
                ? getDistanceKm(lat, lng, r.lat, r.lng)
                : null,
          }))
        );
      }

      setLoading(false);
    };

    fetchRestaurants();
  }, [lat, lng]);

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const formatted = place?.formatted_address;
    const location = place?.geometry?.location;

    if (!formatted || !location) return;

    const newLat = location.lat();
    const newLng = location.lng();

    localStorage.setItem("delivery_address", formatted);
    localStorage.setItem("delivery_lat", newLat.toString());
    localStorage.setItem("delivery_lng", newLng.toString());

    setShowAddressInput(false);

    navigate(
      `/restaurants?address=${encodeURIComponent(
        formatted
      )}&lat=${newLat}&lng=${newLng}`,
      { replace: true }
    );
  };

  return (
    <div className="restaurants">
      <div className="restaurants__header">
        <h1 className="restaurants__title">Restorani</h1>

        {showAddressInput ? (
          isLoaded && (
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
          )
        ) : hasAddress ? (
          <>
            <p className="restaurants__address">{address}</p>
            <button
              type="button"
              className="restaurants__change-address"
              onClick={() => setShowAddressInput(true)}
            >
              Promeni adresu
            </button>
          </>
        ) : (
          <button
            type="button"
            className="restaurants__change-address"
            onClick={() => setShowAddressInput(true)}
          >
            Unesite adresu
          </button>
        )}
      </div>

      {loading && (
        <p style={{ textAlign: "center", marginTop: 40 }}>
          Učitavanje restorana…
        </p>
      )}

      {error && (
        <p style={{ textAlign: "center", marginTop: 40, color: "red" }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="restaurants__grid">
          {restaurants.map((r) => (
            <div
              key={r.id}
              className={`restaurant-card ${
                isDisabled ? "restaurant-card--disabled" : ""
              }`}
              onClick={
                !isDisabled
                  ? () => navigate(`/restaurant/${r.id}`)
                  : undefined
              }
            >
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

export default RestaurantsPage;
