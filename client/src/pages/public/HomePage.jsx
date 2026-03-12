// ============================================================
// STATE
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function HomePage() {
  // STATE
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH RECENT POSTS
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        // GET /api/posts?limit=3 - Public endpoint, no auth needed
        const response = await api.get("/posts?limit=3");
        setPosts(response.data.data.posts);
      } catch (error) {
        console.error("Failed to fetch latest posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

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
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to the Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover stories, thinking, and expertise from writers on any topic.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/blog">Explore Posts</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Recent Posts</h2>
          <Link to="/blog" className="text-primary hover:underline text-sm">
            View All &gt;
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
              No posts yet. Check back soon!
          </p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group"
              >
                <div className="rounded-lg border bg-card p-6 space-y-3 hover:shadow-md transition-shadow">
                  {/* Featured Image */}
                  <div className="h-32 bg-muted rounded-md overflow-hidden">
                    {post.featuredImage ? (
                      <img 
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  {post.category && (
                    <span className="text-xs text-primary font-medium">
                      {post.category.name}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt || "No description available."}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <span>{post.author?.name || "Unknown"}</span>
                    <span>•</span>
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}