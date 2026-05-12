import { PequiClient } from '@MCPVOT/api-client';

const client = new PequiClient({ apiKey: process.env.PEQUI_API_KEY || '' });

/**
 * OpenCode plugin for Pequi API.
 * Exposes Colombian real estate data as native OpenCode tools.
 */
export const plugin = {
  name: 'pequi-api',
  description: 'Colombian real estate data — properties, barrios, benchmarks, geocode',
  tools: {
    searchProperties: client.searchProperties.bind(client),
    getBarrios: client.getBarrios.bind(client),
    getBenchmarks: client.getBenchmarks.bind(client),
    geocode: client.geocode.bind(client),
  },
};

export default plugin;
