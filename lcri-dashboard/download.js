const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = {
    'real_1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Deforestation_in_Madagascar.jpg',
    'real_2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Nyungwe_National_Park%2C_Rwanda.jpg',
    'real_3.jpg': 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_satellite_view_of_Africa.jpg',
    'real_4.jpg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Reforestation_in_Kenya.jpg'
};

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
};

Object.entries(urls).forEach(([filename, url]) => {
    const dest = path.join(__dirname, 'frontend', 'public', filename);
    https.get(url, options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            https.get(res.headers.location, options, (redirectRes) => {
                const file = fs.createWriteStream(dest);
                redirectRes.pipe(file);
            });
        } else {
            const file = fs.createWriteStream(dest);
            res.pipe(file);
        }
    }).on('error', (err) => {
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
});
