# portfolio

Sifan Pan portfolio — React + TypeScript + Vite + Tailwind CSS v4.

Production: <https://sifanpan.github.io/portfolio/>

## Local development

```bash
npm install
npm run dev
```

Default: <http://localhost:5175/>

## Build & preview (GitHub Pages subpath)

```bash
BASE_PATH=/portfolio/ npm run build
BASE_PATH=/portfolio/ npx vite preview
```

## GitHub setup (one-time)

1. **Change username** to `sifanpan`: GitHub → Settings → Account → Change username.
2. **Rename this repo** to `portfolio`: Settings → General → Repository name.
   - If a `portfolio` repo already exists (e.g. Cove simulator), rename or merge it first.
3. **Pages**: Settings → Pages → Source = **GitHub Actions**; remove any custom domain.
4. Push to `main` — CI sets `BASE_PATH=/<repo-name>/` automatically.

## Directory layout

```
src/
  components/   # page sections
  data/         # project metadata
  publicUrl.ts  # static asset base path
```
