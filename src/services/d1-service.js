import Config from '../config';
import logger from '../utils/logger';

class D1Service {
  init() {
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${Config.CF.ACCOUNT_ID}/d1/database/${Config.D1.DATABASE_ID}`;
    this.headers = {
      Authorization: `Bearer ${Config.CF.API_TOKEN}`,
      'Content-Type': 'application/json'
    };
    logger.info('D1 service initialized');
  }

  async query(sql, params = []) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ sql, params })
    });
    const data = await response.json();
    if (!data.success) {
      logger.error('D1 query error:', data.errors);
      throw new Error(data.errors?.[0]?.message || 'D1 query failed');
    }
    return data.result[0];
  }

  async first(sql, params = []) {
    const result = await this.query(sql, params);
    return result.results?.[0];
  }

  async all(sql, params = []) {
    const result = await this.query(sql, params);
    return result.results || [];
  }
}

export default new D1Service();
