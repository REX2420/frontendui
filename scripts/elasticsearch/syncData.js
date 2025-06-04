const { Client } = require('@elastic/elasticsearch');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim();
      }
    }
  });
} catch (error) {
  console.log('Warning: Could not load .env file:', error.message);
}

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// Product schema definition
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function syncProducts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const indexName = `${process.env.ELASTICSEARCH_INDEX_PREFIX || 'vibecart_'}products`;
    
    // Get all products from MongoDB
    const products = await Product.find({}).lean();
    console.log(`📦 Found ${products.length} products to sync`);
    
    if (products.length === 0) {
      console.log('ℹ️ No products found to sync');
      return;
    }
    
    // Sync products to Elasticsearch
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Remove _id from the document body since it's passed as id parameter
        const { _id, ...productData } = product;
        
        await client.index({
          index: indexName,
          id: _id.toString(),
          body: {
            ...productData,
            // Ensure proper date format
            createdAt: product.createdAt || new Date(),
            updatedAt: product.updatedAt || new Date()
          }
        });
        
        console.log(`✅ Synced product ${i + 1}/${products.length}: ${product.name || 'Unnamed Product'}`);
      } catch (error) {
        console.error(`❌ Failed to sync product ${product._id}:`, error.message);
      }
    }
    
    // Refresh index to make documents searchable
    await client.indices.refresh({ index: indexName });
    
    console.log(`🎉 Successfully synced ${products.length} products to Elasticsearch`);
    
    // Verify the sync
    const countResponse = await client.count({ index: indexName });
    console.log(`📊 Elasticsearch index now contains ${countResponse.body?.count || 0} documents`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔐 MongoDB connection closed');
  }
}

async function main() {
  try {
    console.log('🔄 Starting data synchronization...');
    await syncProducts();
    console.log('✨ Data synchronization completed successfully!');
  } catch (error) {
    console.error('💥 Data synchronization failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 