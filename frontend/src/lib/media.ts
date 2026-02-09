/**
 * Media utilities for draft cleanup and session management.
 */

export async function cleanupDraftMedia(ids: number[]) {
    if (!ids || ids.length === 0) return;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    // Try to get XSRF-TOKEN
    let token = "";
    if (typeof document !== "undefined") {
        const raw = document.cookie
            .split(";")
            .map((p) => p.trim())
            .find((p) => p.startsWith("XSRF-TOKEN="));
        if (raw) {
            token = decodeURIComponent(raw.split("=")[1] ?? "");
        }
    }

    // Use fetch with keepalive for unmount/exit scenarios
    try {
        await fetch(`${base}/api/media/cleanup-draft`, {
            method: "POST",
            keepalive: true,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(token ? { "X-XSRF-TOKEN": token } : {}),
            },
            body: JSON.stringify({ ids }),
            credentials: "include", // Important for Sanctum session/cookie
        });
    } catch (e) {
        console.error("Failed to cleanup draft media:", e);
    }
}
