import React, { useState, useEffect } from "react";
import "./App.css";
import AppHeader from "./components/AppHeader";
import DirectoryInput from "./components/DirectoryInput";
import ErrorMessage from "./components/ErrorMessage";
import EmailList from "./components/EmailList";
import EmailPreview from "./components/EmailPreview";

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

function App() {
  const [directory, setDirectory] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="email-preview-container">
      <AppHeader />

      <DirectoryInput
        directory={directory}
        isLoading={isLoading}
        onChange={handleDirectoryChange}
        onKeyDown={handleKeyDown}
        onLoadClick={loadEmails}
      />

      <ErrorMessage message={error} />

      <div className="panel-container">
        <EmailList
          emails={emails}
          selectedEmail={selectedEmail}
          onEmailSelect={previewEmail}
        />

        <EmailPreview
          selectedEmail={selectedEmail}
          previewContent={previewContent}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
