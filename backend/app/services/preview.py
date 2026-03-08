from pathlib import Path

import cv2
import numpy as np


def hex_to_bgr(color: str) -> tuple[int, int, int]:
    value = color.lstrip("#")
    red = int(value[0:2], 16)
    green = int(value[2:4], 16)
    blue = int(value[4:6], 16)
    return blue, green, red


def detect_floor_polygon(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]
    top_y = int(height * 0.58)

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 60, 150)
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi / 180,
        threshold=90,
        minLineLength=int(width * 0.22),
        maxLineGap=30,
    )

    candidates: list[int] = []
    if lines is not None:
        for line in lines[:, 0]:
            x1, y1, x2, y2 = line.tolist()
            dx = max(abs(x2 - x1), 1)
            dy = abs(y2 - y1)
            slope = dy / dx
            average_y = int((y1 + y2) / 2)
            if slope < 0.18 and int(height * 0.42) <= average_y <= int(height * 0.72):
                candidates.append(average_y)

    if candidates:
        top_y = int(np.clip(np.median(candidates), height * 0.48, height * 0.68))

    polygon = np.array(
        [
            [int(width * 0.18), top_y],
            [int(width * 0.82), top_y],
            [int(width * 0.98), int(height * 0.98)],
            [int(width * 0.02), int(height * 0.98)],
        ],
        dtype=np.int32,
    )
    return polygon


def create_texture(
    width: int, height: int, colors: tuple[str, str, str], texture_scale: float = 1.0
) -> np.ndarray:
    texture = np.zeros((height, width, 3), dtype=np.uint8)
    base = np.array(hex_to_bgr(colors[0]), dtype=np.uint8)
    mid = np.array(hex_to_bgr(colors[1]), dtype=np.uint8)
    accent = np.array(hex_to_bgr(colors[2]), dtype=np.uint8)
    plank_width = max(int(58 * texture_scale), 36)

    for x in range(0, width, plank_width):
        color = base if (x // plank_width) % 2 == 0 else mid
        texture[:, x : x + plank_width] = color
        cv2.line(texture, (x, 0), (x, height), tuple(int(v) for v in accent), 2)

        for offset in range(18, height, max(int(72 * texture_scale), 52)):
            row_color = tuple(int(v) for v in (accent if (offset // 60) % 2 == 0 else mid))
            cv2.line(
                texture,
                (x, min(offset, height - 1)),
                (min(x + plank_width, width - 1), min(offset, height - 1)),
                row_color,
                1,
            )

    noise = np.random.normal(0, 7, (height, width, 1)).astype(np.int16)
    textured = np.clip(texture.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    return textured


def generate_floor_preview(
    original_path: Path,
    result_path: Path,
    mask_path: Path,
    colors: tuple[str, str, str],
    texture_scale: float = 1.0,
) -> None:
    original = cv2.imread(str(original_path))
    if original is None:
        raise ValueError("無法讀取上傳圖片。")

    height, width = original.shape[:2]
    polygon = detect_floor_polygon(original)
    texture = create_texture(width, height, colors, texture_scale)

    src = np.array(
        [[0, 0], [width, 0], [width, height], [0, height]],
        dtype=np.float32,
    )
    dst = polygon.astype(np.float32)
    perspective_matrix = cv2.getPerspectiveTransform(src, dst)
    warped_texture = cv2.warpPerspective(texture, perspective_matrix, (width, height))

    mask = np.zeros((height, width), dtype=np.uint8)
    cv2.fillConvexPoly(mask, polygon, 255)
    softened_mask = cv2.GaussianBlur(mask, (31, 31), 0)

    grayscale = cv2.cvtColor(original, cv2.COLOR_BGR2GRAY)
    normalized_light = cv2.normalize(grayscale.astype(np.float32), None, 0.72, 1.08, cv2.NORM_MINMAX)
    lighting = cv2.merge([normalized_light, normalized_light, normalized_light])

    textured_floor = np.clip(warped_texture.astype(np.float32) * lighting, 0, 255).astype(np.uint8)
    blended = cv2.addWeighted(textured_floor, 0.82, original, 0.18, 0)

    alpha = (softened_mask.astype(np.float32) / 255.0)[..., None]
    result = np.clip(original * (1 - alpha) + blended * alpha, 0, 255).astype(np.uint8)

    cv2.imwrite(str(result_path), result)
    cv2.imwrite(str(mask_path), softened_mask)
