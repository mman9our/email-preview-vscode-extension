const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('emailtester.previewEmails', () => {
        const panel = vscode.window.createWebviewPanel(
            'emailPreview',
            'Email Template Preview',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'loadEmails':
                        try {
                            const directory = message.directory;
                            // Check if directory exists
                            if (!fs.existsSync(directory)) {
                                panel.webview.postMessage({
                                    command: 'error',
                                    message: `Directory does not exist: ${directory}`
                                });
                                return;
                            }
                            // Read directory contents directly using fs
                            const files = fs.readdirSync(directory)
                                .filter(file => file.endsWith('.cshtml'))
                                .map(file => ({
                                    name: file,
                                    path: path.join(directory, file)
                                }));
                            panel.webview.postMessage({
                                command: 'emailsLoaded',
                                emails: files.map(f => f.name)
                            });
                        } catch (error) {
                            panel.webview.postMessage({
                                command: 'error',
                                message: `Error loading emails: ${error.message}`
                            });
                        }
                        break;

                    case 'previewEmail':
                        try {
                            const isLocal = true;
                            const emailsDirectory = message.directory;
                            // Remove .cshtml extension if present
                            const email = message.emailName.replace('.cshtml', '');
                            // Make API call to fetch email content
                            const apiUrl = 'http://localhost:3000/api/v1/EmailTester/PublishSendEamil';
                            // Construct URL manually to avoid encoding backslashes
                            const fullUrl = `${apiUrl}?readFromLocalDirectory=${isLocal}&directory=${emailsDirectory}&templateName=${email}&sendEmail=true`;
                            
                            fetch(fullUrl)
                            .then(response => {
                                if (!response.ok) {
                                    return response.text().then(text => {
                                        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
                                    });
                                }
                                return response.text();
                            })
                            .then(content => {
                                if (!content) {
                                    throw new Error('No content received from API');
                                }
                                panel.webview.postMessage({
                                    command: 'emailContent',
                                    content: content
                                });
                            })
                            .catch(error => {
                                console.error('API Error:', error);
                                panel.webview.postMessage({
                                    command: 'error',
                                    message: `Error fetching email content: ${error.message}`
                                });
                            });
                        } catch (error) {
                            console.error('Preview Error:', error);
                            panel.webview.postMessage({
                                command: 'error',
                                message: `Error previewing email: ${error.message}`
                            });
                        }
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

export function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Template Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
        <style>
            :root {
                --primary-color: #0078d4;
                --primary-hover: #106ebe;
                --secondary-color: #f3f3f3;
                --text-color: #333;
                --border-color: #e0e0e0;
                --error-color: #d83b01;
                --success-color: #107c10;
                --shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                --border-radius: 6px;
                --transition: all 0.2s ease;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                margin: 0;
                padding: 0;
                color: var(--text-color);
                background-color: #f9f9f9;
            }
            
            .email-preview-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                padding: 20px;
                gap: 16px;
                box-sizing: border-box;
            }
            
            /* Header Section */
            .app-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .app-title {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
                color: var(--primary-color);
            }
            
            /* Directory Input Section */
            .directory-input {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                background-color: white;
                padding: 12px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }
            
            .directory-input input {
                flex: 1;
                padding: 10px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                font-size: 14px;
                transition: var(--transition);
                outline: none;
            }
            
            .directory-input input:focus {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.2);
            }
            
            .directory-input button {
                padding: 10px 16px;
                background-color: var(--primary-color);
                color: white;
                border: none;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-weight: 500;
                margin-left: 10px;
                transition: var(--transition);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .directory-input button:hover {
                background-color: var(--primary-hover);
            }
            
            /* Email List Section */
            .panel-container {
                display: flex;
                flex: 1;
                gap: 16px;
                height: calc(100vh - 150px);
            }
            
            .sidebar {
                width: 300px;
                background: white;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .panel-header {
                padding: 12px 16px;
                font-weight: 500;
                border-bottom: 1px solid var(--border-color);
                background-color: var(--secondary-color);
                color: var(--text-color);
            }
            
            .email-list {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }
            
            .email-item {
                padding: 10px 12px;
                cursor: pointer;
                border-radius: var(--border-radius);
                transition: var(--transition);
                margin-bottom: 4px;
                font-size: 14px;
                display: flex;
                align-items: center;
                position: relative;
            }
            
            .email-item:hover {
                background-color: var(--secondary-color);
            }
            
            .email-item.selected {
                background-color: var(--primary-color);
                color: white;
                font-weight: 500;
            }
            
            .email-item.selected:hover {
                background-color: var(--primary-hover);
            }
            
            .email-item::before {
                content: '📧';
                margin-right: 8px;
                font-size: 16px;
            }
            
            .email-name {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Preview Panel */
            .preview-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: white;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
                overflow: hidden;
            }
            
            .preview-panel {
                flex: 1;
                overflow: hidden;
                background-color: white;
                position: relative;
            }
            
            .preview-panel iframe {
                width: 100%;
                height: 100%;
                border: none;
                background: white;
            }
            
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #666;
                text-align: center;
                padding: 20px;
            }
            
            .empty-state-icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: var(--border-color);
            }
            
            .empty-state-text {
                font-size: 16px;
                max-width: 300px;
                line-height: 1.5;
            }
            
            /* Error Message */
            .error-message {
                color: var(--error-color);
                background-color: rgba(216, 59, 1, 0.1);
                padding: 10px 12px;
                border-radius: var(--border-radius);
                margin-bottom: 10px;
                font-size: 14px;
                display: flex;
                align-items: center;
            }
            
            .error-message::before {
                content: '⚠️';
                margin-right: 8px;
            }
            
            /* Loading State */
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
            }
            
            .loader {
                border: 4px solid rgba(0, 120, 212, 0.1);
                border-left-color: var(--primary-color);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
            }
            
            .loader-small {
                display: inline-block;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-left-color: white;
                border-radius: 50%;
                width: 14px;
                height: 14px;
                animation: spin 1s linear infinite;
                margin-right: 8px;
                vertical-align: middle;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* Tooltip */
            .tooltip {
                position: relative;
                display: inline-block;
                margin-left: 8px;
                cursor: pointer;
            }
            
            .tooltip-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background-color: var(--border-color);
                color: var(--text-color);
                font-size: 12px;
                font-weight: bold;
            }
            
            .tooltip-text {
                visibility: hidden;
                width: 200px;
                background-color: #333;
                color: #fff;
                text-align: center;
                border-radius: 6px;
                padding: 8px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 12px;
                pointer-events: none;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .tooltip:hover .tooltip-text {
                visibility: visible;
                opacity: 1;
            }
        </style>
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
                
                // Handle keyboard shortcut for loading emails
                const handleKeyDown = (event) => {
                    if (event.key === 'Enter') {
                        loadEmails();
                    }
                };

                // Removed duplicate code

                return (
                    <div className="email-preview-container">
                        <div className="app-header">
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
    deactivate
}
