const prisma = require('../utils/prisma');

// Helper to generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
        .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36); // Append timestamp for uniqueness
};

// GET /api/posts
// Get all published posts with pagination, filtering, and search (public)
exports.getPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, tag, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            status: 'PUBLISHED',
            ...(category && { category: { slug: category } }),
            ...(tag && { tags: { some: {tag: { slug: tag } } } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { content: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { publishedAt: 'desc' },
                include: {
                    author: { select: { id: true, name: true, avatar: true } },
                    category: { select: { id: true, name: true, slug: true } },
                    tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
                },
            }),
            prisma.post.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                posts: posts.map(post => ({
                    ...post,
                    tags: post.tags.map(t => t.tag),
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/posts/:slug
// Get single post by slug (public)
exports.getPostBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const post = await prisma.post.findUnique({
            where: { slug },
            include: {
                author: { select: { id: true, name: true, avatar: true, bio: true } },
                category: { select: { id: true, name: true, slug: true } },
                tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
            },
        });

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Increment view count
        await prisma.post.update({
            where: { id: post.id },
            data: { viewCount: { increment: 1 } },
        });

        res.json({
            success: true,
            data: {
                post: {
                    ...post,
                    tags: post.tags.map(t => t.tag),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/posts
// Get all posts for admin with pagination and filtering (admin)
exports.getAdminPosts = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = {
            ...(status && { status }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive'} },
                    { content: { contains: search, mode: 'insensitive'} },
                ],
            }),
        };

        const [posts, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    author: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true, } },
                },
            }),
            prisma.post.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/admin/posts/:id
// Get single post by ID for admin (admin)
exports.getAdminPostById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const post = await prisma.post.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
            },
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }

        res.json({
            success: true,
            data: {
                post: {
                    ...post,
                    tags: post.tags.map(t => t.tag),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// POST /api/admin/posts
// Create new post (admin)
exports.createPost = async (req, res, next) => {
    try {
        const { title, content, excerpt, categoryId, status, featuredImage, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required',
            });
        }

        const slug = generateSlug(title);

        const post = await prisma.post.create({
            data: {
                title,
                slug,
                content,
                excerpt,
                featuredImage,
                status: status || 'DRAFT',
                publishedAt: status === 'PUBLISHED' ? new Date() : null,
                authorId: req.user.id,
                categoryId: categoryId || null,
                ...categoryId(tags && tags.length > 0 && {
                    tags: {
                        create: tags.map(tagId => ({ tagId })),
                    },
                }),
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                tags: { include: { tag: true } },
            },
        });

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: { post },
        });
    } catch (error) {
        next(error);
    }
};

// PUT /api/admin/posts/:id
// Update a post (admin)
exports.updatePost = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, content, excerpt, categoryId, status, featuredImage, tags } = req.body;

        const existingPost = await prisma.post.findUnique({ where: { id } });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        // Handle publishedAt based on status change
        let publishedAt = existingPost.publishedAt;
        if (status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
            publishedAt = new Date();
        }

        // Update tags: disconnect old tags and connect new ones
        if (tags) {
            await prisma.postTag.deleteMany({ where: { postId: id } });
        }

        const post = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                excerpt,
                featuredImage,
                status,
                publishedAt,
                categoryId: categoryId || null,
                ...tags && {
                    tags: {
                        create: tags.map(tagId => ({ tagId })),
                    },
                },
            },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                tags: { include: { tag: true } },
            },
        });

        res.json({
            success: true,
            message: 'Post updated successfully',
            data: { post },
        });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/admin/posts/:id
// Delete a post (admin)
exports.deletePost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existingPost = await prisma.post.findUnique({ where: { id } });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        await prisma.post.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Post deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/posts/:id/status
// Update post status (admin)
exports.updatePostStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED.',
            });
        }

        const existingPost = await prisma.post.findUnique({ where: { id } });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                message: 'Post not found.',
            });
        }

        const publishedAt = status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED'
            ? new Date()
            : existingPost.publishedAt;

            const post = await prisma.post.update({
                where: { id },
                data: { status, publishedAt },
            });

            res.json({
                success: true,
                message: `Post ${status.toLowerCase()} successfully`,
                data: { post },
            });
    } catch (error) {
        next(error);
    }
}