import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://mcp.etherscan.io/mcp",
  description:
    "Etherscan blockchain data: explore Ethereum addresses, transactions, tokens, and smart contracts.",
  auth: {
    credentialOwner: "app",
    getToken: async () => {
      const token = process.env.ETHERSCAN_API_KEY?.trim();
      if (!token || token === "YourApiKey" || /^Bearer\s/i.test(token)) {
        throw new Error("Set ETHERSCAN_API_KEY to the raw Etherscan API key on the server.");
      }
      return { token };
    },
  },
});
