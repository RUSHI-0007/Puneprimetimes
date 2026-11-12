import { GoogleGenAI } from '@google/genai';
import { RateLimiter } from './rate-limiter';

export class GeminiClient {
  private ai: GoogleGenAI | null = null;
  private modelName: string;
  private rateLimiter: RateLimiter;
  private groundingSupported: boolean = true;

  constructor(rateLimiter: RateLimiter) {
    this.rateLimiter = rateLimiter;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.ai && process.env.GEMINI_API_KEY);
  }

  public getModelName(): string {
    return this.modelName;
  }

  public getCallsUsed(): number {
    return this.rateLimiter.getCallsUsed();
  }

  /**
   * Generates content with rate limiting and exponential backoff retry.
   * If grounding/tools fail (e.g. unsupported on free tier key), falls back immediately to plain prompt.
   */
  public async generateText(prompt: string, options: { withGrounding?: boolean } = {}): Promise<{
    text: string;
    grounded: boolean;
  }> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }

    const { withGrounding = false } = options;

    if (withGrounding && this.groundingSupported) {
      try {
        await this.rateLimiter.throttle();
        const result = await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });

        const text = result.text || '';
        if (text) {
          return { text, grounded: true };
        }
      } catch (err: any) {
        // Free tier or ungrounded key: disable search tool for remaining calls to prevent quota burning
        this.groundingSupported = false;
        console.warn(`[GeminiClient] Google Grounding tool not available on this API key. Using verified RSS summaries directly.`);
      }
    }

    // Standard call without grounding tool
    const result = await this.rateLimiter.executeWithRetry(async () => {
      return await this.ai!.models.generateContent({
        model: this.modelName,
        contents: prompt
      });
    });

    const text = result.text || '';
    return { text, grounded: false };
  }
}

