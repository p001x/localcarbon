from arcgis.gis import GIS
from arcgis.raster import ImageryLayer

# Use anonymous access if API key isn't provided or needed
gis = GIS()
layer = ImageryLayer(
    "https://tiledimageservices.arcgis.com/jIL9msH9OI208GCb/arcgis/rest/services/Global_Above_Ground_Biomass_2007_2022/ImageServer",
    gis=gis
)
print("Properties:", layer.properties.get('pixelType'), layer.properties.get('bandCount'))
sample = layer.identify(geometry={"x": 29.87, "y": -1.94, "spatialReference": {"wkid": 4326}})
print("Identify Sample:", sample)
