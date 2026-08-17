/** public/ assets must include Vite `base` on GitHub Pages subpath deploys */
export function publicUrl(path: string): string {
  const p = path
    .replace(/^\//, '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `${import.meta.env.BASE_URL}${p}`
}
