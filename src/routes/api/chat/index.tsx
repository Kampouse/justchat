import { type RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async () => {
  /*
  const writableStream = ctx.getWritableStream();
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();
  ctx.headers.set("Content-Type", "json");
  ctx.headers.set("Cache-Control", "no-cache");
  ctx.headers.set("Connection", "keep-alive");
  try {
    const value = ctx.url.searchParams.get("key");
    //simple way of sending stuff outbound
    // http://localhost:5173/api/chat/?input=%22terrible%22&key=hello
    if (value != process.env.KEY) {
      await writer.write(encoder.encode("Error: invalid key"));
      return;
    }
    const stream = await getStreamableResponse({
       input: ctx.url.searchParams.get("input") || "",
      }
      ctx.url.searchParams.get("input") || "",
      [],
    );
    for await (const chunk of stream) {
      const stringChunk =
        typeof chunk === "string" ? chunk : JSON.stringify(chunk);
      const jsonData = { data: stringChunk };
      const encodedChunk = encoder.encode(JSON.stringify(jsonData));
      await writer.write(encodedChunk);
    }
  } catch (err) {
    console.error("Stream error:", err);
    writer.write(encoder.encode("Error: during streaming"));
  } finally {
    writer.close();
  }
*/
};
