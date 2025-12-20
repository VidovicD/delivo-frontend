import { supabase } from "../../supabaseClient";

export const checkEmailExists = async (email) => {
  const { data, error } = await supabase.functions.invoke("check-email", {
    body: { email },
  });

  if (error) throw error;
  return data;
};

export const loginWithPassword = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
};

export const registerWithPassword = async (email, password, metadata) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return { data, error };
};

export const googleOAuth = async () => {
  sessionStorage.setItem("oauth_provider", "google");

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/reset-password",
  });

  if (error) throw error;
};

export const resendVerificationEmail = async (email) => {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) throw error;
};
