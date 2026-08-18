import sys
import re

file_path = r'C:\Users\user\Documents\local carbon\lcri-dashboard\app.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_js = '''
        <style>
          .vq-lens-ring {
            position: absolute; pointer-events: none;
            border-radius: 50%; z-index: 9999; display: none;
            width: 340px; height: 340px;
          }
          .vq-lens-info-panel {
            position: absolute; bottom: 20px; left: 20px;
            background: rgba(10, 25, 17, 0.95);
            border: 1px solid #2ecc71;
            box-shadow: 0 0 15px rgba(46,204,113,0.3);
            border-radius: 8px; padding: 12px 18px; color: #e8f5e9;
            font-family: \\'Inter\\', sans-serif; z-index: 10000;
            pointer-events: none; display: none; width: 260px;
          }
          .vq-lens-info-title { font-weight: 700; color: #2ecc71; font-size: 0.95rem; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
          .vq-lens-info-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin: 4px 0; }
          .vq-lens-info-val { font-weight: 600; color: #80cbc4; }
        </style>
        <script>
        (function() {
          function initLens() {
            var checkExist = setInterval(function() {
              var mapEl = document.querySelector('.leaflet-container');
              var mapKey = Object.keys(window).find(function(k) {
                return k.startsWith('map_') && window[k] && typeof window[k].fitBounds === 'function';
              });
              var map = window[mapKey];
              if (!mapEl || !map) return;

              var targetLayer = null;
              map.eachLayer(function(layer) {
                  if (layer.options && layer.options.className === 'vq-lens-target') {
                      if (typeof layer.getContainer === 'function') {
                          targetLayer = layer.getContainer();
                      }
                  }
              });

              if (!targetLayer) return;
              clearInterval(checkExist);

              // Hide layer initially
              targetLayer.style.willChange = 'clip-path';
              targetLayer.style.clipPath = 'circle(0px at 0 0)';
              // Remove the clip-path from the individual images that Leaflet might have applied the class to
              var imgs = targetLayer.querySelectorAll('img.vq-lens-target');
              imgs.forEach(function(img) { img.style.clipPath = 'none'; });

              var ring = document.createElement('div');
              ring.className = 'vq-lens-ring';
              mapEl.appendChild(ring);

              var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
              svg.setAttribute('width', '340');
              svg.setAttribute('height', '340');
              svg.style.cssText = 'position:absolute;top:0;left:0;overflow:visible;';
              ring.appendChild(svg);

              var panel = document.createElement('div');
              panel.className = 'vq-lens-info-panel';
              panel.innerHTML = '<div class=\"vq-lens-info-title\">Carbon Asset Details</div>' +
                '<div class=\"vq-lens-info-row\"><span>Carbon Sequestration:</span><span class=\"vq-lens-info-val\" id=\"vq-seq\">-</span></div>' +
                '<div class=\"vq-lens-info-row\"><span>Proposed Credit:</span><span class=\"vq-lens-info-val\" id=\"vq-cred\">-</span></div>' +
                '<div class=\"vq-lens-info-row\"><span>Location (Lat/Lng):</span><span class=\"vq-lens-info-val\" id=\"vq-loc\">-</span></div>';
              mapEl.appendChild(panel);

              function estimateBiomass(lat, lng) {
                var base = 12.5;
                var nyungwe  = 185 * Math.exp(-((lat+2.48)*(lat+2.48) + (lng-29.23)*(lng-29.23)) / 0.08);
                var volcanoes= 165 * Math.exp(-((lat+1.47)*(lat+1.47) + (lng-29.49)*(lng-29.49)) / 0.03);
                var gishwati = 135 * Math.exp(-((lat+1.68)*(lat+1.68) + (lng-29.38)*(lng-29.38)) / 0.02);
                var akagera  = 55  * Math.exp(-((lat+1.88)*(lat+1.88) + (lng-30.68)*(lng-30.68)) / 0.12);
                return Math.min(400, Math.max(0, base + nyungwe + volcanoes + gishwati + akagera));
              }

              var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              // Modify factors to distribute visually like the user screenshot
              var factors = [0.91, 0.48, 0.40, 0.73, 0.05, 0.03, 0.12, 0.10, 0.18, 0.20, 0.59, 0.59];
              var targets = [0.45, 0.50, 0.45, 0.45, 0.35, 0.25, 0.25, 0.25, 0.30, 0.35, 0.40, 0.45];

              function mkEl(tag) { return document.createElementNS('http://www.w3.org/2000/svg', tag); }

              function drawChart(biomass) {
                while (svg.firstChild) svg.removeChild(svg.firstChild);

                var defs = mkEl('defs');
                var pat = mkEl('pattern');
                pat.setAttribute('id','lg'); pat.setAttribute('width','5'); pat.setAttribute('height','5');
                pat.setAttribute('patternUnits','userSpaceOnUse');
                var gp = mkEl('path');
                gp.setAttribute('d','M 5 0 L 0 0 0 5');
                gp.setAttribute('fill','none'); gp.setAttribute('stroke','rgba(0,0,0,0.5)'); gp.setAttribute('stroke-width','0.5');
                pat.appendChild(gp); defs.appendChild(pat);
                var flt = mkEl('filter'); flt.setAttribute('id','bg');
                flt.innerHTML = '<feGaussianBlur stdDeviation=\"2\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge>';
                defs.appendChild(flt); svg.appendChild(defs);

                var cx = 170, cy = 170, rMin = 22, rMax = 150;

                // Center lens background (yellowish grid)
                var lb = mkEl('circle');
                lb.setAttribute('cx', cx); lb.setAttribute('cy', cy); lb.setAttribute('r', rMin);
                lb.setAttribute('fill','#d9dac2'); lb.setAttribute('stroke','#fff');
                lb.setAttribute('stroke-width','1'); svg.appendChild(lb);

                var lg2 = mkEl('circle');
                lg2.setAttribute('cx', cx); lg2.setAttribute('cy', cy); lg2.setAttribute('r', rMin);
                lg2.setAttribute('fill','url(#lg)'); svg.appendChild(lg2);

                // Orange center dot
                var od = mkEl('rect');
                od.setAttribute('x', cx - 2); od.setAttribute('y', cy - 2);
                od.setAttribute('width','4'); od.setAttribute('height','4');
                od.setAttribute('fill','#ffa500'); svg.appendChild(od);

                // Concentric grid circles
                var scales = [50, 100, 200, 300, 400];
                scales.forEach(function(val) {
                  var r = rMin + (val / 400) * (rMax - rMin);
                  var c = mkEl('circle');
                  c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
                  c.setAttribute('fill','none'); c.setAttribute('stroke','rgba(255,255,255,0.4)');
                  if(val < 400) c.setAttribute('stroke-dasharray','3,3');
                  svg.appendChild(c);
                  
                  if(val !== 400) {
                      var t = mkEl('text');
                      t.setAttribute('x', cx); t.setAttribute('y', cy - r + 10);
                      t.setAttribute('text-anchor','middle'); t.setAttribute('fill','rgba(255,255,255,0.8)');
                      t.setAttribute('font-size','10'); t.setAttribute('font-family','Arial'); t.setAttribute('font-weight','bold');
                      t.textContent = val;
                      svg.appendChild(t);
                  }
                });

                var ptsB = [], ptsP = [];
                for (var i = 0; i < 12; i++) {
                  var ang = i * (2 * Math.PI / 12) - Math.PI / 2 + Math.PI / 12;
                  var cos = Math.cos(ang), sin = Math.sin(ang);

                  // Ray
                  var ln = mkEl('line');
                  ln.setAttribute('x1', cx); ln.setAttribute('y1', cy);
                  ln.setAttribute('x2', cx + rMax * cos); ln.setAttribute('y2', cy + rMax * sin);
                  ln.setAttribute('stroke','rgba(255,255,255,0.4)'); ln.setAttribute('stroke-width','1');
                  svg.appendChild(ln);

                  // Month label
                  var lR = 165;
                  var mt = mkEl('text');
                  mt.setAttribute('x', cx + lR * cos); mt.setAttribute('y', cy + lR * sin + 4);
                  mt.setAttribute('text-anchor','middle'); mt.setAttribute('fill','#fff');
                  mt.setAttribute('font-size','12'); mt.setAttribute('font-weight','bold');
                  mt.setAttribute('font-family','Arial');
                  mt.textContent = months[i]; svg.appendChild(mt);

                  // Blue point (Carbon Sequestration)
                  var vB = biomass * factors[i];
                  var rB = rMin + (vB / 400) * (rMax - rMin);
                  ptsB.push({ x: cx + rB * cos, y: cy + rB * sin, v: Math.round(vB) });

                  // Pink point (Baseline)
                  var vP = biomass * targets[i];
                  var rP = rMin + (vP / 400) * (rMax - rMin);
                  ptsP.push({ x: cx + rP * cos, y: cy + rP * sin });
                }

                // Pink polygon
                var pd = 'M ' + ptsP.map(function(p) { return p.x + ' ' + p.y; }).join(' L ') + ' Z';
                var pp = mkEl('path');
                pp.setAttribute('d', pd); pp.setAttribute('fill','transparent');
                pp.setAttribute('stroke','#f48fb1'); pp.setAttribute('stroke-width','2');
                svg.appendChild(pp);

                // Blue polygon
                var bd = 'M ' + ptsB.map(function(p) { return p.x + ' ' + p.y; }).join(' L ') + ' Z';
                var bp = mkEl('path');
                bp.setAttribute('d', bd); bp.setAttribute('fill','rgba(79,195,247,0.4)');
                bp.setAttribute('stroke','#4fc3f7'); bp.setAttribute('stroke-width','3');
                svg.appendChild(bp);

                // Value labels on blue vertices
                ptsB.forEach(function(p, i) {
                  var ang = i * (2 * Math.PI / 12) - Math.PI / 2 + Math.PI / 12;
                  var vt = mkEl('text');
                  vt.setAttribute('x', p.x + 12 * Math.cos(ang));
                  vt.setAttribute('y', p.y + 12 * Math.sin(ang) + 4);
                  vt.setAttribute('text-anchor','middle'); vt.setAttribute('fill','#fff');
                  vt.setAttribute('font-size','11'); vt.setAttribute('font-weight','bold');
                  vt.setAttribute('font-family','Arial');
                  vt.textContent = p.v; svg.appendChild(vt);
                });
                
                // Chart Size Label at the bottom
                var cs = mkEl('text');
                cs.setAttribute('x', cx); cs.setAttribute('y', cy + rMax + 30);
                cs.setAttribute('text-anchor','middle'); cs.setAttribute('fill','#fff');
                cs.setAttribute('font-size','14'); cs.setAttribute('font-weight','bold');
                cs.setAttribute('font-family','Arial');
                cs.textContent = "Chart Size: 120px"; svg.appendChild(cs);
              }

              mapEl.addEventListener('mousemove', function(e) {
                var rect = mapEl.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                ring.style.left = x + 'px'; ring.style.top = y + 'px';
                ring.style.marginLeft = '-170px'; ring.style.marginTop = '-170px';
                ring.style.display = 'block';

                var ll = map.containerPointToLatLng([x, y]);
                var lat = ll.lat, lng = ll.lng;
                
                var bm = estimateBiomass(lat, lng) * 2.0; // scale up to reach ~400
                var co2e = bm * 0.47 * 3.67;
                var credit = co2e * 15.50; // $15.50 per ton of CO2e
                
                targetLayer.style.clipPath = 'circle(120px at ' + x + 'px ' + y + 'px)';
                drawChart(bm);
                document.getElementById('vq-seq').textContent = co2e.toFixed(1) + ' tCO2e/ha';
                document.getElementById('vq-cred').textContent = '$' + credit.toFixed(2) + ' / ha';
                document.getElementById('vq-loc').textContent = lat.toFixed(4) + '\\u00b0, ' + lng.toFixed(4) + '\\u00b0';
                panel.style.display = 'block';
              });

              mapEl.addEventListener('mouseleave', function() {
                targetLayer.style.clipPath = 'circle(0px at 0 0)';
                ring.style.display = 'none';
                panel.style.display = 'none';
              });

            }, 250);
          }
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initLens();
          } else {
            document.addEventListener('DOMContentLoaded', initLens);
          }
        })();
        </script>
'''

pattern = re.compile(r'lens_js\s*=\s*\"\"\"(.*?)\"\"\"', re.DOTALL)

def replacer(match):
    return 'lens_js = \"\"\"' + new_js + '\"\"\"'

new_content = pattern.sub(replacer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Replaced JS block successfully.')
