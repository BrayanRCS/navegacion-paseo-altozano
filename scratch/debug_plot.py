import json
from PIL import Image, ImageDraw, ImageFont

data = json.load(open('mall_graph.json', encoding='utf-8'))

for lvl, img_path, out_path in [
    (1, 'planta-baja.png', 'debug_lvl1.png'),
    (2, 'planta-uno.png', 'debug_lvl2.png'),
    (3, 'planta-dos.png', 'debug_lvl3.png')
]:
    img = Image.open(img_path).convert('RGB')
    draw = ImageDraw.Draw(img)
    
    # Draw edges
    for e in data['edges']:
        u = next((n for n in data['nodes'] if n['id'] == e['from']), None)
        v = next((n for n in data['nodes'] if n['id'] == e['to']), None)
        if u and v and u['level'] == lvl and v['level'] == lvl:
            draw.line([u['coordinates']['x'], u['coordinates']['y'], v['coordinates']['x'], v['coordinates']['y']], fill=(100, 100, 255), width=2)
            
    # Draw nodes
    for n in data['nodes']:
        if n['level'] == lvl:
            x, y = n['coordinates']['x'], n['coordinates']['y']
            color = (0, 255, 0)
            r = 6
            if n['type'] == 'anchor_store':
                color = (255, 140, 0)
                r = 10
            elif n['type'] == 'island':
                color = (0, 200, 255)
                r = 6
            elif n['type'].startswith('portal_'):
                color = (255, 0, 255)
                r = 8
            elif n['type'] == 'totem':
                color = (255, 0, 0)
                r = 12
            elif n['type'] == 'corridor_intersection':
                color = (255, 255, 0)
                r = 4
                
            draw.ellipse([x-r, y-r, x+r, y+r], fill=color, outline=(0, 0, 0), width=2)
            label = n['id'].split('_')[-1]
            if n['type'] == 'totem':
                label = 'TOTEM'
            draw.text((x + r + 2, y - r), label, fill=(255, 255, 255))
            
    img.save(out_path)
    print(f'Saved {out_path}')
