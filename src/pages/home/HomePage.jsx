import { Navigate } from "react-router-dom";
import HeroSection from "./HeroSection";
import { getSavedAddresses } from "../../utils/deliveryAddress";

function HomePage() {
  const savedAddresses = getSavedAddresses();
  const hasAddress = savedAddresses.length > 0;

  if (hasAddress) {
    return <Navigate to="/restaurants" replace />;
  }

  return <HeroSection />;
}

export default HomePage;
