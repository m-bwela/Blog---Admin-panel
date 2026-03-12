// ============================================================
// USERS CONTROLLER
// Admin-only endpoints to manage users
// ============================================================

const prisma = require('../utils/prisma');

// ============================================================
// 1. GET ALL USERS (Admin Only)
// Route: GET /api/users
// ============================================================
exports.getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build filter conditions
        const where = {
            ...(role && { role }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            })
        };

        // Fetch users and count in parallel
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: { posts: true }
                    }
                }
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                users: users.map(user => ({
                    ...user,
                    postCount: user._count.posts
                })),
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
// 2. GET SINGLE USER (Admin Only)
// Route: GET /api/users/:id
// ============================================================
exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { posts: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...user,
                postCount: user._count.posts
            }
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 3. UPDATE USER (Admin Only)
// Route: PUT /api/users/:id
// ============================================================
// Admin can update: role, isActive status
// Users cannot change their own role (security)
exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, isActive, name, bio } = req.body;
        const adminId = req.user.id;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (id === adminId && isActive === false) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Prevent admin from removing their own admin role
        if (id === adminId && role && role !== 'ADMIN') {
            return res.status(400).json({
                success: false,
                message: 'You cannot remove your own admin role'
            });
        }

        // Build update data
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (name !== undefined) updateData.name = name;
        if (bio !== undefined) updateData.bio = bio;

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// ============================================================
// 4. DELETE USER (Admin Only)
// Route: DELETE /api/users/:id
// ============================================================
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: { select: { posts: true } }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (id === adminId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Delete user (posts will be handled by onDelete: SetNull in schema)
        await prisma.user.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: `User "${user.name}" deleted successfully. Their ${user._count.posts} posts are now without an author.`
        });
    } catch (error) {
        next(error);
    }
};