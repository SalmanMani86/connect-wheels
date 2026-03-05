const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/garage`
  : "http://localhost:8080/api/garage";

/**
 * Upload garage cover image. Returns the image URL.
 */
export async function uploadGarageCover(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("coverImage", file);

  const res = await fetch(`${API_BASE}/upload/garage-cover`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to upload cover image");
  }
  const data = await res.json();
  return data.url;
}

/**
 * Upload multiple car images. Returns array of image URLs.
 */
export async function uploadCarMedia(files) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const res = await fetch(`${API_BASE}/upload/car-media`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to upload car images");
  }
  const data = await res.json();
  return data.urls || [];
}

/**
 * Upload single car image. Returns the image URL.
 */
export async function uploadCarImage(file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("carImage", file);

  const res = await fetch(`${API_BASE}/upload/car-image`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to upload car image");
  }
  const data = await res.json();
  return data.url;
}

/**
 * Upload post images. Returns array of image URLs.
 */
export async function uploadPostMedia(files) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  for (const file of files) {
    formData.append("images", file);
  }

  const res = await fetch(`${API_BASE}/upload/post-media`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to upload images");
  }
  const data = await res.json();
  return data.urls || [];
}
