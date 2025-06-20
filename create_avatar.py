from PIL import Image, ImageDraw
import os

img_dir = "app-demo/static/img"
os.makedirs(img_dir, exist_ok=True)
img_path = os.path.join(img_dir, "default_avatar.png")

img_size = (96, 96)
bg_color = (200, 200, 200) # Light grey
img = Image.new("RGB", img_size, bg_color)

# Optional: Add a slightly darker border or a simple initial letter
draw = ImageDraw.Draw(img)
draw.rectangle([0, 0, img_size[0]-1, img_size[1]-1], outline=(180, 180, 180))

img.save(img_path, "PNG")
print(f"Saved placeholder image to {img_path}")
