import React, { useState, useEffect } from 'react';
import * as vscode from 'vscode';

const EmailPreview = () => {
    const [directory, setDirectory] = useState('');
    const [emails, setEmails] = useState([]);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [previewContent, setPreviewContent] = useState('');

    const handleDirectoryChange = (event) => {
        setDirectory(event.target.value);
    };

    const loadEmails = async () => {
        if (!directory) return;
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Read all files from the directory
            const files = fs.readdirSync(directory);
            const emailFiles = files.filter(file => 
                file.endsWith('.html') || file.endsWith('.htm')
            );
            
            setEmails(emailFiles);
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading emails: ${error.message}`);
        }
    };

    const previewEmail = async (emailName) => {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const content = fs.readFileSync(path.join(directory, emailName), 'utf8');
            setPreviewContent(content);
            setSelectedEmail(emailName);
        } catch (error) {
            vscode.window.showErrorMessage(`Error previewing email: ${error.message}`);
        }
    };

    return (
        <div className="email-preview-container">
            <div className="directory-input">
                <input 
                    type="text" 
                    value={directory}
                    onChange={handleDirectoryChange}
                    placeholder="Enter email templates directory path"
                />
                <button onClick={loadEmails}>Load Emails</button>
            </div>
            
            <div className="email-list">
                {emails.map((email, index) => (
                    <div 
                        key={index}
                        className={`email-item ${selectedEmail === email ? 'selected' : ''}`}
                        onClick={() => previewEmail(email)}
                    >
                        {email}
                    </div>
                ))}
            </div>
            
            {previewContent && (
                <div className="preview-panel">
                    <iframe
                        srcDoc={previewContent}
                        title="Email Preview"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                    />
                </div>
            )}
        </div>
    );
};

export default EmailPreview;
