import React, { useState, useEffect } from "react";
import "./App.css";

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

function App() {
  const [directory, setDirectory] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.command) {
        case "emailsLoaded":
          setEmails(message.emails);
          setIsLoading(false);
          setError("");
          break;
        case "emailContent":
          setPreviewContent(message.content);
          setIsLoading(false);
          setError("");
          break;
        case "error":
          setError(message.message);
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    // Auto-focus on directory input field when component loads
    setTimeout(() => {
      const inputElement = document.querySelector(".directory-input input");
      if (inputElement instanceof HTMLElement) {
        inputElement.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleDirectoryChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDirectory(event.target.value);
  };

  const loadEmails = () => {
    if (!directory) {
      setError("Please enter a directory path");
      return;
    }
    setIsLoading(true);
    vscode.postMessage({
      command: "loadEmails",
      directory: directory,
    });
  };

  const previewEmail = (emailName: string) => {
    setSelectedEmail(emailName);
    setIsLoading(true);
    vscode.postMessage({
      command: "previewEmail",
      directory: directory,
      emailName: emailName,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      loadEmails();
    }
  };

  return (
    <div className="email-preview-container">
      <div className="app-header">
        <span
          role="img"
          aria-label="Email icon"
          style={{ marginRight: "10px", fontSize: "24px" }}
        >
          📧
        </span>
        <h1 className="app-title">Email Template Tester</h1>
        <div className="tooltip">
          <div className="tooltip-icon">?</div>
          <span className="tooltip-text">
            Enter a directory path containing HTML email templates, then click
            "Load Emails" to preview and test them.
          </span>
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
          ) : (
            "Load Emails"
          )}
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
                  className={`email-item ${
                    selectedEmail === email ? "selected" : ""
                  }`}
                  onClick={() => previewEmail(email)}
                >
                  <span className="email-name">
                    {email
                      .replace(".cshtml", "")
                      .replace(".html", "")
                      .replace(".htm", "")}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <div className="empty-state-text">
                  No email templates found. Please enter a valid directory path
                  and click "Load Emails".
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="preview-container">
          <div className="panel-header">
            {selectedEmail
              ? "Preview: " +
                selectedEmail
                  .replace(".cshtml", "")
                  .replace(".html", "")
                  .replace(".htm", "")
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
            ) : (
              !isLoading &&
              !previewContent && (
                <div className="empty-state">
                  <div className="empty-state-icon">📧</div>
                  <div className="empty-state-text">
                    Select an email template from the list to preview its
                    content.
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
