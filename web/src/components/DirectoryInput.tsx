import React from 'react';

interface DirectoryInputProps {
    directory: string;
    isLoading: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    onLoadClick: () => void;
}

const DirectoryInput: React.FC<DirectoryInputProps> = ({
    directory,
    isLoading,
    onChange,
    onKeyDown,
    onLoadClick
}) => {
    return (
        <div className="directory-input">
            <input
                type="text"
                value={directory}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="Enter email templates directory path"
            />
            <button onClick={onLoadClick} disabled={isLoading}>
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
    );
};

export default DirectoryInput;
