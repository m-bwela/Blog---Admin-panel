import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { uploadImage, updateUserProfile } from "@/lib/api";

export default function UserProfilePage() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        avatar: user?.avatar || "",
        password: "",
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Handle avatar file change
    const handleAvatarChange = (e) => {
        setForm((prev) => ({ ...prev, avatar: e.target.files[0] }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let avatarUrl = form.avatar;

            // If user selected a File, upload it first
            if (form.avatar instanceof File) {
                const fd = new FormData();
                fd.append('image', form.avatar);
                const uploadRes = await uploadImage(fd);
                avatarUrl = uploadRes.data.data.url;
            }

            const payload = {
                name: form.name,
                email: form.email,
                avatar: avatarUrl,
            };

            if (form.password) payload.password = form.password;

            const res = await updateUserProfile(payload);
            const updatedUser = res.data.data.user;

            // Update auth state and localStorage
            updateUser(updatedUser);

            // Clear password from form
            setForm((prev) => ({ ...prev, password: '' }));

            alert('Profile updated successfully');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update profile');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">User Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="text-sm font-medium">Name:</span>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
                    />
                </label>
                <br />
                <label className="block">
                    <span className="text-sm font-medium">Email:</span>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
                    />
                </label>
                <br />
                <label className="block">
                    <span className="text-sm font-medium">Avatar:</span>
                    <input
                        type="file"
                        name="avatar"
                        onChange={handleAvatarChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
                    />
                </label>
                <br />
                <label className="block">
                    <span className="text-sm font-medium">Password:</span>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:border-indigo-500 sm:text-sm"
                    />
                </label>
                <br />
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                >
                    Update Profile
                </button>
            </form>
            {user?.avatar && (
                <div className="mt-6">
                    <img src={user.avatar} alt="User Avatar" className="w-24 h-24 rounded-full" width={100} />
                </div>
            )}
        </div>
    )
}