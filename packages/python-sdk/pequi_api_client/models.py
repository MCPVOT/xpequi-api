"""
Type definitions matching the Pequi API OpenAPI spec.
These are plain dicts at runtime — the classes serve as documentation
and can be used with type checkers.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Property:
    id: str
    name: str
    address: str
    city: str
    property_type: str
    listing_type: str
    bedrooms: int
    bathrooms: int
    area: float
    sale_price: Optional[float] = None
    monthly_rent: Optional[float] = None
    description: Optional[str] = None
    images: Optional[list[str]] = None
    created_at: Optional[str] = None


@dataclass
class Barrio:
    id: str
    name: str
    estrato: int
    location: str
    description: str
    coordinates: Optional[dict] = None


@dataclass
class Benchmark:
    tipo: str
    precio_promedio_m2: float
    muestras: int
    source: str


@dataclass
class GeocodeResult:
    lat: float
    lng: float
    display_name: str


@dataclass
class Contract:
    contract_text: str
    template_used: str


@dataclass
class Payment:
    id: str
    amount: float
    currency: str
    status: str
    redirect_url: Optional[str] = None
    created_at: Optional[str] = None


@dataclass
class Complex:
    id: str
    name: str
    slug: str
    address: str
    city: str
    description: Optional[str] = None
    amenities: Optional[list[str]] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    images: Optional[list[str]] = None


@dataclass
class BuildingUnit:
    id: str
    unit_number: str
    status: str
    floor: Optional[int] = None
    monthly_rent: Optional[float] = None
    sale_price: Optional[float] = None
