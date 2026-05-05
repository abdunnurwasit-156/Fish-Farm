import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!lat || !lng || !apiKey || apiKey === "your_openweather_api_key") {
    return NextResponse.json({ error: "Weather API not configured" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();
    const rain = !!(data.rain || data.weather?.[0]?.main?.toLowerCase().includes("rain"));
    return NextResponse.json({
      temp: Math.round(data.main?.temp ?? 0),
      condition: data.weather?.[0]?.description ?? "unknown",
      rain,
      humidity: data.main?.humidity ?? null,
      wind_speed: data.wind?.speed ?? null,
      pressure: data.main?.pressure ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch weather" }, { status: 500 });
  }
}
