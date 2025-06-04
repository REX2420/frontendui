const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env');
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

async function checkDatabase() {
  const MONGODB_URI = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.log('❌ No MongoDB URI found');
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('MONGO')));
    return;
  }
  
  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('vibecart');
    
    // Check products
    const productsCount = await db.collection('products').countDocuments();
    console.log(`📦 Products in database: ${productsCount}`);
    
    if (productsCount > 0) {
      const sampleProducts = await db.collection('products').find({}).limit(3).toArray();
      console.log('📝 Sample products:');
      sampleProducts.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p._id})`);
        console.log(`    Brand: ${p.brand || 'N/A'}`);
        console.log(`    Category: ${p.category || 'N/A'}`);
      });
    }
    
    // Check blogs
    const blogsCount = await db.collection('blogs').countDocuments();
    console.log(`📝 Blogs in database: ${blogsCount}`);
    
    if (blogsCount > 0) {
      const sampleBlogs = await db.collection('blogs').find({}).limit(2).toArray();
      console.log('📰 Sample blogs:');
      sampleBlogs.forEach(b => console.log(`  - ${b.title} (ID: ${b._id})`));
    }
    
    // Check vendors
    const vendorsCount = await db.collection('vendors').countDocuments();
    console.log(`👥 Vendors in database: ${vendorsCount}`);
    
    if (vendorsCount > 0) {
      const sampleVendors = await db.collection('vendors').find({}).limit(2).toArray();
      console.log('🏪 Sample vendors:');
      sampleVendors.forEach(v => console.log(`  - ${v.name} (ID: ${v._id})`));
    }
    
    // Check indexes
    console.log('\n🔍 Checking indexes...');
    const productIndexes = await db.collection('products').listIndexes().toArray();
    console.log(`📦 Products indexes: ${productIndexes.map(idx => idx.name).join(', ')}`);
    
    const blogIndexes = await db.collection('blogs').listIndexes().toArray();
    console.log(`📝 Blogs indexes: ${blogIndexes.map(idx => idx.name).join(', ')}`);
    
    const vendorIndexes = await db.collection('vendors').listIndexes().toArray();
    console.log(`👥 Vendors indexes: ${vendorIndexes.map(idx => idx.name).join(', ')}`);
    
    // Test a simple text search
    console.log('\n🔍 Testing text search...');
    try {
      const searchResult = await db.collection('products').find({ $text: { $search: 'MacBook' } }).toArray();
      console.log(`🎯 Text search for 'MacBook' found: ${searchResult.length} results`);
      if (searchResult.length > 0) {
        console.log(`  - First result: ${searchResult[0].name}`);
      }
    } catch (error) {
      console.log('❌ Text search failed:', error.message);
    }
    
    // Test search with different terms
    console.log('\n🔍 Testing various search terms...');
    const searchTerms = ['iPhone', 'Apple', 'phone', 'laptop'];
    for (const term of searchTerms) {
      try {
        const results = await db.collection('products').find({ $text: { $search: term } }).toArray();
        console.log(`🔍 Search '${term}': ${results.length} results`);
      } catch (error) {
        console.log(`❌ Search '${term}' failed:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

checkDatabase().catch(console.error); 