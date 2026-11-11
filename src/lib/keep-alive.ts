// AI calls can run for minutes without sending a byte, and Vercel's edge or the user's network
// may drop a connection that sits idle that long. Stream a space every few seconds while the work
// runs (leading whitespace is valid JSON), then the result. The status is already 200 by the time
// the work finishes, so failures are sent as { error, details } in the body.
export function keepAliveJson(work: () => Promise<unknown>, errorLabel: string): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const heartbeat = setInterval(() => controller.enqueue(encoder.encode(" ")), 5000);
            let body: unknown;
            try {
                body = await work();
            } catch (error) {
                console.error(`${errorLabel}:`, error);
                body = { error: errorLabel, details: error instanceof Error ? error.message : String(error) };
            } finally {
                clearInterval(heartbeat);
            }
            controller.enqueue(encoder.encode(JSON.stringify(body)));
            controller.close();
        },
    });
    return new Response(stream, { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
