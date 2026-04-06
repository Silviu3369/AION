import { Type } from '@google/genai';
import { AionTool } from '../registry';
import { useUIStore } from '../../store/useUIStore';
import { fetchCrypto } from '../../services/apiServices';

export const getCryptoPriceTool: AionTool = {
  name: "getCryptoPrice",
  declaration: {
    name: "getCryptoPrice",
    description: "Get the current price and 24h change for a cryptocurrency.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        coinId: { type: Type.STRING, description: "The CoinGecko ID of the coin (e.g., 'bitcoin', 'ethereum', 'elrond-erd-2')" }
      },
      required: ["coinId"]
    }
  },
  execute: async (args) => {
    const { coinId } = args;
    const res = await fetchCrypto(coinId);
    if (res.success) {
      useUIStore.getState().setLeftPanelContent({ type: 'crypto', title: res.title, data: res.data });
    } else {
      useUIStore.getState().setLeftPanelContent({ type: 'crypto', title: `Crypto: ${coinId}`, data: { error: res.error } });
    }
    return { result: `Fetching and displaying crypto price for: ${coinId}` };
  }
};
