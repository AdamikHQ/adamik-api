import { ThirdPartyProviderError } from "~/app/tools/handlers/errors";

const MAX_RETRIES = 2;
const RETRY_DELAY = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry<T>(url: string, headers: Record<string, string>, retryCount = 0): Promise<T> {
  try {
    const response = await fetch(url, { headers });

    if (response?.ok) {
      return await response.json();
    }

    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying API call (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY);
      return await fetchWithRetry(url, headers, retryCount + 1);
    } else {
      console.warn(`/!\\ Invalid response from tron explorer endpoint: ${url.toString()}:`, response);
      throw new ThirdPartyProviderError("Invalid response received from tron explorer");
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying API call (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
      await delay(RETRY_DELAY);
      return await fetchWithRetry(url, headers, retryCount + 1);
    } else {
      console.warn(`/!\\ Error received from tron explorer endpoint: ${url.toString()}:`, error);
      throw new ThirdPartyProviderError("Error received from tron explorer");
    }
  }
}

export { delay, fetchWithRetry };
