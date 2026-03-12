// ============================================================
// DASHBOARD PAGE - Admin overview with real stats
// Fetches: Post counts, Categories, Tags, Recent posts
// ============================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Tag, Eye, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function DashboardPage() {
  // ============================================================
  // STATE
  // ============================================================
  
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    categories: 0,
    tags: 0
  });
  
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================================
  // FETCH DASHBOARD DATA
  // ============================================================
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel for speed
        const [postsRes, categoriesRes, tagsRes] = await Promise.all([
          api.get("/posts/admin/all?limit=5"),  // Recent 5 posts
          api.get("/categories"),
          api.get("/tags")
        ]);
        
        const postsData = postsRes.data.data;
        
        // Calculate stats from posts pagination
        setStats({
          totalPosts: postsData.pagination.total,
          publishedPosts: postsData.posts.filter(p => p.status === "PUBLISHED").length,
          draftPosts: postsData.posts.filter(p => p.status === "DRAFT").length,
          categories: categoriesRes.data.data.length,
          tags: tagsRes.data.data.length
        });
        
        setRecentPosts(postsData.posts);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // ============================================================
  // HELPER: Format date
  // ============================================================
  
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  // ============================================================
  // HELPER: Get status color
  // ============================================================
  
  const getStatusBadge = (status) => {
    const styles = {
      PUBLISHED: "bg-green-100 text-green-800",
      DRAFT: "bg-yellow-100 text-yellow-800",
      ARCHIVED: "bg-gray-100 text-gray-800"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
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
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  // ============================================================
  // STATS CARDS DATA
  // ============================================================
  
  const statsCards = [
    { 
      title: "Total Posts", 
      value: stats.totalPosts, 
      icon: FileText, 
      description: `${stats.publishedPosts} published, ${stats.draftPosts} drafts` 
    },
    { 
      title: "Categories", 
      value: stats.categories, 
      icon: FolderOpen, 
      description: "Post categories" 
    },
    { 
      title: "Tags", 
      value: stats.tags, 
      icon: Tag, 
      description: "Content tags" 
    },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Posts</CardTitle>
          <Link 
            to="/admin/posts" 
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No posts yet. <Link to="/admin/posts/new" className="text-primary hover:underline">Create your first post</Link>
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center gap-4">
                  {/* Thumbnail or placeholder */}
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                    {post.featuredImage ? (
                      <img 
                        src={post.featuredImage} 
                        alt="" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Post info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/admin/posts/${post.id}/edit`}
                      className="font-medium hover:underline truncate block"
                    >
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(post.createdAt)} • {post.author?.name || "Unknown"}
                    </p>
                  </div>
                  
                  {/* Status badge */}
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(post.status)}`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/admin/posts/new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">New Post</p>
                <p className="text-sm text-muted-foreground">Create a new blog post</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/admin/posts">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <FolderOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Manage Posts</p>
                <p className="text-sm text-muted-foreground">Edit or delete posts</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 pt-6">
              <Tag className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Users</p>
                <p className="text-sm text-muted-foreground">Manage user accounts</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}