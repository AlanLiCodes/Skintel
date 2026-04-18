import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message, systemPrompt, history } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "Running in demo mode — no OpenAI API key configured. Add `OPENAI_API_KEY` to `.env.local` to enable full AI responses.",
      },
      { status: 200 }
    );
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...(history ?? []).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ message: "AI service error. Please try again." }, { status: 500 });
  }

  const data = await response.json();
  return NextResponse.json({
    message: data.choices?.[0]?.message?.content ?? "No response",
  });
}
