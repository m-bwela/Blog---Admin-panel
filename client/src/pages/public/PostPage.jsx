import { useParams, Link } from "react-router-dom";

export default function PostPage() {
  const { slug } = useParams();

  return (
    <article className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:underline">Blog</Link>
        <span className="mx-2">/</span>
        <span>{slug}</span>
      </nav>

      {/* Featured Image */}
      <div className="h-64 md:h-96 bg-muted rounded-lg mb-8" />

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">Sample Blog Post Title</h1>

      {/* Author */}
      <div className="flex items-center gap-3 mb-8 pb-8 border-b">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div>
          <p className="font-medium">Author Name</p>
          <p className="text-sm text-muted-foreground">Feb 26, 2026 • 5 min read</p>
        </div>
      </div>

      {/* Content */}
      <div className="prose max-w-none">
        <p className="text-muted-foreground leading-relaxed">
          This is placeholder content for the blog post. The actual content will
          be loaded from the database.
        </p>
      </div>
    </article>
  );
}