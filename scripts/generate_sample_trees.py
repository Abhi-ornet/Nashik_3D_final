import json
import random
from pathlib import Path

random.seed(42)
# Synthetic points around Central Park, Manhattan, NYC.
# x = longitude, y = latitude (WGS84 / EPSG:4326).
west, east = -73.9819, -73.9498
south, north = 40.7644, 40.8005
species = ["Oak", "London plane", "Elm", "Maple", "Honey locust", "Cherry", "Ginkgo", "Pine"]
species_weights = [20, 20, 12, 15, 12, 7, 8, 6]
health_values = ["healthy", "fair", "poor"]
health_weights = [78, 18, 4]
trees = []

for i in range(10_000):
    # Uniformly sampled within a bounding box; these are NOT real surveyed tree locations.
    longitude = random.uniform(west, east)
    latitude = random.uniform(south, north)
    species_name = random.choices(species, weights=species_weights, k=1)[0]
    trees.append({
        "id": f"tree-{i + 1:05d}",
        "x": round(longitude, 7),
        "y": round(latitude, 7),
        "species": species_name,
        "heightMeters": round(max(2.0, min(28.0, random.gauss(10.5, 4.0))), 1),
        "health": random.choices(health_values, weights=health_weights, k=1)[0],
    })

payload = {
    "metadata": {
        "name": "Synthetic Central Park Tree Dataset",
        "count": len(trees),
        "coordinates": {"x": "longitude", "y": "latitude", "crs": "WGS84 / EPSG:4326"},
        "area": "Central Park area, Manhattan, New York City",
        "synthetic": True,
        "note": "Generated sample points in a bounding box, not actual surveyed tree locations.",
    },
    "trees": trees,
}
output = Path("public/data/trees-central-park-10000.json")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")

# Verify the generated JSON and record count.
verified = json.loads(output.read_text(encoding="utf-8"))
assert len(verified["trees"]) == 10_000
print(f"Created {output}: {len(verified['trees']):,} trees, {output.stat().st_size:,} bytes")
print("Coordinate convention: x=longitude, y=latitude (WGS84 / EPSG:4326)")
print("Synthetic points; not actual surveyed tree locations.")
