# sifan.pan.v2

Sifan Pan portfolio v2 — React + TypeScript + Vite + Tailwind CSS v4.

## Local development

```bash
npm install
npm run dev
```

Default: <http://localhost:5175/>

## Build & preview (GitHub Pages subpath)

```bash
BASE_PATH=/sifan.pan.v2/ npm run build
BASE_PATH=/sifan.pan.v2/ npx vite preview
```

## Deploy to GitHub Pages

1. Create a GitHub repo `sifan.pan.v2` (or any name; `BASE_PATH` aligns with the repo name).
2. `git remote add origin …` then `git push -u origin main`.
3. In the repo **Settings → Pages → Source**, choose **GitHub Actions**.
4. Wait for the **Deploy to GitHub Pages** workflow to finish.

## Directory layout

```
src/
  components/   # page sections
  data/         # project metadata
  publicUrl.ts  # static asset base path
```
