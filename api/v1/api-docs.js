export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Build the absolute URL for the Swagger spec
  const host = req.headers.host || 'localhost:3003';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const specUrl = `${protocol}://${host}/api/v1/swagger`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Figma Frontend Extractor API - Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css">
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: sans-serif;
        }
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #f5f5f5;
        }
        .loading p {
          font-size: 16px;
          color: #666;
        }
        .error {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #f5f5f5;
          color: #d32f2f;
        }
        .error pre {
          background: white;
          padding: 20px;
          border-radius: 4px;
          max-width: 80%;
          overflow-x: auto;
        }
        #swagger-ui {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <div id="loading" class="loading">
        <p>Loading Swagger UI...</p>
      </div>
      
      <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-standalone-preset.js"></script>
      <script>
        const specUrl = '${specUrl}';
        
        console.log('Swagger Spec URL:', specUrl);
        console.log('Page URL:', window.location.href);
        console.log('Host:', window.location.host);
        console.log('Protocol:', window.location.protocol);
        
        window.onload = async () => {
          const loadingDiv = document.getElementById('loading');
          const swaggerDiv = document.getElementById('swagger-ui');
          
          try {
            // Fetch the spec to verify it's accessible
            const specResponse = await fetch(specUrl);
            console.log('Spec fetch response status:', specResponse.status);
            
            if (!specResponse.ok) {
              throw new Error(\`Failed to fetch Swagger spec: \${specResponse.status} \${specResponse.statusText}\`);
            }
            
            const specData = await specResponse.json();
            console.log('Spec loaded successfully');
            console.log('Spec servers:', specData.servers);
            console.log('Spec paths:', Object.keys(specData.paths));
            
            // Hide loading, show Swagger UI
            loadingDiv.style.display = 'none';
            swaggerDiv.style.display = 'block';
            
            // Initialize Swagger UI
            window.ui = SwaggerUIBundle({
              url: specUrl,
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
              ],
              plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
              ],
              layout: 'StandaloneLayout',
              onComplete: () => {
                console.log('Swagger UI loaded successfully');
              }
            });
          } catch (error) {
            console.error('Error loading Swagger UI:', error);
            const errorHtml = '<div class="error">' +
              '<h2>Error Loading Swagger Documentation</h2>' +
              '<pre>' + error.message + '\\n\\nDebug Info:\\n- Spec URL: ' + specUrl + '\\n- Page URL: ' + window.location.href + '</pre>' +
              '</div>';
            loadingDiv.innerHTML = errorHtml;
          }
        };
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
