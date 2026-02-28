const prisma = require('../utils/prisma');

// Why? URLs like /categories/tech-news are better than /categories/Tech%20News
// - Better for SEO (search engines prefer clean URLs)
// - Easier for users to read and share
//- No encoding issues with spaces or special characters
const generateSlug = (name) => {
    return name
        .toLowerCase() // "Tech News" -> "tech news"
        .replace(/[^a-z0-9]+/g, '-') // "tech news" -> "tech-news" (replace spaces/symbols)
        .replace(/(^-|-$)/g, ''); // Remove leading/trailing hyphens (if any)
};

// GET /api/categories
exports.getCategories = async (req, res, next) => {
    try {
        // findMany() = SELECT * FROM categories
        const categories = await prisma.category.findMany({
            // orderBy: Sort results alphabetically by name
            orderBy: { name: 'asc'},

            // _count: Prisma's aggregation feature
            // Instead of loading all posts, just count them
            // Much faster than: include: { posts: true } then posts.length
            include: {
                _count: {
                    select: { posts: true} // count only posts relation
                }
            }
        });

        // Return successful response
        // success: true helps frontend know requet worked
        res.json({
            success: true,
            data: categories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                postCount: category._count.posts, // Rename for clarity
                createdAt: category.createdAt
            }))
        });
    } catch (error) {
        // next(error) passes error to Express error handler middleware
        // This centralizes error handling instead of try/catch everywhere
        next(error);
    }
};

//GET /api/categories/:slug
// Example: GET /api/categories/tech-news
// GET CATEGORY BY SLUG (for public listing page)
// =====================================================================
// Why by slug? SEO-friendly URLs like /categories/technology
exports.getCategoryBySlug = async (req, res, next) => {
    try {
        // req.params contains URL parameters
        // For /api/categories/tech-news -> req.params.slug = "tech-news"
        const { slug } = req.params;

        // Pagination from query string: /api/categories/tech?page=2&limit=5
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // findUnique: Find exactly ONE record by unique field
        // Our schema has: slug String @unique
        const category = await prisma.category.findUnique({
            where: { slug },
            include: {
                // include: Eager loading - fetch related data in same query
                // Without this, we'd need 2 separate queries
                posts: {
                    // Only show published posts to public
                    where: { status: 'PUBLISHED'},
                    skip, // Pagination: skip first (page-1)*limit records
                    take: parseInt(limit), // Limit results to 'limit' per page
                    orderBy: { publishedAt: 'desc' }, // Newest posts first
                    // select: choose specific fields (reduces data transfer)
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
                },
                // Count total posts for pagination info
                _count: {
                    select: {
                        posts: {
                            where:{ status: 'PUBLISHED' }
                        }
                    }
                }
            }
        });

        // 404 Error: Category not found
        // Why check? Prevent returning null which would confuse frontend
        if (!category) {
            return res.status(404).json({
                success: false,
                message: `Category with slug '${slug}' not found.`
            });
        }

        const total = category._count.posts; // Total published posts in this category

        res.json({
            success: true,
            data: {
                id: category.id,
                name: category.name,
                slug:category.slug,
                description: category.description,
                posts: category.posts,
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

// POST /api/categories
// CREATE CATEGORY (Admin Only)
// ==========================================================================
// Purpose: create a new category
// Why admin only? Regular users shouldn't create categories
exports.createCategory = async (req, res, next) => {
    try {
        // req.body contains data sent in POST request
        // Frontend sends: { name: "Technology", description: "Tech posts" }
        const { name, description } = req.body;

        // Validation: check required dields BEFORE database call
        // Why? Fail fast - don't waste database resources on invalid data
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Category name required'
            });
        }

        // Generate slug from name

        const slug = generateSlug(name.trim());

        // Check if category with same name or slug exists
        // Why? Prevent duplicates, give user-friendly error message
        // Without this, prisma would through a cryptic unique constraint error
        const existingCategory = await prisma.category.findFirst({
            where: {
                OR: [
                    { name: { equals: name.trim(), mode: 'insensitive' } },
                    { slug }
                ]
            }
        });

        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'A category with this name already exists'
            });
        }

        // Create category in database
        // create() = INSERT INTO categories (name, slug, description) VALUES (...)
        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || null // Optional field
            }
        }); 

        // Status 201: HTTP code meaning "Created"
        // Different from 200 OK to indicate a new resource was created
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });
    } catch (error) {
        next(error);
    }
}

// UPDATE CATEGORY (Admin Only)
// PUT /api/categories/:id
// ==========================================================================
// Purpose: Update an existing category
// Why by IDs are stable, slugs might change
exports.updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params; // Category ID from URL
        const { name, description } = req.body;

        // First, check if category exists
        // Why separate query? Give better error message than Prisma's default
        const existingCategory = await prisma.category.findUnique({
            where: { id }
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Build update data object dynamically
        // Why? Only update fields that were provided
        const updateData = {};

        if (name && name.trim()) {
            // Check if new name conflicts with another category
            const nameConflict = await prisma.category.findFirst({
                where: {
                    name: { equals: name.trim(), mode: 'insensitive' },
                    NOT: { id } // Exclude current category from check
                }
            });

            if (nameConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'A category with this name already exists'
                });
            }

            updateData.name = name.trim();
            updateData.slug = generateSlug(name.trim()); // Regenerate slug
        }

        // description can be empty string (to clear it) or new value
        if (description !== undefined) {
            updateData.description = description?.trim() || null;
        }

        // Perform to update
        // update() = UPDATE categories SET ... WHERE id = ...
        const category = await prisma.category.update({
            where: { id },
            data: updateData
        });
    } catch (error) {
        next(error);
    }
};

// DELETE CATEGORY (Admin Only)
// DELETE /api/categories/:id
// ======================================================================
// Purpose: Delete a category
// Important: Posts with this category will have categoryId set to null
// This is defined in prisma schema: onDelete: SetNull
exports.deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if category exists before attempting delete
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { posts: true } }
            }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Delete the category
        // delete() = DELETE FROM categories WHERE id = ...
        // ====================================================================
        // What happens to posts in this category?
        // Our prisma schema says: categoryId string? @relation(onDelete: SetNull)
        // so posts are NOT DELETED - their categoryId becomes null
        // This is safer than CASCADE which would delete all posts!
        await prisma.category.delete({
            where: { id }
        });
        res.status(200).json({
            success: true,
            message: `Category "${category.name}" deleted successfully. ${category._count.posts} posts were uncategorized.`
        });
    } catch (error) {
        next(error);
    }
}