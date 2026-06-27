Feature: File System Operations
  As an AI Coding Agent
  I want to read, write, create, and list directory files
  So that I can help users manage and develop their codebase local files.

  Scenario: Creating a new file
    Given the agent is running on localhost web
    And the filesystem has a valid workspace directory set
    When the agent receives a command to create "src/demo.js" with content "console.log('Antigravity')"
    Then the agent should call the tool "create_file" with path "src/demo.js"
    And the file "src/demo.js" should exist on disk
    And the file "src/demo.js" should contain "console.log('Antigravity')"

  Scenario: Reading an existing file
    Given a file named "src/demo.js" exists with content "console.log('Antigravity')"
    When the agent receives a request to read "src/demo.js"
    Then the agent should call the tool "read_file" with path "src/demo.js"
    And the response content should contain "console.log('Antigravity')"
