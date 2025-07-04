import React from "react";

interface EmailListProps {
    emails: string[];
    selectedEmail: string | null;
    onEmailSelect: (email: string) => void;
}

const EmailList: React.FC<EmailListProps> = ({
    emails,
    selectedEmail,
    onEmailSelect,
}) => {
    return (
        <div className="sidebar">
            <div className="panel-header">Email Templates</div>
            <div className="email-list">
                {emails.length > 0 ? (
                    emails.map((email, index) => (
                        <div
                            key={index}
                            className={`email-item ${selectedEmail === email ? "selected" : ""
                                }`}
                            onClick={() => onEmailSelect(email)}
                        >
                            <span className="email-name">{email.replace(".cshtml", "")}</span>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📁</div>
                        <div className="empty-state-text">
                            No email templates found. Please enter a valid directory path and
                            click "Load Emails".
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailList;
