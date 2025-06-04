const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

const indexPrefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'vibecart_';

async function setupProductIndex() {
  const indexName = `${indexPrefix}products`;
  
  const mapping = {
    mappings: {
      properties: {
        name: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        description: { type: 'text' },
        longDescription: { type: 'text' },
        brand: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        category: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword' }
          }
        },
        featured: { type: 'boolean' },
        rating: { type: 'float' },
        numReviews: { type: 'integer' },
        createdAt: { type: 'date' },
        subProducts: {
          type: 'nested',
          properties: {
            colors: {
              type: 'nested',
              properties: {
                color: { type: 'keyword' },
                images: { type: 'keyword' }
              }
            },
            sizes: {
              type: 'nested', 
              properties: {
                size: { type: 'keyword' },
                qty: { type: 'integer' },
                price: { type: 'float' }
              }
            },
            discount: { type: 'float' }
          }
        },
        tags: { type: 'keyword' }
      }
    },
    settings: {
      analysis: {
        analyzer: {
          product_analyzer: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'stop', 'snowball']
          }
        }
      }
    }
  };

  try {
    // Delete index if exists
    await client.indices.delete({ index: indexName }).catch(() => {});
    
    // Create index with v8 API
    await client.indices.create({
      index: indexName,
      body: mapping
    });
    
    console.log(`✅ Created index: ${indexName}`);
  } catch (error) {
    console.error('❌ Error creating index:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Setting up Elasticsearch indexes...');
    await setupProductIndex();
    console.log('🎉 Elasticsearch indexes setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 