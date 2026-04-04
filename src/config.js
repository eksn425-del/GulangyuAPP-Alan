const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = configuredApiUrl
    ? configuredApiUrl.replace(/\/+$/, "")
    : "";

export const API_HEADERS = {
    "ngrok-skip-browser-warning": "69420"
};
