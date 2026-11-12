export class RateLimiter {
  private minIntervalMs: number;
  private dailyBudget: number;
  private callsUsedToday: number = 0;
  private lastCallTime: number = 0;

  constructor(minSeconds: number = 6, dailyBudget: number = 300) {
    this.minIntervalMs = minSeconds * 1000;
    this.dailyBudget = dailyBudget;
  }

  public getCallsUsed(): number {
    return this.callsUsedToday;
  }

  public setCallsUsed(calls: number): void {
    this.callsUsedToday = calls;
  }

  public canMakeCall(): boolean {
    return this.callsUsedToday < this.dailyBudget;
  }

  public async throttle(): Promise<void> {
    if (!this.canMakeCall()) {
      throw new Error(`Daily Gemini API call budget of ${this.dailyBudget} calls reached. Stopping run.`);
    }

    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
    this.callsUsedToday++;
  }

  public async executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempt = 0;
    let delay = 2000;

    while (attempt < maxRetries) {
      try {
        await this.throttle();
        return await fn();
      } catch (err: any) {
        attempt++;
        const errorMessage = String(err?.message || err);
        const isRateLimit = errorMessage.includes('429') || errorMessage.toLowerCase().includes('resource_exhausted');
        const isUnavailable = errorMessage.includes('503') || errorMessage.toLowerCase().includes('unavailable');

        if ((isRateLimit || isUnavailable) && attempt < maxRetries) {
          console.warn(`[RateLimiter] Rate limit or service unavailable (attempt ${attempt}/${maxRetries}). Retrying in ${delay / 1000}s...`);
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2; // exponential backoff: 2s -> 4s -> 8s
        } else {
          throw err;
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts.`);
  }
}

