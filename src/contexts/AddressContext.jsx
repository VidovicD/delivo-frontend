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
  updateAddress,
  updateUserAddress,
} from "../utils/deliveryAddress";
import { isPointInDeliveryZone, toLatin } from "../utils/addressValidation";

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
    async ({
      address,
      lat,
      lng,
      address_type,
      house_number,
      entrance_number,
      apartment_number,
      floor,
      entry_code,
    }) => {
      if (!address || lat == null || lng == null) return;
      if (!isPointInDeliveryZone({ lat, lng })) return;
      const normalizedAddress = toLatin(address);

      if (session?.user?.id) {
        await saveUserAddress(supabase, session.user.id, {
          address: normalizedAddress,
          lat,
          lng,
          address_type,
          house_number,
          entrance_number,
          apartment_number,
          floor,
          entry_code,
        });

        await touchUserAddress(
          supabase,
          session.user.id,
          normalizedAddress
        );

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        setSavedAddresses(Array.isArray(list) ? list : []);
        return;
      }

      const updated = saveAddress({
        address: normalizedAddress,
        lat,
        lng,
        address_type,
        house_number,
        entrance_number,
        apartment_number,
        floor,
        entry_code,
      });
      setSavedAddresses([...updated]);
      setCurrentAddress(updated[0].id);
    },
    [session]
  );

  const updateAddressById = useCallback(
    async ({
      id,
      address,
      lat,
      lng,
      address_type,
      house_number,
      entrance_number,
      apartment_number,
      floor,
      entry_code,
    }) => {
      if (!id || !address || lat == null || lng == null) return;
      if (!isPointInDeliveryZone({ lat, lng })) return;
      const normalizedAddress = toLatin(address);

      if (session?.user?.id) {
        await updateUserAddress(supabase, session.user.id, id, {
          address: normalizedAddress,
          lat,
          lng,
          address_type,
          house_number,
          entrance_number,
          apartment_number,
          floor,
          entry_code,
        });

        const list = await withTimeout(
          loadUserAddresses(supabase, session.user.id),
          5000
        );

        setSavedAddresses(Array.isArray(list) ? list : []);
        return;
      }

      const updated = updateAddress(id, {
        address: normalizedAddress,
        lat,
        lng,
        address_type,
        house_number,
        entrance_number,
        apartment_number,
        floor,
        entry_code,
      });
      setSavedAddresses([...updated]);
      setCurrentAddress(id);
    },
    [session]
  );

  const deleteAddressById = useCallback(
    async (id) => {
      if (!id) return;
      if (savedAddresses.length <= 1) return;

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
    [session, savedAddresses]
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
      updateAddressById,
      deleteAddressById,
    }),
    [
      ready,
      addressesReady,
      savedAddresses,
      activeAddress,
      setActiveById,
      addAddressFromPlace,
      updateAddressById,
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
