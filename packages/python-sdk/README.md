# pequi-api-client

Official Python SDK for the Pequi API — Colombian real estate data for developers.

## Install

```bash
pip install pequi-api-client
```

## Quick Start

```python
from pequi_api_client import PequiClient

client = PequiClient(api_key="pk_live_your_key_here")

# Search properties
props = client.properties.search(city="ibague", tipo="apartamento", limit=5)
for p in props:
    print(f"{p['name']} - ${p['monthlyRent'] or p['salePrice']:,} COP")

# List neighborhoods
barrios = client.barrios.list()
print(f"Found {len(barrios)} neighborhoods")

# Geocode an address
location = client.geocode.geocode("Calle 10 #3-15, Ibagué")
print(f"Coordinates: {location['lat']}, {location['lng']}")
```

## Documentation

Full API reference: https://xpequi.xyz/developers/api-ref
Developer portal: https://xpequi.xyz/developers
