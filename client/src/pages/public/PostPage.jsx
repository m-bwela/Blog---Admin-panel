// ====================================================
// POST PAGE - Displays a single post with all details
// ====================================================

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Calendar, User, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function PostPage() {
  // ============================================================
  // GET slug from URL: /blog/my-post-title -> slug = "my-post-title"
  // ============================================================
  const { slug } = useParams();

  // ============================================================
  // STATE
  // ============================================================
  const [post, setPost] = useState(null); // Post data from API
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  // ============================================================
  // FETCH POST DATA
  // ============================================================
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        // GET /api/posts/:slug - Public endpoint
        const response = await api.get(`/posts/${slug}`);
        // API returns { success, data: { post } } — normalize to post object
        setPost(response.data.data.post || response.data.data);
      } catch (error) {
        console.error("Failed to fetch post:", error);
        if (error.response?.status === 404) {
          setError("Post not found");
        } else {
          setError("Failed to load post. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]); // Refetch if slug changes

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
  // HELPER: Estimate reading time (assuming 200 words per minute)
  // ============================================================
  const getReadingTime = (content) => {
    if (!content) return "1 min read";
    const wordsPerMinute = 200; // Average reading speed
    const words = (content || '').split(/\s+/).filter(Boolean).length; // Count words
    const minutes = Math.max(1, Math.ceil(words / wordsPerMinute)); // At least 1 minute
    return `${minutes} min read`;
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">{error}</h1>
        <p className="text-muted-foreground mb-6">
          The post you are looking for might have been removed or is temporarily unavailable.
        </p>
        <Button asChild>
          <Link to="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back to blog
          </Link>
        </Button>
      </div>
    );
  }

  // ============================================================
  // POST NOT FOUND (safety check)
  // ============================================================
  if (!post) {
    return null; // This should not happen since we handle loading and error states, but just in case
  }

  // ============================================================
  // RENDER POST
  // ============================================================
  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:underline">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      {/* Category Badge */}
      {post.category && (
        <Link
          to={`/blog?category=${post.category.slug}`}
          className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4 hover:bg-primary/20 transition-colors"
        >
          {post.category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">{post.title}</h1>

      {/* Author & Meta Info */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-muted-foreground/20">
        {/* Author Avatar */}
        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
          {post.author?.avatar ? (
            <img 
              src={post.author.avatar}
              alt={post.author.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
              {post.author?.name?.charAt(0) || "?"} 
            </div>
          )}
        </div>

        {/* Author Name & Post Info */}
        <div className="flex-1">
          <p className="font-medium">{post.author?.name || "Unknown Author"}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(post.createdAt)}
            </span>
            <span>•</span>
            <span>{getReadingTime(post.content)}</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover"
          />
        </div>
      )}

      {/* Post Content */}
      <div className="prose prose-lg max-w-none mb-8">
        {/* For now, we display content as plain text. Later you can add a markdown parser or rich text renderer */}
        {(post.content || '').split('\n').map((paragraph, index) => (
          paragraph.trim() && (
            <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          )
        ))}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="border-t pt-6 mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {post.tags.map((tagItem) => {
              // Handle both {tag: {id, name, slug}} and {id, name, slug} formats
              const tag = tagItem.tag || tagItem;
              return (
                <Link
                  key={tag.id}
                  to={`/blog?tag=${tag.slug}`}
                  className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Back to Blog Button */}
      <div className="border-t pt-8">
        <Button variant="outline" asChild>
          <Link to="/blog">
          <ArrowLeft className="h-4 w-4 mr-2" />
           Back to all posts
          </Link>
        </Button>
      </div>
    </article>
  );
}