import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mediaType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/png",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are a display ad design analyst. Analyze this advertisement image and extract its visual design properties so we can recreate a similar style.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "colors": {
    "background": "#hex",
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "text": "#hex"
  },
  "border": {
    "enabled": true/false,
    "style": "solid" | "dashed" | "double",
    "width": number (1-8),
    "color": "#hex",
    "radius": number (0-24)
  },
  "gradient": {
    "enabled": true/false,
    "type": "linear" | "radial",
    "direction": number (0-360),
    "stops": [{"color": "#hex", "position": 0}, {"color": "#hex", "position": 100}]
  },
  "layout": {
    "logoPosition": "top" | "center" | "bottom",
    "variant": "a" | "b" | "c",
    "whiteLogoContainer": true/false
  },
  "typography": {
    "weight": "light" | "normal" | "bold",
    "style": "serif" | "sans-serif" | "mixed"
  },
  "mood": "minimal" | "elegant" | "bold" | "warm" | "corporate",
  "description": "One sentence describing the overall design approach"
}

Analyze the colors precisely from the image. If there's a gradient background, capture the gradient stops. Note the border treatment, logo placement, and overall layout style. Be precise with hex colors — sample them from the actual image.`,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
    }

    // Parse the JSON from the response
    let analysis;
    try {
      // Strip any markdown code fences if present
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      analysis = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: textContent.text },
        { status: 500 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Inspiration analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
