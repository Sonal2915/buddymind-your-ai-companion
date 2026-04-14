import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "No image data provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert facial emotion recognition system, similar to DeepFace. Analyze the face in the image with high accuracy.

CRITICAL RULES:
- A smiling face MUST be classified as Happy, NEVER as Fear or Angry
- Look carefully at mouth shape (upturned = happy), eye crinkles (crow's feet = genuine smile)
- Raised eyebrows with open mouth = Surprise
- Furrowed brows, tight lips = Angry
- Downturned mouth, droopy eyes = Sad
- Wide eyes, tense face, NO smile = Fear
- Relaxed face, neutral mouth = Neutral
- Wrinkled nose, raised upper lip = Disgust

Also estimate the bounding box of the face as percentages of image dimensions (0-100 for x, y, width, height).
If no face is detected, return emotion "No Face" with 0 confidence.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Detect the primary emotion on the face in this image. Return the dominant emotion, confidence, and face bounding box.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${image_base64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_face_emotion",
                description: "Report the detected facial emotion and face location.",
                parameters: {
                  type: "object",
                  properties: {
                    emotion: {
                      type: "string",
                      enum: ["Happy", "Sad", "Angry", "Neutral", "Fear", "Surprise", "Disgust", "No Face"],
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence percentage 0-100",
                    },
                    face_box: {
                      type: "object",
                      description: "Bounding box as percentage of image dimensions",
                      properties: {
                        x: { type: "number", description: "Left edge %" },
                        y: { type: "number", description: "Top edge %" },
                        width: { type: "number", description: "Width %" },
                        height: { type: "number", description: "Height %" },
                      },
                      required: ["x", "y", "width", "height"],
                      additionalProperties: false,
                    },
                    secondary_emotions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          emotion: { type: "string" },
                          confidence: { type: "number" },
                        },
                        required: ["emotion", "confidence"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["emotion", "confidence", "face_box"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "report_face_emotion" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("face-emotion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
