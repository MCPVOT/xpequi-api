FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY packages/mcp-server/package.json packages/mcp-server/tsconfig.json ./
COPY packages/mcp-server/src/ ./src/
RUN npm install && npm run build
EXPOSE 3100
ENV PEQUI_MCP_PORT=3100
CMD ["node", "dist/index.js"]
