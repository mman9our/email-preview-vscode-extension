const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "emailtester.previewEmails",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "emailPreview",
        "Email Template Preview",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent(context, panel);
      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "loadEmails":
              try {
                const directory = message.directory;
                // Check if directory exists
                if (!fs.existsSync(directory)) {
                  panel.webview.postMessage({
                    command: "error",
                    message: `Directory does not exist: ${directory}`,
                  });
                  return;
                }
                // Read directory contents directly using fs
                const files = fs
                  .readdirSync(directory)
                  .filter((file) => file.endsWith(".cshtml"))
                  .map((file) => ({
                    name: file,
                    path: path.join(directory, file),
                  }));
                panel.webview.postMessage({
                  command: "emailsLoaded",
                  emails: files.map((f) => f.name),
                });
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Error loading emails: ${error.message}`,
                });
              }
              break;

            case "previewEmail":
              try {
                const emailsDirectory = message.directory;
                // Remove .cshtml extension if present
                const email = message.emailName.replace(".cshtml", "");
                // Make API call to fetch email content
                const apiUrl =
                  "http://localhost:3000/api/v1/EmailTester/PublishSendEamil";
                // Construct URL manually to avoid encoding backslashes
                const fullUrl = `${apiUrl}?readFromLocalDirectory=${true}&directory=${emailsDirectory}&templateName=${email}&sendEmail=true`;

                fetch(fullUrl)
                  .then((response) => {
                    if (!response.ok) {
                      return response.text().then((text) => {
                        throw new Error(
                          `HTTP error! status: ${response.status}, body: ${text}`
                        );
                      });
                    }
                    return response.text();
                  })
                  .then((content) => {
                    if (!content) {
                      throw new Error("No content received from API");
                    }
                    panel.webview.postMessage({
                      command: "emailContent",
                      content: content,
                    });
                  })
                  .catch((error) => {
                    panel.webview.postMessage({
                      command: "error",
                      message: `Error fetching email content: ${error.message}`,
                    });
                  });
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Error previewing email: ${error.message}`,
                });
              }
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(context, panel) {
  // Get path to the React application in the web/dist directory
  let scriptSrc = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.js")
  );
  let cssSrc = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "web", "dist", "index.css")
  );
  // Get URI for the email icon
  const iconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "email-icon.svg")
  );

  // Render our React email preview app
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <link rel="stylesheet" href="${cssSrc}" />
        <script>
          // Make icon URI available to the React component
          window.iconUri = "${iconUri}";
        </script>
    </head>
    <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id="root"></div>
        <script src="${scriptSrc}"></script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
