# sifan.pan.v2

Sifan Pan portfolio v2 — React + TypeScript + Vite + Tailwind CSS v4.

## Local development

```bash
npm install
npm run dev
```

Default: <http://localhost:5175/>

## Build & preview

```bash
npm run build
npx vite preview
```

Production site: <https://www.sifan.portfolio/>

## Deploy to GitHub Pages

1. Push to `main` — the **Deploy to GitHub Pages** workflow builds with `BASE_PATH=/`.
2. In the repo **Settings → Pages → Custom domain**, enter `www.sifan.portfolio` and enable **Enforce HTTPS** once DNS is live.
3. At your domain registrar, add a DNS record:

   | Type  | Name | Value                 |
   |-------|------|-----------------------|
   | CNAME | www  | `446500261psf.github.io` |

   Optional: redirect apex `sifan.portfolio` → `www.sifan.portfolio` (registrar-dependent).

## Directory layout

```
src/
  components/   # page sections
  data/         # project metadata
  publicUrl.ts  # static asset base path
```
