# Jeroen Vermeulen — Portfolio

A clean developer portfolio in plain HTML, CSS and JavaScript. No framework, build step or runtime dependencies.

## Preview

From this directory:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000**. Use an HTTP server so the JavaScript modules and project JSON load correctly.

## Design

Inspired by the personal introduction, navigation and project/experience organization in [awesome-portfolio-websites](https://github.com/smaranjitghose/awesome-portfolio-websites). The implementation and styles are original. The reference's centered introduction becomes a simple monogram, a direct description of Jeroen's work, and GitHub/LinkedIn links.

The page uses a light neutral palette, blue accents, DM Sans typography, thin dividers and a compact project grid. A dark theme is available in the header. Motion is limited to native smooth scrolling, brief hover transitions and a short dialog entrance; reduced-motion preferences disable these animations.

## Features

- Home, selected projects, ASML internship experience, about/skills and contact.
- Two original projects with their existing descriptions, images and technical details.
- Category filters and accessible native case-study dialogs with Escape dismissal and restored focus.
- English, Dutch, German, French and Spanish, with a remembered language preference.
- Remembered light/dark mode applied before paint.
- Mobile menu with Escape dismissal and automatic closure after navigation.
- Email link, copy-address control and a form that opens an email draft. There is no form server and no message is submitted by the site.
- Static project previews and contact/navigation links work without JavaScript.
- If project loading fails, the previews remain available and a retry control appears.

The ASML preview uses the supplied company logo; it is not presented as an application screenshot. The QuietCare preview uses the supplied project wordmark. Original full project visuals remain in the case studies.

## Files

| File                 | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| `index.html`         | Page structure and usable static fallback                             |
| `styles.css`         | Layout, themes, typography and responsive styles                      |
| `script.js`          | Navigation, languages, project loading/filtering, dialogs and contact |
| `theme.js`           | Optional saved theme applied before the page paints                   |
| `portfolio-copy.js`  | Current page copy in five languages                                   |
| `translations.js`    | Shared interface and original project translations                    |
| `data/projects.json` | Project content and image galleries                                   |
| `assets/`            | Local project images and favicon                                      |

To add a project, use the existing fields in `data/projects.json`. The first image is its default preview and cover; subsequent images appear in the case-study gallery. Existing `tech` and `tags` arrays are both supported. Add translated details to `projectTranslations` in `translations.js`. Two existing projects have custom logo previews and concise descriptions in `script.js` and `portfolio-copy.js`.

The contact address appears in **both `index.html` and `script.js`**.

## Deployment

Deploy **the contents of this directory** to a static host. No build command is required. `_headers` supplies security headers on hosts supporting that file format; other hosts need equivalent header configuration.

Google Fonts supplies DM Sans and IBM Plex Mono, with local system fallbacks. All scripts, project content and images are local. The previous 3D renderer and its assets are archived outside the deployable directory in `../review/cinematic-original/`.

## Verification

Run from the workspace root, using the existing review dependencies:

```powershell
node review/redesign-checks.cjs
```

The check uses installed Chrome and requires the local preview server at port 8000. It covers filters, both dialogs, keyboard dismissal/focus, mobile navigation, clipboard copying, contact validation, theme and language persistence, reduced motion, no-JavaScript access, and recovery from a failed project request.

All five languages were checked at 320, 390, 768 and 1440 CSS pixels for overflow and clipped headings. Results and desktop/mobile/light/dark screenshots are saved in `../review/redesign-*`. These are browser viewport checks, not physical-device performance measurements.
