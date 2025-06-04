const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually load environment variables from .env
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
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
    console.warn('Warning: Could not load .env file:', error.message);
  }
}

// Load environment variables
loadEnvVars();

const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
const DB_NAME = 'vibecart';

async function createIndexes() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Create indexes for Products collection
    console.log('🔍 Creating indexes for Products collection...');
    const productsCollection = db.collection('products');
    
    try {
      // Text search index for products
      await productsCollection.createIndex(
        { 
          name: 'text', 
          description: 'text', 
          brand: 'text',
          longDescription: 'text'
        },
        {
          weights: {
            name: 10,        // Highest priority for product name
            brand: 5,        // Medium priority for brand
            description: 3,  // Lower priority for description
            longDescription: 1 // Lowest priority for long description
          },
          name: 'product_text_search'
        }
      );
      console.log('✅ Product text search index created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Product text search index already exists');
      } else {
        throw error;
      }
    }

    // Other product indexes
    try {
      await productsCollection.createIndex({ category: 1, 'subProducts.sizes.price': 1 });
      await productsCollection.createIndex({ featured: -1, createdAt: -1 });
      await productsCollection.createIndex({ rating: -1, numReviews: -1 });
      await productsCollection.createIndex({ 'subProducts.sizes.qty': 1 });
      await productsCollection.createIndex({ 'subProducts.discount': 1 });
      console.log('✅ Additional product indexes created');
    } catch (error) {
      console.log('ℹ️ Some product indexes may already exist:', error.message);
    }

    // Create indexes for Blogs collection
    console.log('🔍 Creating indexes for Blogs collection...');
    const blogsCollection = db.collection('blogs');
    
    try {
      // Text search index for blogs
      await blogsCollection.createIndex(
        { 
          title: 'text', 
          content: 'text', 
          excerpt: 'text',
          tags: 'text',
          authorName: 'text',
          seoTitle: 'text',
          seoDescription: 'text'
        },
        {
          weights: {
            title: 10,        // Highest priority for blog title
            excerpt: 8,       // High priority for excerpt
            tags: 6,          // Medium-high priority for tags
            authorName: 5,    // Medium priority for author
            seoTitle: 4,      // Medium priority for SEO title
            content: 3,       // Lower priority for content
            seoDescription: 2 // Lower priority for SEO description
          },
          name: 'blog_text_search'
        }
      );
      console.log('✅ Blog text search index created');
    } catch (error) {
      if (error.code === 85) {
        console.log('ℹ️ Blog text search index already exists');
      } else {
        throw error;
      }
    }

    // Other blog indexes
    try {
      await blogsCollection.createIndex({ status: 1, publishedAt: -1 });
      await blogsCollection.createIndex({ category: 1, publishedAt: -1 });
      await blogsCollection.createIndex({ featured: -1, publishedAt: -1 });
      await blogsCollection.createIndex({ author: 1, publishedAt: -1 });
      await blogsCollection.createIndex({ tags: 1, publishedAt: -1 });
      console.log('✅ Additional blog indexes created');
    } catch (error) {
      console.log('ℹ️ Some blog indexes may already exist:', error.message);
    }

    // Create indexes for Vendors collection
    console.log('🔍 Creating indexes for Vendors collection...');
    const vendorsCollection = db.collection('vendors');
    
    // Text search index for vendors
    await vendorsCollection.createIndex(
      { 
        name: 'text', 
        description: 'text', 
        address: 'text',
        email: 'text'
      },
      {
        weights: {
          name: 10,        // Highest priority for vendor name
          description: 6,  // Medium-high priority for description
          address: 4,      // Medium priority for address
          email: 2         // Lower priority for email
        },
        name: 'vendor_text_search'
      }
    );
    console.log('✅ Created vendor text search index');
    
    // Verification status index
    await vendorsCollection.createIndex({ verified: 1 });
    console.log('✅ Created vendor verification status index');
    
    // Location-based index
    await vendorsCollection.createIndex({ zipCode: 1, address: 1 });
    console.log('✅ Created vendor location index');
    
    // Creation date index
    await vendorsCollection.createIndex({ createdAt: -1 });
    console.log('✅ Created vendor creation date index');
    
    console.log('🎯 All vendor indexes created successfully!');
    
    console.log('\n🎉 All database indexes created successfully!');
    console.log('📊 Your search performance should now be significantly improved!');
    
    // List all indexes for verification
    console.log('\n📋 Verification - Listing all indexes:');
    
    const productIndexes = await productsCollection.listIndexes().toArray();
    console.log(`📦 Products collection has ${productIndexes.length} indexes:`, 
      productIndexes.map(idx => idx.name).join(', '));
      
    const blogIndexes = await blogsCollection.listIndexes().toArray();
    console.log(`📝 Blogs collection has ${blogIndexes.length} indexes:`, 
      blogIndexes.map(idx => idx.name).join(', '));
      
    const vendorIndexes = await vendorsCollection.listIndexes().toArray();
    console.log(`👥 Vendors collection has ${vendorIndexes.length} indexes:`, 
      vendorIndexes.map(idx => idx.name).join(', '));
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run the script
createIndexes().catch(console.error); 