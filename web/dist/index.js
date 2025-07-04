// Email Preview React App
/* global document, React, ReactDOM, acquireVsCodeApi, window */

// This code will run in the context of a browser/webview
// where React and ReactDOM are already loaded globally from the script tags in HTML

// Execute when the document is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    // Get the root element where we'll mount our React app
    const root = document.getElementById("root");
    const vscode = acquireVsCodeApi();

    // Create the EmailPreview component
    const EmailPreview = () => {
        const [directory, setDirectory] = React.useState("");
        const [emails, setEmails] = React.useState([]);
        const [selectedEmail, setSelectedEmail] = React.useState(null);
        const [previewContent, setPreviewContent] = React.useState("");
        const [error, setError] = React.useState("");
        const [isLoading, setIsLoading] = React.useState(false);

        React.useEffect(() => {
            const handleMessage = (event) => {
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
                if (inputElement) {
                    inputElement.focus();
                }
            }, 100);

            return () => {
                window.removeEventListener("message", handleMessage);
            };
        }, []);

        const handleDirectoryChange = (event) => {
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

        const previewEmail = (emailName) => {
            setSelectedEmail(emailName);
            setIsLoading(true);
            vscode.postMessage({
                command: "previewEmail",
                directory: directory,
                emailName: emailName,
            });
        };

        const handleKeyDown = (event) => {
            if (event.key === "Enter") {
                loadEmails();
            }
        };

        return React.createElement(
            "div",
            { className: "email-preview-container" },
            // Header section
            React.createElement(
                "div",
                { className: "app-header" },
                window.iconUri
                    ? React.createElement("img", {
                        src: window.iconUri,
                        alt: "Email icon",
                        width: 24,
                        height: 24,
                        style: { marginRight: "10px" },
                    })
                    : React.createElement(
                        "span",
                        {
                            role: "img",
                            "aria-label": "Email icon",
                            style: { marginRight: "10px", fontSize: "24px" },
                        },
                        "📧"
                    ),
                React.createElement(
                    "h1",
                    { className: "app-title" },
                    "Email Template Tester"
                ),
                React.createElement(
                    "div",
                    { className: "tooltip" },
                    React.createElement("div", { className: "tooltip-icon" }, "?"),
                    React.createElement(
                        "span",
                        { className: "tooltip-text" },
                        'Enter a directory path containing HTML email templates, then click "Load Emails" to preview and test them.'
                    )
                )
            ),
            // Directory input
            React.createElement(
                "div",
                { className: "directory-input" },
                React.createElement("input", {
                    type: "text",
                    value: directory,
                    onChange: handleDirectoryChange,
                    onKeyDown: handleKeyDown,
                    placeholder: "Enter email templates directory path",
                }),
                React.createElement(
                    "button",
                    {
                        onClick: loadEmails,
                        disabled: isLoading,
                    },
                    isLoading
                        ? React.createElement(
                            "span",
                            null,
                            React.createElement("span", { className: "loader-small" }),
                            "Loading..."
                        )
                        : "Load Emails"
                )
            ),
            // Error message
            error &&
            React.createElement("div", { className: "error-message" }, error),
            // Panel container
            React.createElement(
                "div",
                { className: "panel-container" },
                // Sidebar
                React.createElement(
                    "div",
                    { className: "sidebar" },
                    React.createElement(
                        "div",
                        { className: "panel-header" },
                        "Email Templates"
                    ),
                    React.createElement(
                        "div",
                        { className: "email-list" },
                        emails.length > 0
                            ? emails.map((email, index) =>
                                React.createElement(
                                    "div",
                                    {
                                        key: index,
                                        className: `email-item ${selectedEmail === email ? "selected" : ""
                                            }`,
                                        onClick: () => previewEmail(email),
                                    },
                                    React.createElement(
                                        "span",
                                        { className: "email-name" },
                                        email
                                            .replace(".cshtml", "")
                                            .replace(".html", "")
                                            .replace(".htm", "")
                                    )
                                )
                            )
                            : React.createElement(
                                "div",
                                { className: "empty-state" },
                                React.createElement(
                                    "div",
                                    { className: "empty-state-icon" },
                                    "📁"
                                ),
                                React.createElement(
                                    "div",
                                    { className: "empty-state-text" },
                                    'No email templates found. Please enter a valid directory path and click "Load Emails".'
                                )
                            )
                    )
                ),
                // Preview container
                React.createElement(
                    "div",
                    { className: "preview-container" },
                    React.createElement(
                        "div",
                        { className: "panel-header" },
                        selectedEmail
                            ? "Preview: " +
                            selectedEmail
                                .replace(".cshtml", "")
                                .replace(".html", "")
                                .replace(".htm", "")
                            : "Email Preview"
                    ),
                    React.createElement(
                        "div",
                        { className: "preview-panel" },
                        isLoading &&
                        React.createElement(
                            "div",
                            { className: "loading" },
                            React.createElement("div", { className: "loader" })
                        ),
                        !isLoading && previewContent
                            ? React.createElement("iframe", {
                                srcDoc: previewContent,
                                title: "Email Preview",
                                width: "100%",
                                height: "100%",
                                frameBorder: "0",
                                sandbox: "allow-scripts allow-same-origin allow-popups",
                            })
                            : !isLoading &&
                            !previewContent &&
                            React.createElement(
                                "div",
                                { className: "empty-state" },
                                React.createElement(
                                    "div",
                                    { className: "empty-state-icon" },
                                    "📧"
                                ),
                                React.createElement(
                                    "div",
                                    { className: "empty-state-text" },
                                    "Select an email template from the list to preview its content."
                                )
                            )
                    )
                )
            )
        );
    };

    // Render the EmailPreview component
    ReactDOM.render(React.createElement(EmailPreview), root);
});
