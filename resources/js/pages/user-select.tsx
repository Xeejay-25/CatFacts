import React, { useState, useEffect, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export default function UserSelect() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        try {
            // Add timestamp to prevent browser caching
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/users?t=${timestamp}`);
            const data = await response.json();
            if (data.success) {
                setUsers(data.data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const selectUser = useCallback((user: User) => {
        console.log('Selecting user:', user.name);

        // Store the user data in sessionStorage
        try {
            sessionStorage.setItem('selectedUserId', user.id.toString());
            sessionStorage.setItem('selectedUser', JSON.stringify(user));

            console.log('User stored, navigating to game...');
            // Navigate to game
            router.visit('/game');

        } catch (error) {
            console.error('SessionStorage error:', error);
            alert('Error selecting user. Please try again.');
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Refresh users when window gains focus (user navigates back)
    useEffect(() => {
        const handleFocus = () => {
            fetchUsers();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchUsers]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                <div className="text-xl text-gray-700">Loading players...</div>
            </div>
        );
    }

    return (
        <>
            <Head title="Select Player - Cat Facts Memory Game" />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-gray-800 mb-4">Select Player</h1>
                        <p className="text-xl text-gray-600">Choose a player to continue your gaming journey</p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => selectUser(user)}
                                    className="bg-white bg-opacity-90 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-center">
                                        <div className="text-4xl mb-3">🎮</div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{user.name}</h3>
                                        <div className="text-sm text-gray-600 space-y-2">
                                            <div className="flex justify-between">
                                                <span>Email:</span>
                                                <span className="font-semibold">{user.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Joined:</span>
                                                <span className="font-semibold">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-3 pt-2 border-t">Click to select</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {users.length === 0 && (
                            <div className="text-center">
                                <p className="text-xl text-gray-600">No players found. Create a new player to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}