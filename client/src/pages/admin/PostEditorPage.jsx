// ============================================================
// POST EDITOR PAGE - Create and Edit posts
// Features: Form, Categories, Tags, Status, API integration
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, X, ImageIcon } from "lucide-react";
import api from "@/lib/api";

export default function PostEditorPage() {
  // ============================================================
  // ROUTING HOOKS
  // ============================================================
  
  // useParams: Get URL parameters (e.g., /admin/posts/:id/edit)
  const { id } = useParams();
  
  // useNavigate: Programmatic navigation (redirect after save)
  const navigate = useNavigate();
  
  // Determine if we're editing or creating
  // If URL has :id → editing, otherwise → creating
  const isEditing = Boolean(id);

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  // Form data for the post
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    categoryId: "",      // Changed from 'category' to match API
    status: "DRAFT",
    featuredImage: "",
    tags: []             // Array of tag IDs
  });
  
  // Available categories from API
  const [categories, setCategories] = useState([]);
  
  // Available tags from API
  const [tags, setTags] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);        // Page loading
  const [saving, setSaving] = useState(false);          // Save button loading
  const [loadingData, setLoadingData] = useState(true); // Initial data fetch
  
  // Error states
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // ============================================================
  // FETCH INITIAL DATA
  // ============================================================
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingData(true);
        
        // Fetch categories and tags in parallel
        // Promise.all runs multiple async operations simultaneously
        // More efficient than sequential: await cats; await tags;
        const [categoriesRes, tagsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/tags")
        ]);
        
        setCategories(categoriesRes.data.data);
        setTags(tagsRes.data.data);
        
        // If editing, also fetch the existing post
        if (isEditing) {
          const postRes = await api.get(`/posts/admin/${id}`);
          const post = postRes.data.data;
          
          // Populate form with existing post data
          setFormData({
            title: post.title || "",
            content: post.content || "",
            excerpt: post.excerpt || "",
            categoryId: post.categoryId || "",
            status: post.status || "DRAFT",
            featuredImage: post.featuredImage || "",
            // Extract tag IDs from the post's tags array
            // API returns: tags: [{ tag: { id, name } }] for posts
            tags: post.tags?.map(t => t.tag?.id || t.id) || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err.response?.data?.message || "Failed to load data");
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchInitialData();
  }, [id, isEditing]);  // Re-run if id changes

  // ============================================================
  // FORM VALIDATION
  // ============================================================
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!formData.content.trim()) {
      errors.content = "Content is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;  // Return true if no errors
  };

  // ============================================================
  // HANDLE FORM SUBMIT
  // ============================================================
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submitting
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Prepare payload for API
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || null,
        categoryId: formData.categoryId || null,
        status: formData.status,
        featuredImage: formData.featuredImage || null,
        tags: formData.tags  // Array of tag IDs
      };
      
      if (isEditing) {
        // PUT /api/posts/admin/:id - Update existing post
        await api.put(`/posts/admin/${id}`, payload);
      } else {
        // POST /api/posts/admin - Create new post
        await api.post("/posts/admin", payload);
      }
      
      // Redirect to posts list after successful save
      navigate("/admin/posts");
    } catch (err) {
      console.error("Failed to save post:", err);
      setError(err.response?.data?.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // HANDLE SAVE AS DRAFT
  // ============================================================
  
  const handleSaveDraft = async () => {
    // Temporarily set status to DRAFT and submit
    const originalStatus = formData.status;
    setFormData(prev => ({ ...prev, status: "DRAFT" }));
    
    // Create a synthetic event to trigger handleSubmit
    const syntheticEvent = { preventDefault: () => {} };
    
    // Need to wait for state update, so we'll handle it directly
    try {
      setSaving(true);
      
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        excerpt: formData.excerpt.trim() || null,
        categoryId: formData.categoryId || null,
        status: "DRAFT",  // Force draft status
        featuredImage: formData.featuredImage || null,
        tags: formData.tags
      };
      
      if (isEditing) {
        await api.put(`/posts/admin/${id}`, payload);
      } else {
        await api.post("/posts/admin", payload);
      }
      
      navigate("/admin/posts");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft");
      setFormData(prev => ({ ...prev, status: originalStatus }));
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TAG SELECTION HANDLERS
  // ============================================================
  
  // Add a tag to selected tags
  const handleTagAdd = (tagId) => {
    if (!formData.tags.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
    }
  };
  
  // Remove a tag from selected tags
  const handleTagRemove = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };
  
  // Get tag object by ID (for displaying name)
  const getTagById = (tagId) => tags.find(t => t.id === tagId);

  // ============================================================
  // LOADING STATE
  // ============================================================
  
  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/posts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Post" : "New Post"}
        </h1>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* ==================== MAIN CONTENT ==================== */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={formErrors.title ? "border-destructive" : ""}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-destructive">{formErrors.title}</p>
                  )}
                </div>
                
                {/* Content Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <textarea
                    id="content"
                    className={`w-full min-h-[300px] p-3 border rounded-md bg-background ${
                      formErrors.content ? "border-destructive" : ""
                    }`}
                    placeholder="Write your post content here..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                  {formErrors.content && (
                    <p className="text-sm text-destructive">{formErrors.content}</p>
                  )}
                </div>
                
                {/* Excerpt Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <textarea
                    id="excerpt"
                    className="w-full min-h-[100px] p-3 border rounded-md bg-background"
                    placeholder="Brief description of the post (optional)"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div className="space-y-6">
            {/* Publish Card */}
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isEditing ? "Update" : "Publish"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saving}
                  >
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Card */}
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Tags Card - Multi-select UI */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Selected Tags Display */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tagId) => {
                      const tag = getTagById(tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tagId)}
                            className="hover:bg-primary/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                
                {/* Tag Selector Dropdown */}
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleTagAdd(e.target.value);
                    }
                  }}
                >
                  <option value="">Add a tag...</option>
                  {tags
                    .filter((tag) => !formData.tags.includes(tag.id))
                    .map((tag) => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                </select>
                
                {/* Helper text if no tags available */}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tags available. Create tags first.
                  </p>
                )}
              </CardContent>
            </Card>

                        {/* Featured Image Card - With Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Image Preview */}
                {formData.featuredImage && (
                  <div className="relative">
                    <img
                      src={formData.featuredImage}
                      alt="Featured preview"
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, featuredImage: "" })}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                {!formData.featuredImage && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formDataUpload = new FormData();
                        formDataUpload.append('image', file);

                        try {
                          const response = await api.post('/upload/image', formDataUpload, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });
                          setFormData({ ...formData, featuredImage: response.data.data.url });
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to upload image');
                        }
                      }}
                    />
                    <label
                      htmlFor="imageUpload"
                      className="cursor-pointer text-sm text-muted-foreground hover:text-primary"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8" />
                        <span>Click to upload image</span>
                        <span className="text-xs">Max 5MB (JPEG, PNG, GIF, WebP)</span>
                      </div>
                    </label>
                  </div>
                )}

                {/* Or enter URL manually */}
                <div className="text-center text-xs text-muted-foreground">or</div>
                <Input
                  type="text"
                  name="featuredImage"
                  id="featuredImage"
                  placeholder="Paste image URL..."
                  value={formData.featuredImage}
                  onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}