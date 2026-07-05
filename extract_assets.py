from PIL import Image
import os

img = Image.open('layouts/slide_02.png')
width, height = img.size

# Extract top right logo
# Logo seems to be roughly in the top 100-150 pixels, right side. Let's inspect slide 2.
# Slide dimensions: 1920 x 1080 (assuming 16:9 standard export).
# Actually, let's just make bounding boxes based on typical 1920x1080.

logo = img.crop((width - 350, 0, width, 180))
logo.save('assets/rentease_logo.png')

# Extract right sidebar icons
# Sidebar is on the right edge, starting below the header and going to the footer.
sidebar = img.crop((width - 150, 180, width, height - 100))
sidebar.save('assets/sidebar_icons.png')

# Extract footer dashed line and text
# Bottom left has text, bottom has line. Maybe just use CSS for line and text. 
# "RENTEASE LIMITED" can just be text with a specific font. 
# Dashed line can be a CSS border.
# Header blue bar can just be a CSS div.

print("Assets extracted!")
