import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { audio_base64, mime_type } = await req.json();

    if (!audio_base64) {
      return new Response(
        JSON.stringify({ error: "No audio data provided" }),
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
              content: `You are an expert audio emotion analysis system. Analyze the provided audio recording and detect the speaker's emotional state. Consider vocal features like:
- Pitch (fundamental frequency and variation)
- Energy/loudness patterns
- Speech rate and rhythm
- Voice quality (breathiness, tension, tremor)
- Spectral characteristics (brightness, formant patterns)
- Prosody and intonation contours

Provide confidence scores that sum to 100. Be precise and nuanced in your analysis.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze the emotional content of this voice recording. Detect all emotions present and their confidence levels.",
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audio_base64,
                    format: mime_type?.includes("webm") ? "webm" : "wav",
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_emotions",
                description:
                  "Report the detected emotions from voice analysis with confidence scores.",
                parameters: {
                  type: "object",
                  properties: {
                    emotions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          label: {
                            type: "string",
                            enum: [
                              "Happy",
                              "Calm",
                              "Sad",
                              "Angry",
                              "Stressed",
                              "Fearful",
                              "Surprised",
                              "Disgusted",
                              "Neutral",
                            ],
                          },
                          confidence: {
                            type: "number",
                            description:
                              "Confidence percentage (0-100). All emotions should sum to 100.",
                          },
                        },
                        required: ["label", "confidence"],
                        additionalProperties: false,
                      },
                    },
                    analysis_summary: {
                      type: "string",
                      description:
                        "Brief summary of the vocal characteristics observed (pitch, energy, rhythm, quality).",
                    },
                  },
                  required: ["emotions", "analysis_summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "report_emotions" },
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
          JSON.stringify({ error: "Usage credits exhausted. Please add credits in Settings." }),
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
      console.error("No tool call in response:", JSON.stringify(data));
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
    console.error("voice-emotion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
