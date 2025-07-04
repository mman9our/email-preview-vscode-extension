import React from "react";
import { VSCodeProgressRing } from "@vscode/webview-ui-toolkit/react";

interface EmailPreviewProps {
    selectedEmail: string | null;
    previewContent: string;
    isLoading: boolean;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
    selectedEmail,
    previewContent,
    isLoading,
}) => {
    return (
        <div className="preview-container">
            <div className="panel-header">
                {selectedEmail
                    ? "Preview: " + selectedEmail.replace(".cshtml", "")
                    : "Email Preview"}
            </div>
            <div className="preview-panel">
                {isLoading && (
                    <div className="loading">
                        <VSCodeProgressRing />
                    </div>
                )}

                {!isLoading && previewContent ? (
                    <iframe
                        srcDoc={previewContent}
                        title="Email Preview"
                        width="100%"
                        height="100%"
                        sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                ) : (
                    !isLoading &&
                    !previewContent && (
                        <div className="empty-state">
                            <div className="empty-state-icon">📧</div>
                            <div className="empty-state-text">
                                Select an email template from the list to send it to your temp
                                folder.
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default EmailPreview;
