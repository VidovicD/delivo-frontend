import { useSearchParams, useNavigate } from "react-router-dom";
import "./RestaurantsPage.css";

function RestaurantsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const address = params.get("address");

  if (!address) {
    return (
      <div className="restaurants__empty">
        <p>Nema izabrane adrese.</p>
        <button onClick={() => navigate("/")}>
          Vrati se na početnu
        </button>
      </div>
    );
  }

  return (
    <div className="restaurants">
      {/* STICKY HEADER */}
      <header className="restaurants__header">
        <div className="restaurants__address">
          <span>Dostava na</span>
          <strong title={address}>{address}</strong>
        </div>

        <button
          className="restaurants__change"
          onClick={() => navigate("/")}
        >
          Promeni
        </button>
      </header>

      {/* LISTA RESTORANA */}
      <main className="restaurants__list">
        <div className="restaurant-card">
          <div className="restaurant-card__img" />
          <div className="restaurant-card__info">
            <h3>Ćevabdžinica Kod Mike</h3>
            <p>Roštilj • 30–40 min</p>
          </div>
        </div>

        <div className="restaurant-card">
          <div className="restaurant-card__img" />
          <div className="restaurant-card__info">
            <h3>Pizzeria Napoli</h3>
            <p>Pica • 25–35 min</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RestaurantsPage;
