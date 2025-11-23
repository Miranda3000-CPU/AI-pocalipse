import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

const env = await load();
const GEMINI_API_KEY = env["GEMINI_API_KEY"] || Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/gemini")) {
        if (req.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }
        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY not found in .env file.");
            return new Response("API key not configured on server.", { status: 500 });
        }

        try {
            const { prompt, model } = await req.json();
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
            
            const payload = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };

            const geminiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return new Response(geminiResponse.body, {
                status: geminiResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error("Error proxying to Gemini:", error);
            return new Response("Error processing your request.", { status: 500 });
        }
    }

    return serveDir(req, {
        fsRoot: ".",
        urlRoot: "",
        showDirListing: true,
        enableCors: true,
    });
});
