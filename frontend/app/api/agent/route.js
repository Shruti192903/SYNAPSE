export async function POST(req) {
  const body = await req.json();

  const response = await fetch(
    fetch(`${process.env.BACKEND_URL}/api/agent/run`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  return new Response(response.body);
}
