Feature: Model Context Protocol (MCP) Integration
  As an AI Coding Agent
  I want to register, monitor, and execute tools from external MCP servers
  So that I can leverage specialized external tools and databases dynamically.

  Scenario: Registering a local MCP server
    Given the backend is active on port 3747
    When a client registers an MCP server with ID "google-developer-knowledge"
    And command "npx" and arguments "-y, @google/mcp-server-developer-knowledge"
    Then the server config should be saved in "./data/mcp/config.json"
    And the server process should be spawned in stdio transport mode
    And the handshake "initialize" should complete successfully
    And the tools list should be populated.

  Scenario: Executing an MCP tool dynamically
    Given a registered MCP server "google-developer-knowledge" is active and connected
    And it exposes a tool named "search"
    When the user asks to query developer documentation for "Gemini SDK"
    Then the agent should call the dynamic tool "mcp_google-developer-knowledge_search"
    And the tool results should be fed back to the model context.
