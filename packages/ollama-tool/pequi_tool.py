"""
Pequi API tool for Ollama — Colombian real estate data.

Usage:
  Register this script as a custom tool in Ollama, then any
  locally-run model can query Pequi's real estate API.

Example:
  from pequi_tool import search_properties
  results = search_properties(city="ibague", tipo="apartamento", precio_max=1000000)
"""

import os
import requests
from typing import Optional

PEQUI_API_KEY = os.getenv("PEQUI_API_KEY", "")
BASE_URL = "https://xpequi.xyz/api/v1"


def search_properties(
    city: str = "ibague",
    tipo: Optional[str] = None,
    precio_min: Optional[int] = None,
    precio_max: Optional[int] = None,
    cuartos: Optional[int] = None,
    limit: int = 10,
) -> list:
    """
    Search properties in Colombia.

    Args:
        city: City name (default: ibague)
        tipo: Property type (apartamento, casa, local, lote)
        precio_min: Minimum price in COP
        precio_max: Maximum price in COP
        cuartos: Minimum number of bedrooms
        limit: Results limit (max 100)

    Returns:
        List of matching properties
    """
    headers = {"Accept": "application/json"}
    if PEQUI_API_KEY:
        headers["Authorization"] = f"Bearer {PEQUI_API_KEY}"

    params = {
        "city": city,
        "tipo": tipo or "",
        "precio_min": str(precio_min) if precio_min else "",
        "precio_max": str(precio_max) if precio_max else "",
        "cuartos": str(cuartos) if cuartos else "",
        "limit": str(limit),
    }
    # Remove empty params
    params = {k: v for k, v in params.items() if v}

    resp = requests.get(f"{BASE_URL}/properties", headers=headers, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", [])


def get_barrios(city: str = "ibague") -> list:
    """List neighborhoods with estratos and coordinates."""
    headers = {"Accept": "application/json"}
    if PEQUI_API_KEY:
        headers["Authorization"] = f"Bearer {PEQUI_API_KEY}"
    resp = requests.get(f"{BASE_URL}/barrios", headers=headers, params={"city": city}, timeout=10)
    return resp.json().get("data", [])


def get_benchmarks(barrio: Optional[str] = None, tipo: Optional[str] = None) -> list:
    """Get price per m² benchmarks."""
    params = {}
    if barrio:
        params["barrio"] = barrio
    if tipo:
        params["tipo"] = tipo
    resp = requests.get(f"{BASE_URL}/benchmarks", params=params, timeout=10)
    return resp.json().get("data", [])
