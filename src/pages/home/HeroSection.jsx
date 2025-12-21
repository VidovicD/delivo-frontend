import { useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { useAddress } from "../../contexts/AddressContext";

import "./HeroSection.css";

import logo from "../../assets/logobt.png";
import paket from "../../assets/paket.png";
import hrana from "../../assets/hrana.png";
import kamion from "../../assets/kamion.png";
import pin from "../../assets/pin.png";

import FloatingIcons from "../../components/floating-icons/FloatingIcons";

function HeroSection() {
  const navigate = useNavigate();
  const { addAddressFromPlace } = useAddress();
  const autocompleteRef = useRef(null);

  const onPlaceChanged = async () => {
    const place = autocompleteRef.current?.getPlace();
    const address = place?.formatted_address;
    const location = place?.geometry?.location;

    if (!address || !location) return;

    await addAddressFromPlace({
      address,
      lat: location.lat(),
      lng: location.lng(),
    });

    navigate("/explore");
  };

  return (
    <section className="home">
      <section className="hero">
        <div className="hero__background">
          <FloatingIcons icons={[paket, hrana, kamion]} />
        </div>

        <div className="hero__content">
          <img src={logo} alt="Delivo logo" className="hero__logo" />

          <div className="hero__tagline">
            <h1>Sve na jednom mestu.</h1>
            <p>Dostava svega što vam je potrebno.</p>
          </div>

          <div className="hero__search">
            <img src={pin} alt="" className="hero__search-pin" />

            <Autocomplete
              onLoad={(a) => (autocompleteRef.current = a)}
              onPlaceChanged={onPlaceChanged}
              options={{
                types: ["address"],
                componentRestrictions: { country: "rs" },
              }}
            >
              <input
                className="hero__search-input"
                placeholder="Unesite adresu isporuke..."
                autoFocus
              />
            </Autocomplete>
          </div>
          <p className="hero__availability">
            Trenutno dostupno u Novom Sadu.
          </p>
        </div>
      </section>
    </section>
  );
}

export default HeroSection;
