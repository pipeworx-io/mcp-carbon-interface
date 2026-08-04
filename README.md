# mcp-carbon-interface

Carbon Interface MCP — Carbon Interface API (v1)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `estimate_electricity` | Estimate CO2 emissions from electricity usage. Returns carbon emissions in grams, kg, and metric tons. Example: estimate_electricity(500, "us", "kwh") for 500 kWh in the US. |
| `estimate_flight` | Estimate CO2 emissions from a flight. Provide number of passengers and flight legs (departure/arrival airport IATA codes). Returns per-passenger and total carbon emissions. Example: estimate_flight(2, [{"departure_airport": "SFO", "destination_airport": "JFK"}]). |
| `estimate_vehicle` | Estimate CO2 emissions from driving a vehicle. Provide distance and a vehicle model ID (from Carbon Interface). Returns carbon emissions in grams, kg, and metric tons. Example: estimate_vehicle(100, "7268a9b7-17e8-4c8d-acca-57059252afe9", "mi"). |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "carbon-interface": {
      "url": "https://gateway.pipeworx.io/carbon-interface/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Carbon Interface data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
