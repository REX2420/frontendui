# VibeCart Search System Documentation

## Overview

The VibeCart Search System is a comprehensive, modern search solution inspired by Instagram's search interface. It provides unified search capabilities across products, blogs, and vendors with advanced filtering, sorting, and visual presentation.

## Features

### 🔍 **Unified Search Experience**
- Search across products, blogs, and vendors from a single interface
- Real-time search with debounced queries (300ms delay)
- Instagram-inspired visual design with modern UI components

### 🎯 **Advanced Filtering & Sorting**
- **Product Filters:**
  - Category selection
  - Price range slider (MVR 0-1000)
  - In-stock only toggle
  - Featured products filter
  - Sale/discount filter
  
- **Sort Options:**
  - Most Relevant (default)
  - Newest First
  - Price: Low to High
  - Price: High to Low
  - Highest Rated
  - Most Popular

### 📱 **Responsive Design**
- Mobile-first approach
- Grid and list view modes
- Adaptive layouts for different screen sizes
- Touch-friendly interface

### 🎨 **Visual Features**
- Hover effects with subtle animations
- Image zoom on hover
- Gradient overlays for blogs
- Badge system for features (Featured, Sale, Verified)
- Glassmorphism effects for modern aesthetics

## Architecture

### File Structure
```
app/
├── search/
│   ├── page.tsx                 # Main search page component
│   └── layout.tsx              # Search page layout with metadata
├── api/search/
│   ├── products/route.ts       # Advanced product search API
│   ├── blogs/route.ts          # Blog search API
│   └── vendors/route.ts        # Vendor search API
components/
├── shared/search/
│   └── SearchResultsGrid.tsx   # Reusable search results component
└── shared/navbar/
    ├── SearchModal.tsx         # Updated with search page link
    └── NavbarInput.tsx         # Search input component
```

### API Endpoints

#### `/api/search/products`
**Query Parameters:**
- `q` - Search query string
- `category` - Product category filter
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sortBy` - Sort criteria
- `inStock` - Boolean for in-stock filter
- `featured` - Boolean for featured products
- `discount` - Boolean for discounted products
- `page` - Page number for pagination
- `limit` - Results per page

**Response:**
```json
{
  "success": true,
  "data": [/* products array */],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalResults": 100,
    "hasNext": true,
    "hasPrev": false,
    "limit": 20
  },
  "searchInfo": {
    "query": "perfume",
    "category": "Fragrance",
    "priceRange": [0, 1000],
    "sortBy": "relevance",
    "filters": {
      "inStock": true,
      "featured": false,
      "discount": false
    }
  }
}
```

#### `/api/search/blogs`
**Query Parameters:**
- `q` - Search query string
- `category` - Blog category filter
- `sortBy` - Sort criteria
- `status` - Publication status (default: "published")
- `page` - Page number
- `limit` - Results per page

#### `/api/search/vendors`
**Query Parameters:**
- `q` - Search query string
- `sortBy` - Sort criteria
- `verified` - Verification status filter
- `location` - Location filter
- `page` - Page number
- `limit` - Results per page

## Components

### SearchPage (`app/search/page.tsx`)
Main search page component with state management for:
- Search filters and query
- Loading states
- Results data
- View mode (grid/list)
- Active tab (all/products/blogs/vendors)

### SearchResultsGrid (`components/shared/search/SearchResultsGrid.tsx`)
Reusable component for displaying search results:
- Supports products, blogs, and vendors
- Grid and list view modes
- Responsive layouts
- Consistent card designs

### SearchModal (`components/shared/navbar/SearchModal.tsx`)
Enhanced modal with:
- Quick search functionality
- Trending searches
- "View all results" link to search page

## Usage

### Basic Search
```typescript
// Navigate to search page with query
router.push(`/search?q=${encodeURIComponent(searchQuery)}`);

// Or use the SearchResultsGrid component
<SearchResultsGrid 
  products={products}
  blogs={blogs}
  vendors={vendors}
  viewMode="grid"
  maxItems={10}
/>
```

### Advanced Filtering
```typescript
const filters = {
  query: "perfume",
  category: "Fragrance",
  priceRange: [50, 500],
  sortBy: "price-low",
  inStock: true,
  featured: false,
  discount: true
};

