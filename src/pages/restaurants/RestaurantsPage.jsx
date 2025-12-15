import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./RestaurantsPage.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function RestaurantsPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const address = query.get("address");
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    if (!address) return;

    setRestaurants([
      { id: 1, name: "Restoran Napoli", eta: "30–45 min", rating: 4.6 },
      { id: 2, name: "Burger House", eta: "25–40 min", rating: 4.4 },
      { id: 3, name: "Asian Wok", eta: "35–50 min", rating: 4.7 },
    ]);
  }, [address]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="restaurants">
      <div className="restaurants__header">
        <h1 className="restaurants__title">Restorani za adresu</h1>
        <p className="restaurants__address">{address}</p>

        {/* ⛔ ODJAVI SE */}
        <button
          type="button"
          className="restaurants__logout"
          onClick={handleLogout}
        >
          Odjavi se
        </button>
      </div>

      <div className="restaurants__grid">
        {restaurants.map((r) => (
          <div key={r.id} className="restaurant-card">
            <div className="restaurant-card__name">{r.name}</div>
            <div className="restaurant-card__meta">
              <span>{r.eta}</span>
              <span>★ {r.rating}</span>
            </div>
            <span className="restaurant-card__badge">
              Besplatna dostava
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RestaurantsPage;
