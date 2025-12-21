import Header from "../header/Header";
import Footer from "../footer/Footer";

function AppLayout({
  children,
  session,
  authReady,
  onAuthOpen,
}) {
  if (!authReady) return null;

  return (
    <>
      <Header
        session={session}
        authReady={authReady}
        onAuthOpen={onAuthOpen}
      />
      {children}
      <Footer />
    </>
  );
}

export default AppLayout;
