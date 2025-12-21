import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../supabaseClient";

import {
  getSavedAddresses,
  loadUserAddresses,
  setCurrentAddress,
  deleteAddress as deleteGuestAddress,
  touchUserAddress,
  getActiveAddress,
  saveAddress,
  saveUserAddress,
} from "../utils/deliveryAddress";

const AddressContext = createContext(null);

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

export function AddressProvider({
  session,
  addressVersion,
  authReady,
  children,
}) {
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [ready, setReady] = useState(false);
  const [addressesReady, setAddressesReady] = useState(false);

  const requestSeq = useRef(0);

  const activeAddress = useMemo(
    () => getActiveAddress(session, savedAddresses),
    [session, savedAddresses]
  );

  const refresh = useCallback(async () => {
    const seq = ++requestSeq.current;

    if (seq === requestSeq.current) {
      setReady(false);
      setAddressesReady(false);
    }

    try {
      if (!authReady) {
        if (seq === requestSeq.current) {
          setSavedAddresses([]);
        }
        return;
      }

      if (session?.user?.id) {
        await new Promise((r) => setTimeout(r, 0));

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        if (seq === requestSeq.current) {
          setSavedAddresses(Array.isArray(list) ? list : []);
        }
      } else {
        const list = getSavedAddresses();

        if (seq === requestSeq.current) {
          setSavedAddresses(Array.isArray(list) ? list : []);
        }
      }
    } catch {
      if (seq === requestSeq.current) {
        setSavedAddresses([]);
      }
    } finally {
      if (seq === requestSeq.current) {
        setReady(true);
        setAddressesReady(true);
      }
    }
  }, [authReady, session]);

  useEffect(() => {
    refresh();
  }, [authReady, session, addressVersion, refresh]);

  const setActiveById = useCallback(
    async (id) => {
      if (!id) return;

      if (session?.user?.id) {
        const found = savedAddresses.find((a) => a.id === id);
        if (!found) return;

        await touchUserAddress(supabase, session.user.id, found.address);

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        setSavedAddresses(Array.isArray(list) ? list : []);
        return;
      }

      setCurrentAddress(id);
      setSavedAddresses(getSavedAddresses());
    },
    [session, savedAddresses]
  );

  const addAddressFromPlace = useCallback(
    async ({ address, lat, lng }) => {
      if (!address || lat == null || lng == null) return;

      if (session?.user?.id) {
        await saveUserAddress(supabase, session.user.id, {
          address,
          lat,
          lng,
        });

        await touchUserAddress(supabase, session.user.id, address);

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        setSavedAddresses(Array.isArray(list) ? list : []);
        return;
      }

      const updated = saveAddress({ address, lat, lng });
      setSavedAddresses([...updated]);
      setCurrentAddress(updated[0].id);
    },
    [session]
  );

  const deleteAddressById = useCallback(
    async (id) => {
      if (!id) return;

      if (session?.user?.id) {
        await supabase
          .from("user_addresses")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        setSavedAddresses(Array.isArray(list) ? list : []);
        return;
      }

      deleteGuestAddress(id);
      setSavedAddresses(getSavedAddresses());
    },
    [session]
  );

  const value = useMemo(
    () => ({
      ready,
      addressesReady,
      savedAddresses,
      activeAddress,
      hasAddress: !!activeAddress,
      setActiveById,
      addAddressFromPlace,
      deleteAddressById,
    }),
    [
      ready,
      addressesReady,
      savedAddresses,
      activeAddress,
      setActiveById,
      addAddressFromPlace,
      deleteAddressById,
    ]
  );

  return (
    <AddressContext.Provider value={value}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) {
    throw new Error("useAddress must be used within AddressProvider");
  }
  return ctx;
}
