import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = {
    'real_1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Deforestation_in_Madagascar.jpg',
    'real_2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Nyungwe_National_Park%2C_Rwanda.jpg',
    'real_3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_satellite_view_of_Africa.jpg',
    'real_4.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Reforestation_in_Kenya.jpg'
}

for filename, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        response = urllib.request.urlopen(req, context=ctx)
        data = response.read()
        with open(f'c:/Users/user/Documents/local carbon/lcri-dashboard/frontend/public/{filename}', 'wb') as f:
            f.write(data)
        print(f'Successfully downloaded {filename} (Size: {len(data)} bytes)')
    except Exception as e:
        print(f'Failed to download {filename}: {e}')
