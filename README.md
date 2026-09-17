# mcp-carbon-interface

Carbon Interface MCP — Carbon Interface API (v1)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/carbon-interface/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Carbon Interface data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

This pack takes your own API key (`_apiKey`) — we don't front one for it, so there's no curl here that would run without it. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/estimate_electricity`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
