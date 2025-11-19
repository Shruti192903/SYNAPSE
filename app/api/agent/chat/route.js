export async function POST(request) {
  const body = await request.json();
  // Handle chat logic or forward to your backend here
  return new Response(JSON.stringify({ message: 'Chat response' }), { status: 200 });
}
