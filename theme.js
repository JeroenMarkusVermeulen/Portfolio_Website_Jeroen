// Apply the optional preference before paint.
try {
  if (localStorage.getItem("portfolio-theme") === "dark") {
    document.documentElement.dataset.theme = "dark";
  }
} catch {
  // Default to light when browser storage is unavailable.
}
