import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";

export default function Home() {
    const [fact, setFact] = useState<string>("Loading...");

    // Fetch a random cat fact when component loads
    useEffect(() => {
        fetch("https://catfact.ninja/fact")
            .then((res) => res.json())
            .then((data) => setFact(data.fact))
            .catch(() => setFact("Failed to load a cat fact 😿"));
    }, []);

    // Function to fetch a new cat fact
    const getNewFact = () => {
        setFact("Loading...");
        fetch("https://catfact.ninja/fact")
            .then((res) => res.json())
            .then((data) => setFact(data.fact))
            .catch(() => setFact("Failed to load a cat fact 😿"));
    };

    return (
        <>
            <Head title="Random Cat Facts" />
            <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black dark:bg-gray-900 dark:text-white transition-colors">
                <h1 className="text-3xl font-bold mb-4">🐱 Random Cat Facts</h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">{fact}</p>
                <button
                    onClick={getNewFact}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600"
                >
                    Get Another Fact
                </button>
            </div>
        </>
    );
}
