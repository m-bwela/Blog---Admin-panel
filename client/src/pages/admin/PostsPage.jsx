// import { Link } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Plus, Edit, Trash2 } from "lucide-react";

// const posts = [
//   { id: 1, title: "Getting Started with React", status: "Published", author: "John Doe", date: "Feb 25, 2026" },
//   { id: 2, title: "Understanding TypeScript", status: "Draft", author: "Jane Smith", date: "Feb 24, 2026" },
//   { id: 3, title: "Building APIs with Express", status: "Published", author: "John Doe", date: "Feb 23, 2026" },
//   { id: 4, title: "Database Design Patterns", status: "Archived", author: "Jane Smith", date: "Feb 22, 2026" },
// ];

// export default function PostsPage() {
//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold">Posts</h1>
//         <Button asChild>
//           <Link to="/admin/posts/new">
//             <Plus className="h-4 w-4 mr-2" />
//             New Post
//           </Link>
//         </Button>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>All Posts</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <table className="w-full">
//             <thead>
//               <tr className="border-b">
//                 <th className="text-left py-3 px-4 font-medium">Title</th>
//                 <th className="text-left py-3 px-4 font-medium">Status</th>
//                 <th className="text-left py-3 px-4 font-medium">Author</th>
//                 <th className="text-left py-3 px-4 font-medium">Date</th>
//                 <th className="text-right py-3 px-4 font-medium">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {posts.map((post) => (
//                 <tr key={post.id} className="border-b hover:bg-muted/50">
//                   <td className="py-3 px-4">{post.title}</td>
//                   <td className="py-3 px-4">
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs ${
//                         post.status === "Published"
//                           ? "bg-green-100 text-green-800"
//                           : post.status === "Draft"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {post.status}
//                     </span>
//                   </td>
//                   <td className="py-3 px-4">{post.author}</td>
//                   <td className="py-3 px-4 text-muted-foreground">{post.date}</td>
//                   <td className="py-3 px-4 text-right">
//                     <div className="flex justify-end gap-2">
//                       <Button variant="ghost" size="icon" asChild>
//                         <Link to={`/admin/posts/${post.id}/edit`}>
//                           <Edit className="h-4 w-4" />
//                         </Link>
//                       </Button>
//                       <Button variant="ghost" size="icon">
//                         <Trash2 className="h-4 w-4 text-destructive" />
//                       </Button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function PostsPage() {
  // STATE MANAGEMENT
  // Posts data from API
  const [posts, setPosts] = useState([]);

  // Pagination info from API
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Loading state - show spinner while fetching 
  const [loading, setLoading] = useState(false);

  // Error state - show error message if API call fails
  const [error, setError] = useState(null);

  // search input value
  const [search, setSearch] = useState("");

  // Status filter: '' (all), 'PUBLISHED', 'DRAFT', 'ARCHIVED'
  const [statusFilter, setStatusFilter] = useState("");

  // Track which post is being deleted to show loading state on delete button
  const [deletingId, setDeletingId] = useState(null);

  //=========================================================================
  // FETCH POSTS FROM API
  //=========================================================================

  // useEffect runs when component mounts AND when dependencies change
  // Dependencies: [pagination.page, search, statusFilter]
  // When user changes page, searches, or filters -> refresh posts
  useEffect(() => {
    fetchPosts();
  }, [pagination.page, statusFilter]); 
  // Note: search is not included in dependencies to avoid fetching on every keystroke. Instead, we will fetch when user submits search form.

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string parameters
      //UTLSearchParams is a convenient way to build query strings
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      // Only add optional params if they have values
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter) params.append("status", statusFilter);

      // GET /api/posts?page=1&limit=10&search=react&status=PUBLISHED
      const response = await api.get(`/posts/admin/all?${params}`);

      // API returns: { success: true, data: { posts: [...], pagination: {...} } }
      setPosts(response.data.data.posts);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(error.response?.data?.message || "Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //=========================================================================
  // SEARCH HANDLER
  //=========================================================================

  // Called when user clicks search button or presses Enter in search input
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to page 1 when searching (results might be fewer)
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  //=========================================================================
  // DELETE POST HANDLER
  //=========================================================================
  const handleDelete = async (post) => {
    // Confirm before delete - prevents accidental deletions
    const confirmed = window.confirm(`Are you sure you want to delete the post "${post.title}"?\nThis action cannot be undone.`);

    if (!confirmed) return;
    
    try {
      setDeletingId(post.id); // Show loading on this specific button

      // DELETE /api/posts/admin/:id
      await api.delete(`/posts/admin/${post.id}`);

      // Remove from local state (no need to refetch all posts)
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));

      // Update total count
      setPagination(prev => ({ ...prev, total: prev.total - 1}));
      
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(error.response?.data?.message || "Failed to delete post. Please try again.");
    } finally {
      setDeletingId(null); // Reset deleting state
    }
  };

  //=========================================================================
  // HELPER: Format date for display
  //=========================================================================

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  //=========================================================================
  // HELPER: Get status badge styling
  //=========================================================================

  const getStatusBadge = (status) => {
    const styles = {
      PUBLISHED: "bg-green-100 text-green-800",
      DRAFT: "bg-yellow-100 text-yellow-800",
      ARCHIVED: "bg-gray-100 text-gray-800"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  //=========================================================================
  // RENDER
  //=========================================================================

  return (
    <div className="space-y-6">
      {/* Header with title and New Post button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Button asChild>
          <Link to="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post          
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4>">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="text"
                name="search"
                id="search"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filter changes
              }}
              className="border rounded-md bg-background px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
              
            {/* Search Button */}
            <Button type="submit"><i className="fa fa-search"></i></Button>
          </form>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Posts
            {pagination.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchPosts}>
                Retry
              </Button>
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found. Try adjusting your search or filter criteria.</p>
              {(search || statusFilter) && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            /* Posts Table */
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Author</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">{post.excerpt || "No excerpt available"}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{post.author?.name || "Unknown"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(post.publishedAt || post.createdAt)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/posts/${post.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(post)}
                            disabled={deletingId === post.id}
                          >
                            {deletingId === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}