// These filters are automatically applied when using the search page
```

## Error Handling

The search system includes comprehensive error handling:

1. **API Fallbacks:** If new search APIs are unavailable, the system falls back to existing product/blog search functions
2. **Graceful Degradation:** Missing data fields are handled with default values
3. **Loading States:** Clear loading indicators during search operations
4. **Empty States:** Helpful messages when no results are found

## Performance Optimizations

### Search Debouncing
- 300ms delay prevents excessive API calls during typing
- Cancels previous requests when new ones are initiated

### Pagination
- Results are paginated to improve load times
- Configurable limit per page (default: 20)

### Image Optimization
- Next.js Image component for optimized loading
- Lazy loading for images outside viewport
- Proper aspect ratios to prevent layout shift

### Caching Strategy
- API responses can be cached using existing cache system
- Search results are temporarily stored in component state
- URL parameters maintain search state on page refresh

## SEO & Accessibility

### SEO Features
- Proper metadata for search page
- URL parameters for shareable search results
- Structured data for search results
- Open Graph and Twitter Card support

### Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- Proper ARIA attributes
- Focus management
- Color contrast compliance

## Styling & Theming

### CSS Classes
```css
/* Custom classes available in globals.css */
.line-clamp-2        /* Truncate text to 2 lines */
.line-clamp-3        /* Truncate text to 3 lines */
.search-card         /* Enhanced card animations */
.image-zoom          /* Image hover effects */
.glass-effect        /* Glassmorphism styling */
.badge-featured      /* Featured product badges */
.badge-sale          /* Sale badges */
.badge-verified      /* Verified vendor badges */
```

### Dark Mode Support
- Full dark mode compatibility
- Automatic theme switching
- Consistent styling across themes

## Integration Examples

### Adding Search to Navbar
```typescript
import SearchModal from '@/components/shared/navbar/SearchModal';

// The search modal automatically includes the "View all results" link
```

### Custom Search Implementation
```typescript
import SearchResultsGrid from '@/components/shared/search/SearchResultsGrid';

function CustomSearchPage() {
  const [results, setResults] = useState({ products: [], blogs: [], vendors: [] });
  
  return (
    <SearchResultsGrid 
      products={results.products}
      blogs={results.blogs}
      vendors={results.vendors}
      viewMode="grid"
    />
  );
}
```

## Future Enhancements

### Planned Features
1. **Search Analytics:** Track popular searches and user behavior
2. **AI-Powered Suggestions:** Machine learning for better search suggestions
3. **Voice Search:** Speech-to-text search functionality
4. **Advanced Filters:** More granular filtering options
5. **Search History:** Personal search history for logged-in users
6. **Saved Searches:** Ability to save and rerun searches
7. **Real-time Updates:** Live updates for new products/blogs/vendors

### Technical Improvements
1. **Elasticsearch Integration:** For more powerful search capabilities
2. **Search Indexing:** Background indexing for better performance
3. **A/B Testing:** Test different search interfaces and algorithms
4. **Progressive Web App:** Offline search capabilities
5. **Internationalization:** Multi-language search support

## Troubleshooting

### Common Issues

**Search not returning results:**
- Check API endpoint availability
- Verify database connection
- Ensure proper query encoding

**Slow search performance:**
- Add database indexes for search fields
- Implement result caching
- Consider pagination for large datasets

**Styling issues:**
- Verify Tailwind CSS classes are properly configured
- Check for CSS conflicts
- Ensure dark mode variants are included

### Development Tips

1. **Testing Search APIs:**
   ```bash
   curl "http://localhost:3000/api/search/products?q=perfume&limit=5"
   ```

2. **Debugging Search Queries:**
   - Use browser dev tools to monitor API calls
   - Check network tab for request/response details
   - Log search parameters in API endpoints

3. **Performance Monitoring:**
   - Use React DevTools to monitor component re-renders
   - Track API response times
   - Monitor search result relevance

## Contributing

When contributing to the search system:

1. **Follow existing patterns** for API responses and component structure
2. **Test thoroughly** across different devices and browsers
3. **Update documentation** for any new features or changes
4. **Consider accessibility** in all UI changes
5. **Maintain consistency** with the overall VibeCart design system

## Support

For questions or issues related to the search system:
- Check this documentation first
- Review the codebase for implementation examples
- Test with sample data to isolate issues
- Consider fallback behaviors for graceful degradation 