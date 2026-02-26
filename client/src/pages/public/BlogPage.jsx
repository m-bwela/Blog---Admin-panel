import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, Calendar, User, Tag, ChevronLeft, ChevronRight } from "lucide-react";

// Mock data - will be replaced with API calls
const mockPosts = [
  { id: 1, slug: "getting-started-react", title: "Getting Started with React", excerpt: "Learn the basics of React and start building modern web applications.", category: "Technology", author: "John Doe", date: "Feb 26, 2026", image: null },
  { id: 2, slug: "tailwind-css-guide", title: "Complete Tailwind CSS Guide", excerpt: "Master Tailwind CSS utility classes and build beautiful interfaces.", category: "Design", author: "Jane Smith", date: "Feb 25, 2026", image: null },
  { id: 3, slug: "nodejs-best-practices", title: "Node.js Best Practices", excerpt: "Essential patterns and practices for building scalable Node.js apps.", category: "Technology", author: "John Doe", date: "Feb 24, 2026", image: null },
  { id: 4, slug: "database-design-101", title: "Database Design 101", excerpt: "Learn how to design efficient and scalable database schemas.", category: "Backend", author: "Alice Brown", date: "Feb 23, 2026", image: null },
  { id: 5, slug: "api-security-tips", title: "API Security Tips", excerpt: "Protect your APIs with these essential security practices.", category: "Security", author: "Bob Wilson", date: "Feb 22, 2026", image: null },
  { id: 6, slug: "react-hooks-deep-dive", title: "React Hooks Deep Dive", excerpt: "Understanding useState, useEffect, and custom hooks.", category: "Technology", author: "Jane Smith", date: "Feb 21, 2026", image: null },
];

const categories = ["All", "Technology", "Design", "Backend", "Security", "Lifestyle"];

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  
  const currentCategory = searchParams.get("category") || "All";
  const currentPage = parseInt(searchParams.get("page") || "1");
  const postsPerPage = 6;

  // Filter posts
  const filteredPosts = mockPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = currentCategory === "All" || post.category === currentCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, category: currentCategory, page: "1" });
  };

  const handleCategoryChange = (category) => {
    setSearchParams({ q: searchQuery, category, page: "1" });
  };

  const handlePageChange = (page) => {
    setSearchParams({ q: searchQuery, category: currentCategory, page: page.toString() });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-muted-foreground">
          Discover articles, tutorials, and insights on web development and design.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              currentCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary hover:bg-secondary/80"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-6">
        Showing {paginatedPosts.length} of {filteredPosts.length} posts
        {currentCategory !== "All" && ` in ${currentCategory}`}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Posts Grid */}
      {paginatedPosts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedPosts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group"
            >
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="h-48 bg-muted relative overflow-hidden">
                  {post.image ? (
                    <img
                      src={post.image}
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
                  <span className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h2 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts found.</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery("");
              setSearchParams({});
            }}
          >
            Clear filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}