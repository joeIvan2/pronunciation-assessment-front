export const getBaseUrl = (): string => {
  const hostname = window.location.hostname;
  if (hostname === "localhost") return "http://localhost:3000";
  if (hostname === "preview.nicetone.dev") return "https://preview.nicetone.dev";
  if (hostname === "nicetone.vercel.app") return "https://nicetone.vercel.app";
  return "https://nicetone.dev";
};
