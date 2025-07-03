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
  // Get URI for the CSS and image files
  const cssUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "vscode.css")
  );
  const iconUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, "media", "email-icon.svg")
  );

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
        <link rel="stylesheet" href="${cssUri}">
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            const vscode = acquireVsCodeApi();
            
            const EmailPreview = function() {
                const [directory, setDirectory] = React.useState('');
                const [emails, setEmails] = React.useState([]);
                const [selectedEmail, setSelectedEmail] = React.useState(null);
                const [previewContent, setPreviewContent] = React.useState('');
                const [error, setError] = React.useState('');
                const [isLoading, setIsLoading] = React.useState(false);

                React.useEffect(() => {
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'emailsLoaded':
                                setEmails(message.emails);
                                setIsLoading(false);
                                setError('');
                                break;
                            case 'emailContent':
                                setPreviewContent(message.content);
                                setIsLoading(false);
                                setError('');
                                break;
                            case 'error':
                                setError(message.message);
                                setIsLoading(false);
                                break;
                        }
                    });
                    
                    // Auto-focus on directory input field when component loads
                    setTimeout(() => {
                        const inputElement = document.querySelector('.directory-input input');
                        if (inputElement) {
                            inputElement.focus();
                        }
                    }, 100);
                }, []);

                const handleDirectoryChange = (event) => {
                    setDirectory(event.target.value);
                };

                const loadEmails = () => {
                    if (!directory) {
                        setError('Please enter a directory path');
                        return;
                    }
                    setIsLoading(true);
                    vscode.postMessage({
                        command: 'loadEmails',
                        directory: directory
                    });
                };

                const previewEmail = (emailName) => {
                    setSelectedEmail(emailName);
                    setIsLoading(true);
                    vscode.postMessage({
                        command: 'previewEmail',
                        directory: directory,
                        emailName: emailName
                    });
                };
                
                const handleKeyDown = (event) => {
                    if (event.key === 'Enter') {
                        loadEmails();
                    }
                };

                return (
                    <div className="email-preview-container">
                        <div className="app-header">
                            <img src="${iconUri}" alt="Email icon" width="24" height="24" style={{ marginRight: '10px' }} />
                            <h1 className="app-title">Email Template Tester</h1>
                            <div className="tooltip">
                                <div className="tooltip-icon">?</div>
                                <span className="tooltip-text">Enter a directory path containing HTML email templates, then click "Load Emails" to preview and test them.</span>
                            </div>
                        </div>
                        <div className="directory-input">
                            <input 
                                type="text" 
                                value={directory}
                                onChange={handleDirectoryChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Enter email templates directory path"
                            />
                            <button onClick={loadEmails} disabled={isLoading}>
                                {isLoading ? (
                                    <span>
                                        <span className="loader-small"></span>
                                        Loading...
                                    </span>
                                ) : 'Load Emails'}
                            </button>
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                        
                        <div className="panel-container">
                            <div className="sidebar">
                                <div className="panel-header">Email Templates</div>
                                <div className="email-list">
                                    {emails.length > 0 ? (
                                        emails.map((email, index) => (
                                            <div 
                                                key={index}
                                                className={\`email-item \${selectedEmail === email ? 'selected' : ''}\`}
                                                onClick={() => previewEmail(email)}
                                            >
                                                <span className="email-name">
                                                    {email.replace('.cshtml', '').replace('.html', '').replace('.htm', '')}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📁</div>
                                            <div className="empty-state-text">
                                                No email templates found. Please enter a valid directory path and click "Load Emails".
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="preview-container">
                                <div className="panel-header">
                                    {selectedEmail 
                                        ? "Preview: " + selectedEmail.replace('.cshtml', '').replace('.html', '').replace('.htm', '') 
                                        : "Email Preview"}
                                </div>
                                <div className="preview-panel">
                                    {isLoading && (
                                        <div className="loading">
                                            <div className="loader"></div>
                                        </div>
                                    )}
                                    
                                    {!isLoading && previewContent ? (
                                        <iframe
                                            srcDoc={previewContent}
                                            title="Email Preview"
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            sandbox="allow-scripts allow-same-origin allow-popups"
                                        />
                                    ) : !isLoading && !previewContent && (
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📧</div>
                                            <div className="empty-state-text">
                                                Select an email template from the list to preview its content.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }

            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(React.createElement(EmailPreview));
        </script>
    </body>
    </html>`;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
