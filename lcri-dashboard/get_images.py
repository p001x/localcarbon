import urllib.request
import json
import urllib.parse
import os

def get_wiki_img(query):
    url = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=' + urllib.parse.quote(query) + '&gsrnamespace=6&gsrlimit=1&prop=imageinfo&iiprop=url&format=json'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        res = urllib.request.urlopen(req).read()
        data = json.loads(res)
        pages = data['query']['pages']
        for page_id in pages:
            return pages[page_id]['imageinfo'][0]['url']
    except Exception as e:
        print("Error fetching URL for query", query, ":", e)
        return None

def download_img(url, filepath):
    if not url: return
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        data = urllib.request.urlopen(req).read()
        with open(filepath, 'wb') as f:
            f.write(data)
        print("Downloaded to", filepath)
    except Exception as e:
        print("Error downloading image from", url, ":", e)

before = get_wiki_img('deforestation erosion')
print('Before URL:', before)
download_img(before, 'c:/Users/user/Documents/local carbon/lcri-dashboard/frontend/public/images/rwanda_before.jpg')

after = get_wiki_img('Terraces in Rwanda')
print('After URL:', after)
download_img(after, 'c:/Users/user/Documents/local carbon/lcri-dashboard/frontend/public/images/rwanda_after.jpg')
