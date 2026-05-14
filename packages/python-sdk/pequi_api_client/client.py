"""
Pequi API Client — fluent interface for Colombian real estate data.

Usage:
    from pequi_api_client import PequiClient

    client = PequiClient(api_key="pk_live_...")

    # Search properties
    props = client.properties.search(city="ibague", limit=5)

    # List neighborhoods
    barrios = client.barrios.list(city="ibague")

    # Get price benchmarks
    benchmarks = client.benchmarks.list(barrio="centro")
"""

from __future__ import annotations

import os
from typing import Any, Optional


class _PropertiesAPI:
    """Wrapper around GET /api/v1/properties"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def search(
        self,
        city: str = "ibague",
        tipo: Optional[str] = None,
        barrio: Optional[str] = None,
        estrato: Optional[int] = None,
        precio_min: Optional[int] = None,
        precio_max: Optional[int] = None,
        cuartos: Optional[int] = None,
        banos: Optional[int] = None,
        operacion: Optional[str] = None,
        limit: int = 20,
        page: int = 1,
    ) -> list[dict]:
        params = {
            "city": city, "tipo": tipo, "barrio": barrio, "estrato": estrato,
            "precio_min": precio_min, "precio_max": precio_max,
            "cuartos": cuartos, "banos": banos, "operacion": operacion,
            "limit": str(limit), "page": str(page),
        }
        data = self._client._get("/properties", params)
        return data.get("data", data)


class _BarriosAPI:
    """Wrapper around GET /api/v1/barrios"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def list(self, city: str = "ibague") -> list[dict]:
        data = self._client._get("/barrios", {"city": city})
        return data.get("data", data)


class _BenchmarksAPI:
    """Wrapper around GET /api/v1/benchmarks"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def list(self, barrio: Optional[str] = None, tipo: Optional[str] = None) -> list[dict]:
        params = {}
        if barrio: params["barrio"] = barrio
        if tipo: params["tipo"] = tipo
        data = self._client._get("/benchmarks", params)
        return data.get("data", data)


class _GeocodeAPI:
    """Wrapper around GET /api/v1/geocode"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def geocode(self, address: str) -> dict:
        data = self._client._get("/geocode", {"address": address})
        return data.get("data", data)


class _ContractsAPI:
    """Wrapper around POST /api/v1/contracts"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def generate(
        self,
        landlord_name: str,
        landlord_cedula: str,
        tenant_name: str,
        tenant_cedula: str,
        property_address: str,
        rent_amount: float,
        start_date: str,
        end_date: str,
        **kwargs,
    ) -> dict:
        body = {
            "landlordName": landlord_name,
            "landlordCedula": landlord_cedula,
            "tenantName": tenant_name,
            "tenantCedula": tenant_cedula,
            "propertyAddress": property_address,
            "rentAmount": rent_amount,
            "startDate": start_date,
            "endDate": end_date,
            **kwargs,
        }
        data = self._client._post("/contracts", body)
        return data.get("data", data)


class _PaymentsAPI:
    """Wrapper around POST /api/v1/payments and GET /api/v1/payments/{id}"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def create(self, user_id: str, amount: float, **kwargs) -> dict:
        body = {"userId": user_id, "amount": amount, **kwargs}
        data = self._client._post("/payments", body)
        return data.get("data", data)

    def get_status(self, payment_id: str) -> dict:
        data = self._client._get(f"/payments/{payment_id}")
        return data.get("data", data)


class _ComplexesAPI:
    """Wrapper around GET /api/v1/complexes/*"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def list(self) -> list[dict]:
        data = self._client._get("/complexes")
        return data.get("data", data)

    def get(self, slug: str) -> dict:
        data = self._client._get(f"/complexes/{slug}")
        return data.get("data", data)

    def get_units(self, slug: str) -> list[dict]:
        data = self._client._get(f"/complexes/{slug}/units")
        return data.get("data", data)


class _VisitsAPI:
    """Wrapper around GET/POST /api/v1/visits"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def list(self) -> list[dict]:
        data = self._client._get("/visits")
        return data.get("data", data)

    def schedule(self, property_id: str, date: str, notes: str = "") -> dict:
        return self._client._post("/visits", {
            "propertyId": property_id, "date": date, "notes": notes,
        })


class _ChatAPI:
    """Wrapper around POST /api/v1/chat"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def send(self, message: str) -> dict:
        data = self._client._post("/chat", {"message": message})
        return data.get("data", data)


class _UploadAPI:
    """Wrapper around POST /api/v1/upload"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def upload(self, filepath: str) -> dict:
        import os
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        import io
        import urllib.request
        filename = os.path.basename(filepath)
        boundary = "----PequiFormBoundary" + os.urandom(16).hex()
        body = io.BytesIO()
        body.write(f"--{boundary}\r\n".encode())
        body.write(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode())
        body.write(b"Content-Type: application/octet-stream\r\n\r\n")
        with open(filepath, "rb") as f:
            body.write(f.read())
        body.write(f"\r\n--{boundary}--\r\n".encode())
        data = body.getvalue()
        url = f"{self._client._base_url}/upload"
        req = urllib.request.Request(url, data=data)
        req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
        req.add_header("Accept", "application/json")
        if self._client._api_key:
            req.add_header("Authorization", f"Bearer {self._client._api_key}")
        with urllib.request.urlopen(req, timeout=60) as resp:
            import json
            result = json.loads(resp.read().decode())
            return result.get("data", result)


class PequiClient:
    """
    Fluent client for the Pequi API (Colombian real estate data).

    Args:
        api_key: Your API key from https://xpequi.xyz/developers
        base_url: API base URL (default: https://xpequi.xyz/api/v1)

    Usage:
        client = PequiClient(api_key="pk_live_...")
        props = client.properties.search(city="ibague", limit=5)
    """

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://xpequi.xyz/api/v1"):
        self._api_key = api_key or os.getenv("PEQUI_API_KEY", "")
        self._base_url = base_url.rstrip("/")

        # Fluent API endpoints
        self.properties = _PropertiesAPI(self)
        self.barrios = _BarriosAPI(self)
        self.benchmarks = _BenchmarksAPI(self)
        self.geocode = _GeocodeAPI(self)
        self.contracts = _ContractsAPI(self)
        self.payments = _PaymentsAPI(self)
        self.complexes = _ComplexesAPI(self)
        self.visits = _VisitsAPI(self)
        self.chat = _ChatAPI(self)
        self.upload = _UploadAPI(self)

    def _get(self, path: str, params: Optional[dict] = None) -> dict:
        import urllib.request
        import urllib.parse

        url = f"{self._base_url}{path}"
        if params:
            filtered = {k: v for k, v in params.items() if v is not None and v != ""}
            url += "?" + urllib.parse.urlencode(filtered)

        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        if self._api_key:
            req.add_header("Authorization", f"Bearer {self._api_key}")

        with urllib.request.urlopen(req, timeout=30) as resp:
            import json
            return json.loads(resp.read().decode())

    def _post(self, path: str, body: dict) -> dict:
        import json
        import urllib.request

        url = f"{self._base_url}{path}"
        data = json.dumps(body).encode()

        req = urllib.request.Request(
            url, data=data,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        if self._api_key:
            req.add_header("Authorization", f"Bearer {self._api_key}")

        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
