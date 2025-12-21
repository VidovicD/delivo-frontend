import Header from "../header/Header";
import Footer from "../footer/Footer";
import { useAddress } from "../../contexts/AddressContext";

function AppLayout({
  children,
  session,
  authReady,
  onAuthOpen,
  layoutBlocked = false,
}) {
  const { addressesReady } = useAddress();

  if (!authReady || !addressesReady) return null;

  if (layoutBlocked) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Header
        session={session}
        authReady={authReady}
        onAuthOpen={onAuthOpen}
      />

      <main className="app-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}

export default AppLayout;
