import { type RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async (ctx) => {
  const writableStream = ctx.getWritableStream();
  const writer = writableStream.getWriter();
  const encoder = new TextEncoder();

  try {
    //   const stream = await getStreamableResponse(ctx.params["input"], []);
  } catch (err) {
    console.error("Stream error:", err);
    writer.write(encoder.encode("Error: during streaming"));
  } finally {
    writer.close();
  }
};
