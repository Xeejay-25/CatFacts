import React, { useEffect, useState } from "react";
import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";

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
            {/* <Head title="Random Cat Facts" /> */}
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center"
                >
                    <h1 className="text-4xl font-extrabold text-indigo-700 mb-6 flex justify-center items-center gap-2">
                        🐱 Cat Facts
                    </h1>

                    <motion.p
                        key={fact} // triggers animation when fact changes
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-lg text-gray-800 mb-8 leading-relaxed"
                    >
                        {fact}
                    </motion.p>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={getNewFact}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        New Fact
                    </motion.button>
                </motion.div>
            </div>
        </>
    );
}
