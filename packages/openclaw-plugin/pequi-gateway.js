/**
 * Pequi API Gateway Plugin for OpenClaw.
 *
 * Intercepts messages about Colombian real estate and routes
 * them to the Pequi API for live data.
 */

const REAL_ESTATE_KEYWORDS = [
  'propiedad', 'propiedades', 'arriendo', 'arriendo',
  'apartamento', 'apartamentos', 'casa', 'casas',
  'barrio', 'barrios', 'ibagué', 'ibague',
  'inmueble', 'inmuebles', 'vivienda', 'viviendas',
  'lote', 'locales', 'finca',
];

function formatPropertyList(properties) {
  if (!properties || properties.length === 0) {
    return 'No se encontraron propiedades.';
  }
  return properties
    .slice(0, 5)
    .map((p, i) => {
      const price = p.listingType === 'RENT'
        ? `$${(p.monthlyRent || 0).toLocaleString()} COP/mes`
        : `$${(p.salePrice || 0).toLocaleString()} COP`;
      return `${i + 1}. ${p.name || 'Propiedad'} - ${p.bedrooms} hab, ${p.bathrooms} baños, ${p.area}m² - ${price}`;
    })
    .join('\n');
}

/**
 * Called by OpenClaw for every incoming message.
 * Return null to let other handlers process it.
 */
export async function onMessage(message) {
  const userText = (message.text || '').toLowerCase();

  const hasMatch = REAL_ESTATE_KEYWORDS.some((kw) => userText.includes(kw));
  if (!hasMatch) return null;

  try {
    const params = new URLSearchParams({ city: 'ibague', limit: '5' });

    // Detect listing type
    if (userText.includes('venta') || userText.includes('comprar')) {
      params.set('operacion', 'venta');
    } else if (userText.includes('arriendo') || userText.includes('alquilar')) {
      params.set('operacion', 'arriendo');
    }

    // Detect property type
    if (userText.includes('apartamento')) params.set('tipo', 'apartamento');
    else if (userText.includes('casa')) params.set('tipo', 'casa');

    const headers = { Accept: 'application/json' };
    const apiKey = process.env.PEQUI_API_KEY;
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    const response = await fetch(
      `https://xpequi.xyz/api/v1/properties?${params.toString()}`,
      { headers },
    );
    const data = await response.json();
    const reply = formatPropertyList(data.data || data.properties || []);

    return { reply: `🏠 Propiedades en Ibagué:\n${reply}` };
  } catch (err) {
    return { reply: 'Error al consultar propiedades. Intenta de nuevo.' };
  }
}
