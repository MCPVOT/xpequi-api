"""
Pequi API tool for Ollama — Colombian real estate data.
Uses the official pequi-api-client SDK.

Usage:
    pip install pequi-api-client
    export PEQUI_API_KEY=pk_live_your_key
    python -c "from pequi_tool import search_properties; print(search_properties(city='ibague'))"
"""

import os
from typing import Optional

from pequi_api_client import PequiClient

_client: Optional[PequiClient] = None


def _get_client() -> PequiClient:
    global _client
    if _client is None:
        _client = PequiClient(api_key=os.getenv("PEQUI_API_KEY"))
    return _client


def search_properties(
    city: str = "ibague",
    tipo: Optional[str] = None,
    precio_min: Optional[int] = None,
    precio_max: Optional[int] = None,
    cuartos: Optional[int] = None,
    limit: int = 10,
) -> list:
    """Search properties in Colombia using the official Pequi SDK."""
    return _get_client().properties.search(
        city=city, tipo=tipo,
        precio_min=precio_min, precio_max=precio_max,
        cuartos=cuartos, limit=limit,
    )


def get_barrios(city: str = "ibague") -> list:
    """List neighborhoods with estratos and coordinates."""
    return _get_client().barrios.list(city=city)


def get_benchmarks(barrio: Optional[str] = None, tipo: Optional[str] = None) -> list:
    """Get price per m² benchmarks."""
    return _get_client().benchmarks.list(barrio=barrio, tipo=tipo)
