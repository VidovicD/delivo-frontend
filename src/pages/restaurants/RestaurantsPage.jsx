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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);

      let qb = supabase
        .from("restaurants")
        .select("id, name, address, phone, delivery_zone");

      if (address) {
        qb = qb.ilike("delivery_zone", `%${address}%`);
      }

      const { data, error } = await qb;

      if (error) {
        setError("Greška pri učitavanju restorana.");
        setRestaurants([]);
      } else {
        setRestaurants(data || []);
      }

      setLoading(false);
    };

    fetchRestaurants();
  }, [address]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const handleRestaurantClick = async (restaurantId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        navigate(
        `/?login=1&returnTo=/restaurant/${restaurantId}`,
        { replace: true }
      );
      return;
    }

    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="restaurants">
      <div className="restaurants__header">
        <h1 className="restaurants__title">Restorani za adresu</h1>
        {address && <p className="restaurants__address">{address}</p>}

        {session && (
          <button
            type="button"
            className="restaurants__logout"
            onClick={handleLogout}
          >
            Odjavi se
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
              className="restaurant-card"
              onClick={() => handleRestaurantClick(r.id)}
            >
              <div className="restaurant-card__name">{r.name}</div>

              <div className="restaurant-card__meta">
                <span>{r.address}</span>
                {r.phone && <span>{r.phone}</span>}
              </div>

              <span className="restaurant-card__badge">
                Besplatna dostava
              </span>
            </div>
          ))}

          {restaurants.length === 0 && (
            <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
              Trenutno nema dostupnih restorana.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default RestaurantsPage;
