// Edge function: serve-ad
// Proxies the Adscod interstitial ad API so the browser never sees the API key.
// The X-Adscod-Key header is fetched from the app_config table (service role only).

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the Adscod API key from the app_config table (service role bypasses RLS)
    const configResp = await fetch(`${supabaseUrl}/rest/v1/app_config?key=eq.adscod_api_key&select=value`, {
      method: "GET",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!configResp.ok) {
      return new Response(
        JSON.stringify({ error: "Could not read ad key from config." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const configRows = await configResp.json();
    const apiKey = Array.isArray(configRows) && configRows.length > 0 ? configRows[0].value : null;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Ad key not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the ad from Adscod
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
