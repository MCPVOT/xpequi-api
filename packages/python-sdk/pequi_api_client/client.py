"""
Pequi API Client — fluent interface for Colombian real estate data.

Usage:
    from pequi_api_client import PequiClient

    client = PequiClient(api_key="pk_live_...")

    # Search properties
    props = client.properties.search(city="ibague", limit=5)

    # Get UVR / IPC
    uvr = client.finance.get_uvr()
    ipc = client.finance.get_ipc()

    # AVM valuation
    avm = client.avm.estimate(area=80, bedrooms=3, bathrooms=2,
                               property_type="APARTMENT", barrio="centro", city="ibague")
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from typing import Any, Optional


class PequiApiError(Exception):
    """Structured API error from Pequi."""

    def __init__(self, status: int, code: str, message: str,
                 recoverable: bool = False, retry_after: Optional[int] = None,
                 request_id: Optional[str] = None,
                 details: Optional[dict] = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.recoverable = recoverable
        self.retry_after = retry_after
        self.request_id = request_id
        self.details = details or {}

    @classmethod
    def from_response(cls, resp) -> "PequiApiError":
        try:
            body = json.loads(resp.read().decode())
        except Exception:
            body = {}
        return cls(
            status=resp.status,
            code=body.get("code", "API_ERROR"),
            message=body.get("message", str(resp.reason)),
            recoverable=body.get("recoverable", False),
            retry_after=body.get("retryAfter"),
            request_id=body.get("requestId"),
            details=body,
        )


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
        return data.get("data", data.get("properties", data))


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

    def list(self, barrio: Optional[str] = None,
             tipo: Optional[str] = None,
             estrato: Optional[int] = None) -> list[dict]:
        params: dict[str, Any] = {}
        if barrio:
            params["barrio"] = barrio
        if tipo:
            params["tipo"] = tipo
        if estrato is not None:
            params["estrato"] = str(estrato)
        data = self._client._get("/benchmarks", params)
        return data.get("data", data)


class _GeocodeAPI:
    """Wrapper around GET /api/v1/geocode"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def geocode(self, address: str) -> dict:
        data = self._client._get("/geocode", {"address": address})
        return data.get("data", data)


class _AVMAPI:
    """Wrapper around POST /api/v1/avm"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def estimate(
        self,
        area: float,
        bedrooms: int,
        bathrooms: int,
        property_type: str,
        barrio: str,
        city: str,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
    ) -> dict:
        body = {
            "area": area, "bedrooms": bedrooms, "bathrooms": bathrooms,
            "propertyType": property_type.upper(), "barrio": barrio, "city": city,
        }
        if lat is not None:
            body["lat"] = lat
        if lng is not None:
            body["lng"] = lng
        data = self._client._post("/avm", body)
        return data.get("data", data)

    def bulk(self, properties: list[dict],
             idempotency_key: Optional[str] = None) -> dict:
        body = {"properties": properties}
        extra_headers = {}
        if idempotency_key:
            extra_headers["x-idempotency-key"] = idempotency_key
        data = self._client._post("/avm/bulk", body, extra_headers)
        return data.get("data", data)


class _FinanceAPI:
    """Wrapper around UVR, IPC, and rent-increase endpoints"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def get_uvr(self) -> dict:
        data = self._client._get("/uvr")
        return data.get("data", data)

    def get_ipc(self) -> dict:
        data = self._client._get("/ipc")
        return data.get("data", data)

    def calculate_rent_increase(
        self,
        current_rent: float,
        start_date: str,
        months: int = 12,
    ) -> dict:
        body = {"currentRent": current_rent, "startDate": start_date, "months": months}
        data = self._client._post("/rent-increase", body)
        return data.get("data", data)


class _CreditsAPI:
    """Wrapper around c402 prepaid credits endpoints"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def balance(self) -> dict:
        data = self._client._get("/credits")
        return data.get("data", data)

    def purchase(self, calls: int) -> dict:
        data = self._client._post("/credits/purchase", {"calls": calls})
        return data.get("data", data)

    def subscription_checkout(self, tier: str) -> dict:
        data = self._client._post("/subscriptions/api-checkout", {"tier": tier})
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

    def send(self, message: str, session_id: Optional[str] = None) -> dict:
        body: dict[str, Any] = {"message": message}
        if session_id:
            body["sessionId"] = session_id
        data = self._client._post("/chat", body)
        return data.get("data", data)


class _UploadAPI:
    """Wrapper around POST /api/v1/upload"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def upload(self, filepath: str) -> dict:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        import io
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
            result = json.loads(resp.read().decode())
            return result.get("data", result)


