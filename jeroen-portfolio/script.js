import {
  translations,
  projectTranslations,
  languageOptions,
} from "./translations.js";
import { portfolioCopy } from "./portfolio-copy.js";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const safeList = (value) => (Array.isArray(value) ? value : []);
const safeImage = (value) =>
  typeof value === "string" &&
  /^assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|svg)$/i.test(value) &&
  !value.includes("..")
    ? value
    : "";
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* Preferences are optional. */
    }
  },
};
let currentLanguage = languageOptions[storage.get("language")]
  ? storage.get("language")
  : "en";
let projects = [],
  activeFilter = "all",
  currentProjectId = null,
  modalTrigger = null;
const t = (key) =>
  portfolioCopy[currentLanguage]?.[key] ??
  translations[currentLanguage]?.[key] ??
  portfolioCopy.en[key] ??
  translations.en[key] ??
  key;
const localizeProject = (project) => ({
  ...project,
  ...projectTranslations[currentLanguage]?.[project.id],
});
const dialog = $("[data-project-modal]");

function applyLanguage() {
  document.documentElement.lang = languageOptions[currentLanguage].htmlLang;
  document.title = t("title");
  $('meta[name="description"]').content = t("metaDescription");
  $$("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  $$("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  $("[data-language]").value = currentLanguage;
  $("[data-language]").setAttribute("aria-label", t("languageLabel"));
  $("[data-copy-email]").setAttribute("aria-label", t("copyEmail"));
  $("[data-close-modal]").setAttribute("aria-label", t("closeProjectDetails"));
  $("[data-filters]").setAttribute("aria-label", t("projectFilters"));
  setMenu($("[data-nav]").classList.contains("open"));
  updateThemeControl();
  if (projects.length) renderProjects();
  if (currentProjectId) renderModal(currentProjectId);
}

function updateThemeControl() {
  const dark = document.documentElement.dataset.theme === "dark";
  $("[data-theme-toggle]").setAttribute("aria-pressed", String(dark));
  $("[data-theme-toggle]").setAttribute(
    "aria-label",
    t(dark ? "themeLight" : "themeDark"),
  );
  $('meta[name="theme-color"]').content = dark ? "#171c20" : "#fafbf9";
}

async function loadProjects() {
  const retry = $("[data-retry]");
  retry.disabled = true;
  try {
    const response = await fetch("data/projects.json");
    if (!response.ok) throw new Error("Projects: " + response.status);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid project data");
    projects = data.filter(
      (p) => p && typeof p.id === "string" && typeof p.title === "string",
    );
    renderProjects();
    $("[data-filters]").hidden = false;
    $("[data-project-error]").hidden = true;
  } catch (error) {
    console.warn("Project details unavailable:", error);
    $("[data-project-error]").hidden = false;
  } finally {
    retry.disabled = false;
  }
}

function renderProjects() {
  const list = projects.filter(
    (p) => activeFilter === "all" || p.category === activeFilter,
  );
  $("[data-project-count]").textContent =
    String(list.length).padStart(2, "0") +
    " " +
    t(list.length === 1 ? "projectCountSingle" : "projectCount");
  $("[data-project-grid]").innerHTML = list
    .map((project) => {
      const p = localizeProject(project);
      const title = escapeHTML(p.title);
      const quietcare = p.id === "quietcare-home";
      const pit = p.id === "pit-analysis-data-automation";
      const cover = safeImage(safeList(p.images)[0]) || safeImage(p.cover);
      const preview = quietcare ? "assets/images/quietcare-logo.png" : cover;
      const fallback = pit ? "assets/projects/pit-analysis/results.jpg" : cover;
      const description = quietcare
        ? t("quietcareShort")
        : pit
          ? t("pitShort")
          : p.short;
      const tags = safeList(p.tech?.length ? p.tech : p.tags).slice(0, 3);
      return (
        '<article class="project-entry" data-project="' +
        escapeHTML(p.id) +
        '">' +
        '<a class="project-preview ' +
        (quietcare ? "quietcare-preview" : pit ? "pit-preview" : "") +
        '" href="' +
        fallback +
        '" data-open-project="' +
        escapeHTML(p.id) +
        '" aria-label="' +
        escapeHTML(t("viewDetails")) +
        ": " +
        title +
        '"><img src="' +
        preview +
        '" alt="' +
        (pit ? "ASML" : title) +
        '" loading="lazy" decoding="async" width="' +
        (quietcare ? 224 : 3840) +
        '" height="' +
        (quietcare ? 113 : 2160) +
        '"><span class="preview-arrow" aria-hidden="true">↗</span></a>' +
        '<div class="project-meta"><span>' +
        escapeHTML(p.category) +
        "</span><span>" +
        escapeHTML(p.year) +
        "</span></div>" +
        "<h3>" +
        title +
        "</h3><p>" +
        escapeHTML(description) +
        "</p>" +
        '<div class="tag-row">' +
        tags.map((tag) => "<span>" + escapeHTML(tag) + "</span>").join("") +
        "</div>" +
        '<a class="text-link" href="' +
        fallback +
        '" data-open-project="' +
        escapeHTML(p.id) +
        '"><span>' +
        escapeHTML(t("openCaseStudy")) +
        '</span><span aria-hidden="true">↗</span></a></article>'
      );
    })
    .join("");
}

function renderModal(id) {
  const project = projects.find((p) => p.id === id);
  if (!project) return false;
  const p = localizeProject(project);
  const tags = safeList(p.tech?.length ? p.tech : p.tags);
  const images = safeList(p.images).map(safeImage).filter(Boolean);
  const sections = [
    ["modalProblem", p.problem],
    ["modalSolution", p.solution],
    ["modalImpact", p.impact],
  ];
  $("[data-modal-content]").innerHTML =
    '<h2 id="modal-title" class="modal-title">' +
    escapeHTML(p.title) +
    "</h2>" +
    '<p class="modal-meta">' +
    escapeHTML(p.category) +
    " / " +
    escapeHTML(p.year) +
    " / " +
    escapeHTML(p.status) +
    "</p>" +
    '<p class="modal-description">' +
    escapeHTML(p.description) +
    "</p>" +
    '<div class="tag-row">' +
    tags.map((tag) => "<span>" + escapeHTML(tag) + "</span>").join("") +
    "</div>" +
    (images[0]
      ? '<img class="modal-cover" src="' +
        images[0] +
        '" alt="' +
        escapeHTML(p.title) +
        '">'
      : "") +
    sections
      .filter(([, value]) => value)
      .map(
        ([key, value]) =>
          '<section class="modal-section"><h3>' +
          escapeHTML(t(key)) +
          "</h3><p>" +
          escapeHTML(value) +
          "</p></section>",
      )
      .join("") +
    '<section class="modal-section"><h3>' +
    escapeHTML(t("modalHighlights")) +
    "</h3><ul>" +
    safeList(p.highlights)
      .map((item) => "<li>" + escapeHTML(item) + "</li>")
      .join("") +
    "</ul></section>" +
    '<div class="modal-gallery">' +
    images
      .slice(1)
      .map(
        (image, i) =>
          '<img src="' +
          image +
          '" alt="' +
          escapeHTML(p.title) +
          " — " +
          escapeHTML(t("modalVisuals")) +
          " " +
          (i + 1) +
          '" loading="lazy">',
      )
      .join("") +
    "</div>" +
    (p.discreetNote
      ? '<p class="modal-note">' + escapeHTML(p.discreetNote) + "</p>"
      : "");
  return true;
}

function openProject(id, trigger) {
  if (!renderModal(id)) return false;
  currentProjectId = id;
  modalTrigger = trigger;
  dialog.showModal();
  document.body.classList.add("modal-open");
  dialog.scrollTop = 0;
  $("[data-close-modal]").focus({ preventScroll: true });
  return true;
}

function setMenu(open) {
  $("[data-nav]").classList.toggle("open", open);
  $("[data-menu-toggle]").setAttribute("aria-expanded", String(open));
  $("[data-menu-toggle]").setAttribute(
    "aria-label",
    t(open ? "menuClose" : "menuOpen"),
  );
}

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("visible"), 3500);
}

