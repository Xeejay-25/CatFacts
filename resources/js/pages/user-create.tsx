import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';

export default function UserCreate() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [creating, setCreating] = useState(false);

    const createUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setCreating(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim() || `${name.trim().toLowerCase()}@catfacts.local`
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const newUser = data.data.user;

                // Store the new user in session
                sessionStorage.setItem('selectedUserId', newUser.id.toString());
                sessionStorage.setItem('selectedUser', JSON.stringify(newUser));

                // Navigate to game
                router.visit('/game');
            } else {
                // Handle validation errors specifically
                if (response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join('\n');
                    alert(errorMessages || 'Validation failed. Please check your input.');
                } else {
                    alert(data.message || 'Failed to create user. Please try again.');
                }
            }
        } catch (error) {
            console.error('Failed to create user:', error);
            alert('Error creating user. Please try again.');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <Head title="Create Player - Cat Facts Memory Game" />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                <div className="max-w-md mx-auto">
                    <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="text-6xl mb-4">✨</div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Player</h1>
                            <p className="text-gray-600">Start your memory game journey!</p>
                        </div>

                        <form onSubmit={createUser} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Player Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email (optional)
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!name.trim() || creating}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all duration-300"
                            >
                                {creating ? 'Creating...' : 'Create Player & Start Playing'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => router.visit('/play')}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                ← Back to options
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}