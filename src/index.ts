interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Carbon Interface MCP — Carbon Interface API (v1)
 *
 * BYO key: requires a Carbon Interface API key from https://www.carboninterface.com/
 * Passed via _apiKey parameter.
 *
 * Tools:
 * - estimate_electricity: estimate CO2 emissions from electricity usage
 * - estimate_flight: estimate CO2 emissions from a flight
 * - estimate_vehicle: estimate CO2 emissions from vehicle travel
 */


const BASE_URL = 'https://www.carboninterface.com/api/v1';

// --- Helpers ---

function extractKey(args: Record<string, unknown>): string {
  const key = args._apiKey as string;
  delete args._apiKey;
  if (!key) throw new Error('Carbon Interface API key required. Get one at https://www.carboninterface.com/ and pass via _apiKey.');
  return key;
}

async function ciPost(apiKey: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/estimates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Carbon Interface API error (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { data?: { attributes?: Record<string, unknown> } };
  return data.data?.attributes ?? data;
}

// --- Raw API response type ---

type EstimateAttributes = {
  country?: string | null;
  state?: string | null;
  electricity_unit?: string | null;
  electricity_value?: number | null;
  estimated_at?: string | null;
  carbon_g?: number | null;
  carbon_lb?: number | null;
  carbon_kg?: number | null;
  carbon_mt?: number | null;
  distance_unit?: string | null;
  distance_value?: number | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_model_id?: string | null;
  passengers?: number | null;
  legs?: { departure_airport?: string; destination_airport?: string; class?: string }[] | null;
};

// --- Tool definitions ---

const tools: McpToolExport['tools'] = [
  {
    name: 'estimate_electricity',
    description:
      'Estimate CO2 emissions from electricity usage. Returns carbon emissions in grams, kg, and metric tons. Example: estimate_electricity(500, "us", "kwh") for 500 kWh in the US.',
    inputSchema: {
      type: 'object',
      properties: {
        _apiKey: { type: 'string', description: 'Carbon Interface API key' },
        value: { type: 'number', description: 'Amount of electricity consumed (e.g., 500)' },
        country: { type: 'string', description: 'ISO 3166-1 alpha-2 country code (e.g., "us", "gb", "de")' },
        unit: { type: 'string', description: 'Unit of electricity: "kwh" or "mwh" (default: "kwh")' },
        state: { type: 'string', description: 'US state code for more precise estimate (e.g., "ca", "ny"). Only for US.' },
      },
      required: ['_apiKey', 'value', 'country'],
    },
  },
  {
    name: 'estimate_flight',
    description:
      'Estimate CO2 emissions from a flight. Provide number of passengers and flight legs (departure/arrival airport IATA codes). Returns per-passenger and total carbon emissions. Example: estimate_flight(2, [{"departure_airport": "SFO", "destination_airport": "JFK"}]).',
    inputSchema: {
      type: 'object',
      properties: {
        _apiKey: { type: 'string', description: 'Carbon Interface API key' },
        passengers: { type: 'number', description: 'Number of passengers (e.g., 2)' },
        legs: {
          type: 'array',
          description: 'Array of flight legs with IATA airport codes',
          items: {
            type: 'object',
            properties: {
              departure_airport: { type: 'string', description: 'Departure airport IATA code (e.g., "SFO")' },
              destination_airport: { type: 'string', description: 'Arrival airport IATA code (e.g., "JFK")' },
              cabin_class: { type: 'string', description: 'Cabin class: "economy", "premium", or "business" (optional)' },
            },
            required: ['departure_airport', 'destination_airport'],
          },
        },
      },
      required: ['_apiKey', 'passengers', 'legs'],
    },
  },
  {
    name: 'estimate_vehicle',
    description:
      'Estimate CO2 emissions from driving a vehicle. Provide distance and a vehicle model ID (from Carbon Interface). Returns carbon emissions in grams, kg, and metric tons. Example: estimate_vehicle(100, "7268a9b7-17e8-4c8d-acca-57059252afe9", "mi").',
    inputSchema: {
      type: 'object',
      properties: {
        _apiKey: { type: 'string', description: 'Carbon Interface API key' },
        distance: { type: 'number', description: 'Distance traveled (e.g., 100)' },
        vehicle_model_id: { type: 'string', description: 'Carbon Interface vehicle model UUID' },
        unit: { type: 'string', description: 'Distance unit: "mi" or "km" (default: "mi")' },
      },
      required: ['_apiKey', 'distance', 'vehicle_model_id'],
    },
  },
];

// --- callTool dispatcher ---

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const key = extractKey(args);

  switch (name) {
    case 'estimate_electricity':
      return estimateElectricity(
        key,
        args.value as number,
        args.country as string,
        (args.unit as string) ?? 'kwh',
        args.state as string | undefined,
      );
    case 'estimate_flight':
      return estimateFlight(
        key,
        args.passengers as number,
        args.legs as { departure_airport: string; destination_airport: string; cabin_class?: string }[],
      );
    case 'estimate_vehicle':
      return estimateVehicle(
        key,
        args.distance as number,
        args.vehicle_model_id as string,
        (args.unit as string) ?? 'mi',
      );
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- Tool implementations ---

async function estimateElectricity(apiKey: string, value: number, country: string, unit: string, state?: string) {
  const body: Record<string, unknown> = {
    type: 'electricity',
    electricity_unit: unit,
    electricity_value: value,
    country: country.toLowerCase(),
  };
  if (state) body.state = state.toLowerCase();

  const attrs = (await ciPost(apiKey, body)) as EstimateAttributes;

  return {
    electricity_value: attrs.electricity_value ?? value,
    electricity_unit: attrs.electricity_unit ?? unit,
    country: attrs.country ?? country,
    state: attrs.state ?? state ?? null,
    estimated_at: attrs.estimated_at ?? null,
    carbon_g: attrs.carbon_g ?? null,
    carbon_kg: attrs.carbon_kg ?? null,
    carbon_mt: attrs.carbon_mt ?? null,
    carbon_lb: attrs.carbon_lb ?? null,
  };
}

async function estimateFlight(
  apiKey: string,
  passengers: number,
  legs: { departure_airport: string; destination_airport: string; cabin_class?: string }[],
) {
  const body = {
    type: 'flight',
    passengers,
    legs: legs.map((l) => ({
      departure_airport: l.departure_airport.toUpperCase(),
      destination_airport: l.destination_airport.toUpperCase(),
      ...(l.cabin_class ? { cabin_class: l.cabin_class } : {}),
    })),
  };

  const attrs = (await ciPost(apiKey, body)) as EstimateAttributes;

  return {
    passengers: attrs.passengers ?? passengers,
    legs: (attrs.legs ?? []).map((l) => ({
      departure_airport: l.departure_airport ?? null,
      destination_airport: l.destination_airport ?? null,
      cabin_class: l.class ?? null,
    })),
    estimated_at: attrs.estimated_at ?? null,
    carbon_g: attrs.carbon_g ?? null,
    carbon_kg: attrs.carbon_kg ?? null,
    carbon_mt: attrs.carbon_mt ?? null,
    carbon_lb: attrs.carbon_lb ?? null,
  };
}

async function estimateVehicle(apiKey: string, distance: number, vehicleModelId: string, unit: string) {
  const body = {
    type: 'vehicle',
    distance_unit: unit,
    distance_value: distance,
    vehicle_model_id: vehicleModelId,
  };

  const attrs = (await ciPost(apiKey, body)) as EstimateAttributes;

  return {
    distance_value: attrs.distance_value ?? distance,
    distance_unit: attrs.distance_unit ?? unit,
    vehicle_make: attrs.vehicle_make ?? null,
    vehicle_model: attrs.vehicle_model ?? null,
    vehicle_year: attrs.vehicle_year ?? null,
    estimated_at: attrs.estimated_at ?? null,
    carbon_g: attrs.carbon_g ?? null,
    carbon_kg: attrs.carbon_kg ?? null,
    carbon_mt: attrs.carbon_mt ?? null,
    carbon_lb: attrs.carbon_lb ?? null,
  };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
