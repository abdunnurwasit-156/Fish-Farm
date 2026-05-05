import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const SYSTEM_PROMPT = `You are AquaFarm AI, an expert fish farming assistant with deep knowledge in:
- Aquaculture species: tilapia, catfish, carp, shrimp, salmon, trout, milkfish, pangasius, and more
- Fish diseases: identification, symptoms, treatment, and prevention
- Water quality management: pH, dissolved oxygen, ammonia, temperature, turbidity
- Feed management: feed rates, feed types, frequency, fasting schedules
- Pond management: stocking density, aeration, water changes, pond preparation
- Fish health: stress indicators, behavioral changes, mortality causes
- Harvest planning and growth optimization

You respond in the same language the user writes in. If the user writes in Bengali, respond fully in Bengali (day-to-day conversational Bangla, not formal).

When the user provides their pond context (species, pond size, fish count, biomass), use it to give personalized advice.

Guidelines:
- Be practical and actionable. Give specific recommendations, not vague advice.
- When diagnosing diseases from photos, describe visible symptoms you observe, list possible causes ranked by likelihood, and provide treatment steps.
- For water quality issues, always give safe ranges and corrective actions with dosing if applicable.
- Use metric units (kg, m², mg/L, °C).
- Keep responses concise but complete. Use bullet points for lists.
- If you're uncertain, say so and recommend consulting a local aquaculture expert.
- For disease mode questions, always ask about: species, age/size, symptoms onset, water parameters, feeding behavior changes.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const message = formData.get("message") as string ?? "";
    const mode = formData.get("mode") as string ?? "chat";
    const pondContextRaw = formData.get("pondContext") as string | null;
    const historyRaw = formData.get("history") as string ?? "[]";
    const imageFile = formData.get("image") as File | null;

    const history: Array<{ role: "user" | "assistant"; content: string }> = JSON.parse(historyRaw);
    const pondContext = pondContextRaw ? JSON.parse(pondContextRaw) : null;

    // Build system instruction
    let systemInstruction = SYSTEM_PROMPT;
    if (pondContext?.pond) {
      const { pond, stock } = pondContext;
      systemInstruction += `\n\nUser's pond context:
- Pond: ${pond.name}, ${pond.area_m2} m², ${pond.depth_m}m depth
- Species: ${stock?.species ?? "unknown"}, ${stock?.current_count ?? "?"} fish
- Avg weight: ${stock?.avg_weight_kg ?? "?"} kg
- Feed rate: ${stock?.feed_rate_pct ?? 3}% of body weight/day
- Location: ${pond.location_name ?? "not specified"}`;
    }
    if (mode === "disease") {
      systemInstruction += "\n\nThe user is in DISEASE IDENTIFICATION mode. Analyze any uploaded fish photos carefully for visible symptoms. Provide: 1) What you observe, 2) Likely diagnoses, 3) Treatment protocol.";
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    // Build Gemini chat history (convert from our format)
    const geminiHistory: Content[] = history.slice(-8).map(h => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });

    // Build the current user message parts
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      const mimeType = imageFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

      const result = await chat.sendMessage([
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        { text: message || "Please identify any diseases or issues with this fish." },
      ]);
      const reply = result.response.text();
      return NextResponse.json({ reply });
    } else {
      const result = await chat.sendMessage(message);
      const reply = result.response.text();
      return NextResponse.json({ reply });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ reply: "দুঃখিত, কিছু একটা ঠিক হয়নি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
