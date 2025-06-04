import { NextRequest, NextResponse } from "next/server";
import { SearchServiceFactory } from "@/lib/search/SearchServiceFactory";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testQuery = searchParams.get("q") || "macbook";

    // Test service connectivity
    const serviceHealth = await SearchServiceFactory.testServices();
    
    // Get current search service
    const searchService = await SearchServiceFactory.create();
    
    // Test search with current service
    const startTime = Date.now();
    const searchResult = await searchService.searchProducts({
      searchTerm: testQuery,
      page: 1,
      limit: 5
    });
    const searchTime = Date.now() - startTime;

    // Test data for fuzzy search capabilities
    const fuzzyTests = [
      { query: "macbok", expected: "macbook" },
      { query: "iphone", expected: "iphone" },
      { query: "lapto", expected: "laptop" }
    ];

    const fuzzyResults = [];
    for (const test of fuzzyTests) {
      const fuzzyStart = Date.now();
      const fuzzyResult = await searchService.searchProducts({
        searchTerm: test.query,
        page: 1,
        limit: 1
      });
      const fuzzyTime = Date.now() - fuzzyStart;
      
      fuzzyResults.push({
        query: test.query,
        expected: test.expected,
        found: fuzzyResult.products.length,
        time: fuzzyTime,
        engine: fuzzyResult.engine
      });
    }

    return NextResponse.json({
      success: true,
      test_results: {
        service_health: serviceHealth,
        current_engine: searchResult.engine,
        search_performance: {
          query: testQuery,
          results_found: searchResult.pagination.totalResults,
          response_time: searchTime,
          cached: searchResult.cached
        },
        fuzzy_search_tests: fuzzyResults,
        feature_comparison: {
          mongodb: {
            fuzzy_search: "Limited",
            relevance_scoring: "Basic (text score)",
            typo_tolerance: "None",
            response_time: "200-400ms",
            setup_complexity: "✅ Already working"
          },
          elasticsearch: {
            fuzzy_search: "Advanced",
            relevance_scoring: "Professional (BM25, field boosting)",
            typo_tolerance: "Auto-correction",
            response_time: "50-150ms",
            setup_complexity: serviceHealth.elasticsearch ? "✅ Ready" : "❌ Not running"
          }
        },
        quick_elasticsearch_setup: {
          docker_alternative: "Use Elastic Cloud (free tier)",
          elastic_cloud_url: "https://cloud.elastic.co/registration",
          local_alternative: "brew install elasticsearch"
        }
      }
    });

  } catch (error: any) {
    console.error("🚨 Search test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        suggestion: "Try starting Elasticsearch with: docker-compose -f docker-compose.dev.yml up elasticsearch -d"
      },
      { status: 500 }
    );
  }
} 