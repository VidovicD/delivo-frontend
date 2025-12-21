const MAX_ADDRESSES = 3;
const GUEST_KEY = "guest_saved_addresses_v1";

/* -----------------------------
   INTERNAL HELPERS
----------------------------- */

function setActive(address) {
  if (!address) {
    localStorage.removeItem("delivery_address");
    localStorage.removeItem("delivery_lat");
    localStorage.removeItem("delivery_lng");
    localStorage.removeItem("current_delivery_id");
    return;
  }

  localStorage.setItem("delivery_address", address.address);
  localStorage.setItem("delivery_lat", String(address.lat));
  localStorage.setItem("delivery_lng", String(address.lng));
  localStorage.setItem("current_delivery_id", address.id);
}

function normalizeGuestAddresses(list) {
  if (!list.length) {
    setActive(null);
    return list;
  }

  const currentId = localStorage.getItem("current_delivery_id");
  const current = list.find((a) => a.id === currentId);

  setActive(current || list[0]);
  return list;
}

/* -----------------------------
   GUEST (localStorage)
----------------------------- */

export function getSavedAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveAddress({ address, lat, lng }) {
  const list = getSavedAddresses();

  const existing = list.find(
    (a) => a.address === address && a.lat === lat && a.lng === lng
  );

  if (!existing && list.length >= MAX_ADDRESSES) {
    return normalizeGuestAddresses(list);
  }

  const id = existing?.id || crypto.randomUUID();

  const created = {
    id,
    label: existing?.label || "Adresa",
    address,
    lat,
    lng,
    lastUsed: Date.now(),
  };

  const updated = [
    created,
    ...list.filter((a) => a.id !== id),
  ];

  localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
  normalizeGuestAddresses(updated);

  return updated;
}

export function setCurrentAddress(id) {
  const list = getSavedAddresses();
  const selected = list.find((a) => a.id === id);
  if (!selected) return;
  setActive(selected);
}

export function deleteAddress(id) {
  const updated = getSavedAddresses().filter((a) => a.id !== id);
  localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
  normalizeGuestAddresses(updated);
  return updated;
}

export function clearGuestAddresses() {
  localStorage.removeItem(GUEST_KEY);
  localStorage.removeItem("current_delivery_id");
  localStorage.removeItem("delivery_address");
  localStorage.removeItem("delivery_lat");
  localStorage.removeItem("delivery_lng");
}

/* -----------------------------
   SHARED LOGIC
----------------------------- */

export function getActiveAddress(session, addresses) {
  if (!Array.isArray(addresses) || !addresses.length) return null;

  // USER → poslednje korišćena (po lastUsed)
  if (session?.user) {
    return (
      addresses
        .slice()
        .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))[0] || null
    );
  }

  // GUEST → localStorage
  const currentId = localStorage.getItem("current_delivery_id");
  return (
    addresses.find((a) => a.id === currentId) ||
    addresses[0] ||
    null
  );
}

/* -----------------------------
   USER (Supabase)
----------------------------- */

export async function syncGuestAddressesToUser(supabase, userId) {
  const guest = getSavedAddresses();
  if (!guest.length) return;

  const payload = guest.map((a) => ({
    user_id: userId,
    label: a.label,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    last_used: new Date(a.lastUsed || Date.now()),
  }));

  const { error } = await supabase
    .from("user_addresses")
    .insert(payload);

  if (!error) {
    clearGuestAddresses();
  }
}

export async function loadUserAddresses(supabase, userId) {
  const { data, error } = await supabase
    .from("user_addresses")
    .select("id, label, address, lat, lng, last_used")
    .eq("user_id", userId)
    .order("last_used", { ascending: false });

  if (error || !data?.length) return [];

  return data.map((a) => ({
    id: a.id,
    label: a.label,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    lastUsed: new Date(a.last_used).getTime(),
  }));
}

export async function touchUserAddress(supabase, userId, address) {
  await supabase
    .from("user_addresses")
    .update({ last_used: new Date() })
    .eq("user_id", userId)
    .eq("address", address);
}

export async function saveUserAddress(
  supabase,
  userId,
  { address, lat, lng }
) {
  await supabase
    .from("user_addresses")
    .upsert(
      {
        user_id: userId,
        label: "Adresa",
        address,
        lat,
        lng,
        last_used: new Date(),
      },
      { onConflict: "user_id,address" }
    );
}
