export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("mentorat_access");
  window.localStorage.removeItem("mentorat_refresh");
  document.cookie = "mentorat_access=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "mentorat_home=; path=/; max-age=0; SameSite=Lax";
}
