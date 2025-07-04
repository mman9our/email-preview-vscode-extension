import React from "react";

const AppHeader: React.FC = () => {
    return (
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
                <span className="tooltip-text">Enter a directory path containing cshtml email templates, then click 'Load Emails' to preview and test them</span>
            </div>
        </div>
    );
};

export default AppHeader;
