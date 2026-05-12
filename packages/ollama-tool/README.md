"""
Pequi API — Ollama Custom Tool

Register this tool with Ollama to let local models query
Colombian real estate data from Pequi.

## Setup

1. Install dependencies:
   pip install -r requirements.txt

2. Set your API key (optional):
   export PEQUI_API_KEY=pk_live_your_key_here

3. Register with Ollama by adding to your Modelfile:
   FROM llama3.2
   TOOL pequi_tool.search_properties
   TOOL pequi_tool.get_barrios
   TOOL pequi_tool.get_benchmarks

4. Run:
   ollama create pequi-agent -f Modelfile
   ollama run pequi-agent

## Available Functions

- search_properties(city, tipo, precio_min, precio_max, cuartos, limit)
- get_barrios(city)
- get_benchmarks(barrio, tipo)
"""
