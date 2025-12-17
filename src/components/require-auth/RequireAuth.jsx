import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

function RequireAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;

      if (!data.session) {
        navigate(
          `/?login=1&returnTo=${encodeURIComponent(
            location.pathname + location.search
          )}`,
          { replace: true }
        );
      } else {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, location.pathname, location.search]);

  if (!ready) return null;

  return children;
}

export default RequireAuth;
