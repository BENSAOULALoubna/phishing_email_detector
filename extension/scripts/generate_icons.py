"""
generate_icons.py — creates simple placeholder PNG icons for the extension.
Run once: python generate_icons.py
"""
import struct, zlib, os

def make_png(size, color_hex):
    """Minimal valid PNG writer — no external deps needed."""
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)

    def chunk(name, data):
        c = struct.pack('>I', len(data)) + name + data
        return c + struct.pack('>I', zlib.crc32(name + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))

    raw = b''
    for _ in range(size):
        row = b'\x00' + bytes([r, g, b] * size)
        raw += row
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

os.makedirs('icons', exist_ok=True)
for sz in [16, 48, 128]:
    png = make_png(sz, 'e74c3c')  # phishing red as icon color
    with open(f'icons/icon{sz}.png', 'wb') as f:
        f.write(png)
    print(f"Created icons/icon{sz}.png")
