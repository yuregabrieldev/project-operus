#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
if (!FIGMA_TOKEN) {
  throw new Error("FIGMA_TOKEN environment variable is required");
}

// Create axios instance for Figma API
const figmaApi = axios.create({
  baseURL: "https://api.figma.com/v1",
  headers: {
    "X-Figma-Token": FIGMA_TOKEN,
  },
});

// Create an MCP server
const server = new McpServer({
  name: "figma-server",
  version: "0.1.0",
});

// Tool: Get file info
server.tool(
  "get_figma_file",
  {
    file_key: z.string().describe("The Figma file key (from the URL)"),
  },
  async ({ file_key }) => {
    try {
      const response = await figmaApi.get(`/files/${file_key}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Figma API error: ${error.response?.data?.err || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get specific nodes from a file
server.tool(
  "get_figma_nodes",
  {
    file_key: z.string().describe("The Figma file key"),
    node_ids: z.array(z.string()).describe("Array of node IDs to fetch"),
  },
  async ({ file_key, node_ids }) => {
    try {
      const ids = node_ids.join(",");
      const response = await figmaApi.get(`/files/${file_key}/nodes?ids=${ids}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Figma API error: ${error.response?.data?.err || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get file styles (colors, text styles, etc)
server.tool(
  "get_figma_styles",
  {
    file_key: z.string().describe("The Figma file key"),
  },
  async ({ file_key }) => {
    try {
      const response = await figmaApi.get(`/files/${file_key}/styles`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Figma API error: ${error.response?.data?.err || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get file components
server.tool(
  "get_figma_components",
  {
    file_key: z.string().describe("The Figma file key"),
  },
  async ({ file_key }) => {
    try {
      const response = await figmaApi.get(`/files/${file_key}/components`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Figma API error: ${error.response?.data?.err || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get images for nodes
server.tool(
  "get_figma_images",
  {
    file_key: z.string().describe("The Figma file key"),
    node_ids: z.array(z.string()).describe("Array of node IDs"),
    format: z.enum(["jpg", "png", "svg", "pdf"]).optional().describe("Image format"),
    scale: z.number().optional().describe("Scale factor"),
  },
  async ({ file_key, node_ids, format = "png", scale = 2 }) => {
    try {
      const ids = node_ids.join(",");
      const response = await figmaApi.get(
        `/images/${file_key}?ids=${ids}&format=${format}&scale=${scale}`
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Figma API error: ${error.response?.data?.err || error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Figma MCP server running on stdio");