$("[data-language]").addEventListener("change", (event) => {
  if (!languageOptions[event.target.value]) return;
  currentLanguage = event.target.value;
  storage.set("language", currentLanguage);
  applyLanguage();
});
$("[data-theme-toggle]").addEventListener("click", () => {
  const theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  storage.set("portfolio-theme", theme);
  updateThemeControl();
});
$("[data-menu-toggle]").addEventListener("click", () =>
  setMenu(!$("[data-nav]").classList.contains("open")),
);
$$(".main-nav a").forEach((link) =>
  link.addEventListener("click", () => setMenu(false)),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && $("[data-nav]").classList.contains("open")) {
    setMenu(false);
    $("[data-menu-toggle]").focus();
  }
});
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-open-project]");
  if (
    link &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    openProject(link.dataset.openProject, link)
  ) {
    event.preventDefault();
  }
  if (!event.target.closest("[data-header]")) setMenu(false);
});
$$("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    $$("[data-filter]").forEach((el) => {
      el.classList.toggle("is-active", el === button);
      el.setAttribute("aria-pressed", String(el === button));
    });
    renderProjects();
  }),
);
$("[data-retry]").addEventListener("click", loadProjects);
$("[data-close-modal]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    dialog.close();
});
dialog.addEventListener("close", () => {
  const id = currentProjectId;
  currentProjectId = null;
  document.body.classList.remove("modal-open");
  const trigger = modalTrigger?.isConnected
    ? modalTrigger
    : $('[data-open-project="' + CSS.escape(id ?? "") + '"]');
  trigger?.focus({ preventScroll: true });
});
$("[data-contact-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = encodeURIComponent(
    t("emailSubject") + " " + data.get("name"),
  );
  const body = encodeURIComponent(
    t("emailBodyName") +
      ": " +
      data.get("name") +
      "\n" +
      t("emailBodyEmail") +
      ": " +
      data.get("email") +
      "\n\n" +
      data.get("message"),
  );
  showToast(t("openingEmail"));
  location.href =
    "mailto:jeroen@vermeulenprive.nl?subject=" + subject + "&body=" + body;
});
const copyButton = $("[data-copy-email]");
if (navigator.clipboard?.writeText) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("jeroen@vermeulenprive.nl");
      showToast(t("emailCopied"));
    } catch {
      showToast(t("copyFailed"));
    }
  });
}

// Update the active section at most once per animation frame. Scrolling stays native.
const sections = $$("main > section[id]");
let scrollScheduled = false;
function updateNavigation() {
  scrollScheduled = false;
  const current =
    [...sections]
      .reverse()
      .find((section) => section.getBoundingClientRect().top <= 150) ||
    sections[0];
  const atBottom =
    innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  const id = atBottom ? "contact" : current.id;
  $$(".main-nav a").forEach((link) => {
    if (link.hash === "#" + id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
addEventListener(
  "scroll",
  () => {
    if (!scrollScheduled) {
      scrollScheduled = true;
      requestAnimationFrame(updateNavigation);
    }
  },
  { passive: true },
);
addEventListener("resize", () => {
  if (innerWidth > 760) setMenu(false);
  updateNavigation();
});
$("[data-year]").textContent = String(new Date().getFullYear());
applyLanguage();
updateNavigation();
loadProjects();
