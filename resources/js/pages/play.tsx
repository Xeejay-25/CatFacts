import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Play() {
    return (
        <>
            <Head title="Play - Cat Facts Memory Game" />
            <div className="min-h-screen bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <h1 className="text-5xl font-bold text-gray-800 mb-8">Ready to Play?</h1>
                    <p className="text-xl text-gray-600 mb-12">Choose how you want to start your memory game adventure!</p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8">
                            <div className="text-6xl mb-6">👤</div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Select Player</h2>
                            <p className="text-gray-600 mb-8">Choose from existing players</p>
                            <Link href="/play/select" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl transition">
                                Select Player
                            </Link>
                        </div>

                        <div className="bg-white bg-opacity-90 rounded-2xl shadow-xl p-8">
                            <div className="text-6xl mb-6">✨</div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Create Player</h2>
                            <p className="text-gray-600 mb-8">Start fresh with a new profile</p>
                            <Link href="/play/create" className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-xl transition">
                                Create Player
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}