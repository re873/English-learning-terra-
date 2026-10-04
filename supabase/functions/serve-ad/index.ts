// Edge function: serve-ad
// Proxies the Adscod interstitial ad API so the browser never sees the API key.
// The X-Adscod-Key header is set server-side from the ADSCOP_API_KEY secret.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADSCOD_URL =
  "https://api.adscod.com/api/v1/serve?source=publisher&placementId=d0bf06e7-a6f1-41ff-ae09-5498b954504c";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ADSCOP_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Ad key not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resp = await fetch(ADSCOD_URL, {
      method: "GET",
      headers: {
        "X-Adscod-Key": apiKey,
        "Accept": "application/json",
      },
    });

    const contentType = resp.headers.get("content-type") || "";
    const body = await resp.text();

    return new Response(body, {
      status: resp.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType || "application/json",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to fetch ad." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
