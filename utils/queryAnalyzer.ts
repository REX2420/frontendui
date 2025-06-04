/**
 * 🚀 MONGODB QUERY PERFORMANCE ANALYZER
 * Analyzes aggregation pipeline performance and provides optimization insights
 */

interface QueryStats {
  totalDocsExamined: number;
  totalKeysExamined: number;
  executionTimeMillis: number;
  nReturned: number;
  indexUsed: boolean;
  efficiency: number;
  indexEfficiency: number;
  stage: string;
}

interface AnalysisResult {
  performance: 'excellent' | 'good' | 'fair' | 'poor';
  stats: QueryStats;
  recommendations: string[];
  warnings: string[];
}

/**
 * Analyze aggregation pipeline performance
 */
export async function analyzeQuery(collection: any, pipeline: any[]): Promise<AnalysisResult> {
  try {
    const explanation = await collection.aggregate(pipeline).explain("executionStats");
    
    // Extract performance statistics
    const stats: QueryStats = {
      totalDocsExamined: explanation.stages?.[0]?.$cursor?.executionStats?.totalDocsExamined || 0,
      totalKeysExamined: explanation.stages?.[0]?.$cursor?.executionStats?.totalKeysExamined || 0,
      executionTimeMillis: explanation.stages?.[0]?.$cursor?.executionStats?.executionTimeMillis || 0,
      nReturned: explanation.stages?.[0]?.$cursor?.executionStats?.nReturned || 0,
      indexUsed: explanation.stages?.[0]?.$cursor?.executionStats?.indexUsed || false,
      efficiency: 0,
      indexEfficiency: 0,
      stage: explanation.stages?.[0]?.stage || 'unknown'
    };
    
    // Calculate efficiency metrics
    stats.efficiency = stats.nReturned / Math.max(stats.totalDocsExamined, 1);
    stats.indexEfficiency = stats.totalKeysExamined / Math.max(stats.totalDocsExamined, 1);
    
    // Determine performance level
    let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (stats.executionTimeMillis < 100 && stats.efficiency > 0.1) {
      performance = 'excellent';
    } else if (stats.executionTimeMillis < 300 && stats.efficiency > 0.05) {
      performance = 'good';
    } else if (stats.executionTimeMillis < 1000 && stats.efficiency > 0.01) {
      performance = 'fair';
    }
    
    // Generate recommendations and warnings
    const recommendations: string[] = [];
    const warnings: string[] = [];
    
    // Performance recommendations
    if (!stats.indexUsed) {
      recommendations.push('Consider adding indexes for better query performance');
      warnings.push('Query is not using indexes - performance may be poor');
    }
    
    if (stats.efficiency < 0.01) {
      recommendations.push('Query efficiency is low - consider refining filters or adding indexes');
      warnings.push(`Low efficiency: ${(stats.efficiency * 100).toFixed(2)}% - examining ${stats.totalDocsExamined} docs to return ${stats.nReturned}`);
    }
    
    if (stats.executionTimeMillis > 1000) {
      recommendations.push('Query execution time is high - consider optimization');
      warnings.push(`Slow query: ${stats.executionTimeMillis}ms execution time`);
    }
    
    if (stats.totalDocsExamined > 10000) {
      recommendations.push('Large number of documents examined - consider adding more selective filters');
      warnings.push(`High document scan: ${stats.totalDocsExamined} documents examined`);
    }
    
    // Positive feedback
    if (performance === 'excellent') {
      recommendations.push('Query performance is excellent! 🚀');
    } else if (performance === 'good') {
      recommendations.push('Query performance is good 👍');
    }
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Query Performance Analysis:', {
        performance,
        executionTime: `${stats.executionTimeMillis}ms`,
        efficiency: `${(stats.efficiency * 100).toFixed(2)}%`,
        docsExamined: stats.totalDocsExamined,
        docsReturned: stats.nReturned,
        indexUsed: stats.indexUsed,
        recommendations: recommendations.length,
        warnings: warnings.length
      });
    }
    
    return {
      performance,
      stats,
      recommendations,
      warnings
    };
    
  } catch (error) {
    console.error('Query analysis error:', error);
    return {
      performance: 'poor',
      stats: {
        totalDocsExamined: 0,
        totalKeysExamined: 0,
        executionTimeMillis: 0,
        nReturned: 0,
        indexUsed: false,
        efficiency: 0,
        indexEfficiency: 0,
        stage: 'error'
      },
      recommendations: ['Unable to analyze query performance'],
      warnings: ['Query analysis failed']
    };
  }
}

/**
 * Analyze simple find query performance
 */
export async function analyzeFindQuery(collection: any, query: any, options?: any): Promise<AnalysisResult> {
  try {
    const explanation = await collection.find(query, options).explain("executionStats");
    
    const executionStats = explanation.executionStats;
    
    const stats: QueryStats = {
      totalDocsExamined: executionStats.totalDocsExamined || 0,
      totalKeysExamined: executionStats.totalKeysExamined || 0,
      executionTimeMillis: executionStats.executionTimeMillis || 0,
      nReturned: executionStats.nReturned || 0,
      indexUsed: (executionStats.totalKeysExamined || 0) > 0,
      efficiency: 0,
      indexEfficiency: 0,
      stage: 'find'
    };
    
    stats.efficiency = stats.nReturned / Math.max(stats.totalDocsExamined, 1);
    stats.indexEfficiency = stats.totalKeysExamined / Math.max(stats.totalDocsExamined, 1);
    
    // Determine performance and generate recommendations (same logic as above)
    let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (stats.executionTimeMillis < 50 && stats.efficiency > 0.1) {
      performance = 'excellent';
    } else if (stats.executionTimeMillis < 200 && stats.efficiency > 0.05) {
      performance = 'good';
    } else if (stats.executionTimeMillis < 500 && stats.efficiency > 0.01) {
      performance = 'fair';
    }
    
    const recommendations: string[] = [];
    const warnings: string[] = [];
    
    if (!stats.indexUsed) {
      recommendations.push('Add appropriate indexes for this query pattern');
      warnings.push('Query is performing a collection scan');
    }
    
    if (stats.efficiency < 0.01) {
      recommendations.push('Improve query selectivity');
      warnings.push(`Very low efficiency: ${(stats.efficiency * 100).toFixed(2)}%`);
    }
    
    return {
      performance,
      stats,
      recommendations,
      warnings
    };
    
  } catch (error) {
    console.error('Find query analysis error:', error);
    return {
      performance: 'poor',
      stats: {
        totalDocsExamined: 0,
        totalKeysExamined: 0,
        executionTimeMillis: 0,
        nReturned: 0,
        indexUsed: false,
        efficiency: 0,
        indexEfficiency: 0,
        stage: 'error'
      },
      recommendations: ['Unable to analyze find query performance'],
      warnings: ['Find query analysis failed']
    };
  }
}

/**
 * Performance monitoring middleware for queries
 */
export function withPerformanceMonitoring<T>(
  queryFunction: () => Promise<T>,
  queryName: string = 'Unknown Query'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${queryName}: ${duration}ms`);
      }
      
      // Alert if response time is too high
      if (duration > 1000) {
        console.warn(`🐌 Slow query detected - ${queryName}: ${duration}ms`);
      }
      
      // Log excellent performance
      if (duration < 100) {
        console.log(`🚀 Fast query - ${queryName}: ${duration}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`❌ Query failed - ${queryName}: ${duration}ms`, error);
      reject(error);
    }
  });
}

export default {
  analyzeQuery,
  analyzeFindQuery,
  withPerformanceMonitoring
}; 