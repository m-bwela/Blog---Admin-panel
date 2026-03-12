// ============================================================
// BLOG PAGE - Public blog listing with search, filter, pagination
// ============================================================

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Calendar, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function BlogPage() {
  // ============================================================
  // URL PARAMS - Keep filters in URL so users can share/bookmark
  // ============================================================
  const [searchParams, setSearchParams] = useSearchParams();
  
  // ============================================================
  // STATE
  // ============================================================
  const [posts, setPosts] = useState([]);           // Posts from API
  const [categories, setCategories] = useState([]); // Categories from API
  const [pagination, setPagination] = useState({    // Pagination info from API
    page: 1,
    limit: 6,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);     // Loading state
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  
  // Read current filters from URL
  const currentCategory = searchParams.get("category") || "";
  const currentSearch = searchParams.get("search") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  // ============================================================
  // FETCH CATEGORIES (once on mount)
  // ============================================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // ============================================================
  // FETCH POSTS (when filters change)
  // ============================================================
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Build query string from current filters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "6"
        });
        
        if (currentSearch) params.append("search", currentSearch);
        if (currentCategory) params.append("category", currentCategory);
        
        // GET /api/posts?page=1&limit=6&search=...&category=...
        const response = await api.get(`/posts?${params}`);
        
        setPosts(response.data.data.posts);
        setPagination(response.data.data.pagination);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [currentPage, currentSearch, currentCategory]); // Re-fetch when these change

  // ============================================================
  // HANDLERS
  // ============================================================
  
  // When user submits search form
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ 
      search: searchInput, 
      category: currentCategory, 
      page: "1"  // Reset to page 1 when searching
    });
  };

  // When user clicks a category button
  const handleCategoryChange = (categorySlug) => {
    setSearchParams({ 
      search: currentSearch, 
      category: categorySlug, 
      page: "1"  // Reset to page 1 when changing category
    });
  };

  // When user clicks pagination buttons
  const handlePageChange = (page) => {
    setSearchParams({ 
      search: currentSearch, 
      category: currentCategory, 
      page: page.toString() 
    });
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    setSearchParams({});
  };

  // ============================================================
  // HELPER: Format date
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground">
          Discover articles, tutorials, and insights on web development and design.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {/* "All" button */}
        <button
          onClick={() => handleCategoryChange("")}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            currentCategory === ""
              ? "bg-primary text-primary-foreground"
              : "bg-secondary hover:bg-secondary/80"
          }`}
        >
          All
        </button>
        
        {/* Category buttons from API */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.slug)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              currentCategory === category.slug
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {category.name} ({category.postCount})
          </button>
        ))}
      </div>

      {/* Results Info */}
      <p className="text-sm text-muted-foreground mb-6">
        {loading ? (
          "Loading..."
        ) : (
          <>
            Showing {posts.length} of {pagination.total} posts
            {currentCategory && ` in "${categories.find(c => c.slug === currentCategory)?.name || currentCategory}"`}
            {currentSearch && ` matching "${currentSearch}"`}
          </>
        )}
      </p>

      {/* Posts Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts found.</p>
          <Button variant="link" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group"
            >
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="h-48 bg-muted relative overflow-hidden">
                  {post.featuredImage ? (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <span className="text-4xl font-bold text-primary/20">
                        {post.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Category Badge */}
                  {post.category && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      {post.category.name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h2 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt || "No description available."}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{post.author?.name || "Unknown"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => handlePageChange(page)}
            >
              {page}
            </Button>
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}