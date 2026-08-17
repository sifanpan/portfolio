#!/usr/bin/env python3
"""Generate height + normal maps from base color image (supports RGBA transparency)."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter
import numpy as np


def height_from_rgba(rgba: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    alpha = rgba[..., 3] / 255.0
    rgb = rgba[..., :3]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    mask = alpha > 0.05
    height = np.zeros_like(lum, dtype=np.float32)
    if mask.any():
        lo, hi = lum[mask].min(), lum[mask].max()
        height[mask] = (lum[mask] - lo) / max(hi - lo, 1e-6)
        height[mask] = np.power(height[mask], 0.92)
    height *= alpha
    height_img = Image.fromarray((height * 255).astype(np.uint8), mode="L")
    blurred = np.array(height_img.filter(ImageFilter.GaussianBlur(radius=2.8)), dtype=np.float32) / 255.0
    blurred *= alpha
    return blurred, alpha


def height_to_normal_rgba(height: np.ndarray, alpha: np.ndarray, strength: float = 3.2) -> np.ndarray:
    dx = np.zeros_like(height)
    dy = np.zeros_like(height)
    dx[:, 1:-1] = (height[:, 2:] - height[:, :-2]) * 0.5
    dy[1:-1, :] = (height[2:, :] - height[:-2, :]) * 0.5
    nx = -dx * strength
    ny = -dy * strength
    nz = np.ones_like(height)
    length = np.sqrt(nx * nx + ny * ny + nz * nz)
    nx /= length
    ny /= length
    nz /= length
    rgb = np.stack(
        [
            ((nx * 0.5 + 0.5) * 255).astype(np.uint8),
            ((ny * 0.5 + 0.5) * 255).astype(np.uint8),
            ((nz * 0.5 + 0.5) * 255).astype(np.uint8),
        ],
        axis=-1,
    )
    return np.dstack([rgb, (alpha * 255).astype(np.uint8)])


def process_base(base_path: Path, out_dir: Path | None = None) -> None:
    out_dir = out_dir or base_path.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(base_path).convert("RGBA")
    rgba = np.array(img, dtype=np.float32)
    height, alpha = height_from_rgba(rgba)
    normal = height_to_normal_rgba(height, alpha)

    Image.fromarray((height * 255).astype(np.uint8), mode="L").save(out_dir / "height.png")
    Image.fromarray(normal, mode="RGBA").save(out_dir / "normal.png")

    relief = bake_relief_base(rgba, normal)
    Image.fromarray(relief, mode="RGBA").save(out_dir / "relief-base.png")

    print(f"base {img.size} -> normal + relief-base (RGBA, transparent background)")


def bake_relief_base(base_rgba: np.ndarray, normal_rgba: np.ndarray) -> np.ndarray:
    """Fixed top-left light; bake normal into plaster relief base."""
    alpha = np.maximum(base_rgba[..., 3], normal_rgba[..., 3]) / 255.0
    nmap = normal_rgba[..., :3] / 255.0 * 2.0 - 1.0
    nmap[..., 2] = np.maximum(nmap[..., 2], 0.35)
    length = np.linalg.norm(nmap, axis=2, keepdims=True)
    nmap = nmap / np.maximum(length, 1e-6)

    light = np.array([0.38, -0.42, 0.82], dtype=np.float32)
    light /= np.linalg.norm(light)
    relief = np.maximum((nmap * light).sum(axis=2), 0.0)

    stone = np.array([0.91, 0.89, 0.84], dtype=np.float32)
    shade = 0.58 + relief * 0.42
    shade *= 1.0 - (1.0 - relief) * 0.14

    rgb = np.clip(stone * shade[..., None] * 255.0, 0, 255).astype(np.uint8)
    return np.dstack([rgb, (alpha * 255).astype(np.uint8)])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "src",
        type=Path,
        nargs="?",
        default=Path("public/playground/medal/base.png"),
        help="Base color PNG (default: public/playground/medal/base.png)",
    )
    parser.add_argument(
        "-o",
        "--out",
        type=Path,
        default=None,
        help="Output directory (default: same as base)",
    )
    args = parser.parse_args()
    process_base(args.src, args.out)


if __name__ == "__main__":
    main()
