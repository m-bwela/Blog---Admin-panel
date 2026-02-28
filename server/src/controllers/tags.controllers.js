// ============================================================
// TAGS CONTROLLER
// Handles all tag-related API operations
// ============================================================
// KEY DIFFERENCE FROM CATEGORIES:
// - Categories: One-to-Many (1 category → many posts)
// - Tags: Many-to-Many (1 tag → many posts, 1 post → many tags)
// - Uses junction table: PostTag (post_tags in database)

const prisma = require('../utils/prisma');

// ============================================================
// HELPER FUNCTION: Generate URL-friendly slug
// ============================================================
const generateSlug = (name) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// ============================================================
// 1. GET TAGS (Public)
// Route: GET /api/tags
// ============================================================
// Returns all tags with post count
// Used for: Tag clouds, filter dropdowns, sidebar widgets
exports.getTags = async (req, res, next) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { name: 'asc' },
            include: {
                // Count posts through the junction table (PostTag)
                // posts here refers to the PostTag relation, not Post directly
                _count: {
                    select: { posts: true }
                }
            }
        });

        res.json({
            success: true,
            data: tags.map(tag => ({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                postCount: tag._count.posts,
                createdAt: tag.createdAt
            }))
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 2. GET TAG BY SLUG (Public)
// Route: GET /api/tags/:slug
// ============================================================
// Returns tag details + posts that have this tag
exports.getTagBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const tag = await prisma.tag.findUnique({
            where: { slug },
            include: {
                // MANY-TO-MANY NAVIGATION:
                // Tag → PostTag (junction) → Post
                // 
                // Structure in database:
                // tags table ←→ post_tags table ←→ posts table
                //
                // Prisma handles this with nested include:
                posts: {
                    where: {
                        // Filter through junction to get only published posts
                        post: { status: 'PUBLISHED' }
                    },
                    skip,
                    take: parseInt(limit),
                    orderBy: { assignedAt: 'desc' },  // When tag was added to post
                    include: {
                        // Navigate from PostTag to actual Post
                        post: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                excerpt: true,
                                featuredImage: true,
                                publishedAt: true,
                                author: {
                                    select: { id: true, name: true, avatar: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        posts: {
                            where: { post: { status: 'PUBLISHED' } }
                        }
                    }
                }
            }
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        const total = tag._count.posts;

        res.json({
            success: true,
            data: {
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
                // Flatten the nested structure for cleaner response
                // From: [{ post: { title: '...' } }]
                // To:   [{ title: '...' }]
                posts: tag.posts.map(pt => pt.post),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 3. CREATE TAG (Admin Only)
// Route: POST /api/tags
// ============================================================
exports.createTag = async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tag name is required'
            });
        }

        const slug = generateSlug(name.trim());

        // Check for duplicates
        const existingTag = await prisma.tag.findFirst({
            where: {
                OR: [
                    { name: { equals: name.trim(), mode: 'insensitive' } },
                    { slug }
                ]
            }
        });

        if (existingTag) {
            return res.status(400).json({
                success: false,
                message: 'A tag with this name already exists'
            });
        }

        const tag = await prisma.tag.create({
            data: {
                name: name.trim(),
                slug
            }
        });

        res.status(201).json({
            success: true,
            message: 'Tag created successfully',
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 4. UPDATE TAG (Admin Only)
// Route: PUT /api/tags/:id
// ============================================================
exports.updateTag = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const existingTag = await prisma.tag.findUnique({
            where: { id }
        });

        if (!existingTag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Tag name is required'
            });
        }

        // Check name conflict with OTHER tags
        const nameConflict = await prisma.tag.findFirst({
            where: {
                name: { equals: name.trim(), mode: 'insensitive' },
                NOT: { id }
            }
        });

        if (nameConflict) {
            return res.status(400).json({
                success: false,
                message: 'A tag with this name already exists'
            });
        }

        const tag = await prisma.tag.update({
            where: { id },
            data: {
                name: name.trim(),
                slug: generateSlug(name.trim())
            }
        });

        res.json({
            success: true,
            message: 'Tag updated successfully',
            data: tag
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 5. DELETE TAG (Admin Only)
// Route: DELETE /api/tags/:id
// ============================================================
// IMPORTANT: What happens to posts with this tag?
// 
// Schema defines: onDelete: Cascade on PostTag relations
// This means: Deleting a tag automatically removes all PostTag entries
// Posts themselves are NOT deleted - they just lose this tag
//
// Example:
// - Post "Hello World" has tags: [JavaScript, React, Node]
// - Delete tag "React"
// - PostTag entry linking them is removed (cascade)
// - Post "Hello World" now has tags: [JavaScript, Node]
exports.deleteTag = async (req, res, next) => {
    try {
        const { id } = req.params;

        const tag = await prisma.tag.findUnique({
            where: { id },
            include: {
                _count: { select: { posts: true } }
            }
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
        }

        // Delete tag - PostTag entries are cascaded automatically
        await prisma.tag.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: `Tag "${tag.name}" deleted successfully. Removed from ${tag._count.posts} posts.`
        });
    } catch (error) {
        next(error);
    }
};