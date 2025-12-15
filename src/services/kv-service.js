import Config from '../config';
import logger from '../utils/logger';

class KVService {
  init() {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${Config.CF.ACCOUNT_ID}/storage/kv/namespaces/${Config.KV.NAMESPACE_ID}`;
    this.headers = {
      Authorization: `Bearer ${Config.CF.API_TOKEN}`
    };
    logger.info('KV service initialized');
  }

  async get(key) {
    try {
      const response = await fetch(`${this.baseUrl}/values/${encodeURIComponent(key)}`, {
        headers: this.headers
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`KV get failed: ${response.status}`);
      return response.text();
    } catch (error) {
      logger.error(`KV get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, expirationTtl) {
    try {
      const url = new URL(`${this.baseUrl}/values/${encodeURIComponent(key)}`);
      if (expirationTtl) url.searchParams.set('expiration_ttl', expirationTtl);
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.headers,
        body: String(value)
      });
      return response.ok;
    } catch (error) {
      logger.error(`KV set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      const response = await fetch(`${this.baseUrl}/values/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: this.headers
      });
      return response.ok;
    } catch (error) {
      logger.error(`KV delete error for key ${key}:`, error);
      return false;
    }
  }

  async getJSON(key) {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async setJSON(key, value, expirationTtl) {
    return this.set(key, JSON.stringify(value), expirationTtl);
  }
}

export default new KVService();
