const MAX_ADDRESSES = 3;
const GUEST_KEY = "guest_saved_addresses_v1";

export function getSavedAddresses() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY)) || [];
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
    return list;
  }

  const id = existing?.id || crypto.randomUUID();

  const updated = [
    {
      id,
      label: existing?.label || "Adresa",
      address,
      lat,
      lng,
      lastUsed: Date.now(),
    },
    ...list.filter((a) => a.id !== id),
  ];

  localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
  localStorage.setItem("delivery_address", address);
  localStorage.setItem("delivery_lat", lat.toString());
  localStorage.setItem("delivery_lng", lng.toString());
  localStorage.setItem("current_delivery_id", id);

  return updated;
}

export function setCurrentAddress(id) {
  const list = getSavedAddresses();
  const selected = list.find((a) => a.id === id);
  if (!selected) return;

  localStorage.setItem("delivery_address", selected.address);
  localStorage.setItem("delivery_lat", selected.lat.toString());
  localStorage.setItem("delivery_lng", selected.lng.toString());
  localStorage.setItem("current_delivery_id", selected.id);
}

export function deleteAddress(id) {
  const list = getSavedAddresses();
  if (list.length <= 1) return list;

  const updated = list.filter((a) => a.id !== id);
  localStorage.setItem(GUEST_KEY, JSON.stringify(updated));

  const currentId = localStorage.getItem("current_delivery_id");

  if (currentId === id) {
    const next = updated[0];
    localStorage.setItem("delivery_address", next.address);
    localStorage.setItem("delivery_lat", next.lat.toString());
    localStorage.setItem("delivery_lng", next.lng.toString());
    localStorage.setItem("current_delivery_id", next.id);
  }

  return updated;
}

export async function syncGuestAddressesToUser(supabase, userId) {
  const guest = getSavedAddresses();
  if (!guest.length) return;

  const { data } = await supabase
    .from("user_addresses")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  if (data && data.length > 0) {
    clearGuestAddresses();
    return;
  }

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

export function clearGuestAddresses() {
  localStorage.removeItem(GUEST_KEY);
  localStorage.removeItem("delivery_address");
  localStorage.removeItem("delivery_lat");
  localStorage.removeItem("delivery_lng");
  localStorage.removeItem("current_delivery_id");
}

export async function loadUserAddresses(supabase, userId) {
  const { data, error } = await supabase
    .from("user_addresses")
    .select("id, label, address, lat, lng, last_used")
    .eq("user_id", userId)
    .order("last_used", { ascending: false });

  if (error || !data?.length) return [];

  const mapped = data.map((a) => ({
    id: a.id,
    label: a.label,
    address: a.address,
    lat: a.lat,
    lng: a.lng,
    lastUsed: new Date(a.last_used).getTime(),
  }));

  localStorage.setItem(GUEST_KEY, JSON.stringify(mapped));

  const first = mapped[0];
  localStorage.setItem("delivery_address", first.address);
  localStorage.setItem("delivery_lat", first.lat.toString());
  localStorage.setItem("delivery_lng", first.lng.toString());
  localStorage.setItem("current_delivery_id", first.id);

  return mapped;
}

export async function deleteUserAddress(supabase, userId, address) {
  await supabase
    .from("user_addresses")
    .delete()
    .eq("user_id", userId)
    .eq("address", address);
}

export async function touchUserAddress(supabase, userId, address) {
  await supabase
    .from("user_addresses")
    .update({ last_used: new Date() })
    .eq("user_id", userId)
    .eq("address", address);
}

export function hasGuestAddresses() {
  const list = getSavedAddresses();
  return list.length > 0;
}

export async function saveUserAddress(
  supabase,
  userId,
  { address, lat, lng }
) {
  await supabase.from("user_addresses").upsert(
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