class _BankVerificationAPI:
    """Wrapper around POST /api/v1/bank-verification (Prometeo Open Finance)"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def verify(
        self,
        bank_code: str,
        account_number: str,
        account_type: str,
        document_number: str,
        document_type: str,
    ) -> dict:
        body = {
            "bankCode": bank_code,
            "accountNumber": account_number,
            "accountType": account_type,
            "documentNumber": document_number,
            "documentType": document_type,
        }
        data = self._client._post("/bank-verification", body)
        return data.get("data", data)


class _MonitoringAPI:
    """Wrapper around /api/v1/monitoring/* endpoints"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def usage(self) -> dict:
        data = self._client._get("/monitoring/usage")
        return data.get("data", data)

    def latency(self, quantile: str = "p95") -> list[dict]:
        data = self._client._get("/monitoring/latency", {"quantile": quantile})
        return data.get("data", data)

    def errors(self) -> list[dict]:
        data = self._client._get("/monitoring/errors")
        return data.get("data", data)

    def uptime(self, window: str = "24h") -> dict:
        data = self._client._get("/monitoring/uptime", {"window": window})
        return data.get("data", data)


class _WebhooksAPI:
    """Wrapper around /api/v1/webhooks/endpoints"""

    def __init__(self, client: "PequiClient"):
        self._client = client

    def list(self) -> list[dict]:
        data = self._client._get("/webhooks/endpoints")
        return data.get("data", data)

    def create(self, url: str, events: list[str]) -> dict:
        data = self._client._post("/webhooks/endpoints", {"url": url, "events": events})
        return data.get("data", data)

    def delete(self, webhook_id: str) -> dict:
        return self._client._delete(f"/webhooks/endpoints/{webhook_id}")

    def test(self, webhook_id: str) -> dict:
        data = self._client._post(f"/webhooks/endpoints/{webhook_id}/test", {})
        return data.get("data", data)


class PequiClient:
    """
    Fluent client for the Pequi API (Colombian real estate data).

    Args:
        api_key: Your API key from https://xpequi.xyz/developers
        base_url: API base URL (default: https://xpequi.xyz/api/v1)

    Usage:
        client = PequiClient(api_key="pk_live_...")
        props = client.properties.search(city="ibague", limit=5)
        uvr = client.finance.get_uvr()
        avm = client.avm.estimate(area=80, bedrooms=3, ...)
    """

    def __init__(self, api_key: Optional[str] = None,
                 base_url: str = "https://xpequi.xyz/api/v1"):
        self._api_key = api_key or os.getenv("PEQUI_API_KEY", "")
        self._base_url = base_url.rstrip("/")

        # Fluent API endpoints
        self.properties = _PropertiesAPI(self)
        self.barrios = _BarriosAPI(self)
        self.benchmarks = _BenchmarksAPI(self)
        self.geocode = _GeocodeAPI(self)
        self.avm = _AVMAPI(self)
        self.finance = _FinanceAPI(self)
        self.credits = _CreditsAPI(self)
        self.contracts = _ContractsAPI(self)
        self.payments = _PaymentsAPI(self)
        self.complexes = _ComplexesAPI(self)
        self.visits = _VisitsAPI(self)
        self.chat = _ChatAPI(self)
        self.upload = _UploadAPI(self)
        self.bank_verification = _BankVerificationAPI(self)
        self.monitoring = _MonitoringAPI(self)
        self.webhooks = _WebhooksAPI(self)

    def _request(self, method: str, path: str,
                 data: Optional[bytes] = None,
                 headers: Optional[dict[str, str]] = None,
                 timeout: int = 30) -> dict:
        url = f"{self._base_url}{path}"
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        if headers:
            for k, v in headers.items():
                req.add_header(k, v)
        if self._api_key:
            req.add_header("Authorization", f"Bearer {self._api_key}")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            raise PequiApiError.from_response(e)

    def _get(self, path: str,
             params: Optional[dict] = None) -> dict:
        url = path
        if params:
            filtered = {k: v for k, v in params.items()
                        if v is not None and v != ""}
            if filtered:
                url += "?" + urllib.parse.urlencode(filtered)
        return self._request("GET", url)

    def _post(self, path: str, body: dict,
              extra_headers: Optional[dict[str, str]] = None) -> dict:
        data = json.dumps(body).encode()
        headers = {"Content-Type": "application/json"}
        if extra_headers:
            headers.update(extra_headers)
        return self._request("POST", path, data=data, headers=headers)

    def _delete(self, path: str) -> dict:
        return self._request("DELETE", path)
