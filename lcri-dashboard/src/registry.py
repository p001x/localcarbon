import json

MOCK_PROJECTS = [
    {
        "id": "VCS-1822",
        "name": "Kasigau Corridor REDD+ Project",
        "country": "Kenya",
        "methodology": "VM0009",
        "status": "Issuing",
        "issued_tco2e": 21543000,
        "type": "REDD+",
        "bounds": {
            "type": "Feature",
            "properties": {"name": "Kasigau Corridor", "project_id": "VCS-1822"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [38.5, -3.5], [39.0, -3.5], [39.0, -4.0], [38.5, -4.0], [38.5, -3.5]
                ]]
            }
        }
    },
    {
        "id": "VCS-1202",
        "name": "Luangwa Community Forests",
        "country": "Zambia",
        "methodology": "VM0015",
        "status": "Registered",
        "issued_tco2e": 14500000,
        "type": "REDD+",
        "bounds": {
            "type": "Feature",
            "properties": {"name": "Luangwa Community Forests", "project_id": "VCS-1202"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [31.8, -12.3], [32.2, -12.3], [32.2, -12.8], [31.8, -12.8], [31.8, -12.3]
                ]]
            }
        }
    },
    {
        "id": "VCS-1468",
        "name": "Makira Natural Park REDD+",
        "country": "Madagascar",
        "methodology": "VM0007",
        "status": "Issuing",
        "issued_tco2e": 9500000,
        "type": "REDD+",
        "bounds": {
            "type": "Feature",
            "properties": {"name": "Makira Natural Park", "project_id": "VCS-1468"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [49.3, -15.0], [49.7, -15.0], [49.7, -15.4], [49.3, -15.4], [49.3, -15.0]
                ]]
            }
        }
    },
    {
        "id": "GS-1052",
        "name": "Bale Mountains Eco-Region",
        "country": "Ethiopia",
        "methodology": "AR-ACM0003",
        "status": "Under Validation",
        "issued_tco2e": 0,
        "type": "ARR",
        "bounds": {
            "type": "Feature",
            "properties": {"name": "Bale Mountains", "project_id": "GS-1052"},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [39.5, 6.5], [40.0, 6.5], [40.0, 7.0], [39.5, 7.0], [39.5, 6.5]
                ]]
            }
        }
    }
]

def get_registry_projects():
    return MOCK_PROJECTS
