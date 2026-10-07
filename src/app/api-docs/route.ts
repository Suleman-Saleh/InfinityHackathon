// Interactive API documentation (Swagger UI) for public/openapi.yaml.
// Served as plain HTML so it needs no extra npm dependency; Swagger UI is loaded from a CDN.
const SWAGGER_VERSION = "5.17.14";

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NovaWorks PM · API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; } .topbar { display: none; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: false,
        withCredentials: true, // send the session cookie with "Try it out" requests
        docExpansion: "list",
        defaultModelsExpandDepth: 0,
      });
    </script>
  </body>
</html>`;

export function GET() {
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
