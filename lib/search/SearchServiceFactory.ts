import { SearchService } from './SearchService';
import { ElasticsearchService } from './ElasticsearchService';
import { MongoSearchService } from './MongoSearchService';

export class SearchServiceFactory {
  private static elasticsearchService: ElasticsearchService | null = null;
  private static mongoService: MongoSearchService | null = null;

  static async create(): Promise<SearchService> {
    const searchEngine = process.env.SEARCH_ENGINE || 'mongodb';
    const elasticsearchEnabled = process.env.ELASTICSEARCH_ENABLED === 'true';
    const fallbackEnabled = process.env.SEARCH_FALLBACK_ENABLED !== 'false'; // Default to true

    // Try Elasticsearch first if enabled
    if (elasticsearchEnabled && (searchEngine === 'elasticsearch' || searchEngine === 'hybrid')) {
      try {
        if (!this.elasticsearchService) {
          this.elasticsearchService = new ElasticsearchService();
        }

        const isHealthy = await this.elasticsearchService.isHealthy();
        if (isHealthy) {
          console.log('✅ Using Elasticsearch for search');
          return this.elasticsearchService;
        } else if (!fallbackEnabled) {
          throw new Error('Elasticsearch not available and fallback disabled');
        } else {
          console.log('⚠️ Elasticsearch not healthy, falling back to MongoDB');
        }
      } catch (error: any) {
        console.warn('⚠️ Elasticsearch unavailable, falling back to MongoDB:', error.message);
        if (!fallbackEnabled) {
          throw error;
        }
      }
    }

    // Fallback to MongoDB (your current optimized system)
    if (!this.mongoService) {
      this.mongoService = new MongoSearchService();
    }
    
    console.log('✅ Using MongoDB for search');
    return this.mongoService;
  }

  // Method to test connectivity to both services
  static async testServices(): Promise<{ mongodb: boolean; elasticsearch: boolean }> {
    let mongoHealthy = false;
    let elasticsearchHealthy = false;

    // Test MongoDB
    try {
      if (!this.mongoService) {
        this.mongoService = new MongoSearchService();
      }
      // MongoDB doesn't have a direct health check, assume it's working if we get here
      mongoHealthy = true;
    } catch (error) {
      console.error('MongoDB test failed:', error);
    }

    // Test Elasticsearch
    try {
      if (!this.elasticsearchService) {
        this.elasticsearchService = new ElasticsearchService();
      }
      elasticsearchHealthy = await this.elasticsearchService.isHealthy();
    } catch (error) {
      console.error('Elasticsearch test failed:', error);
    }

    return { mongodb: mongoHealthy, elasticsearch: elasticsearchHealthy };
  }
} 