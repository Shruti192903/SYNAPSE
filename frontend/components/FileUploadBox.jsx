'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X, AlertTriangle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ACCEPTED_TYPES = {
    'application/pdf': ['.pdf'],
    'text/csv': ['.csv'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
};

/**
 * Handles file drag and drop and displays the selected file.
 * @param {{file: File | null, setFile: (file: File | null) => void, disabled: boolean}} props
 */
export const FileUploadBox = ({ file, setFile, disabled = false }) => {
    
    const onDrop = (acceptedFiles, fileRejections) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
        
        if (fileRejections.length > 0) {
            const rejected = fileRejections[0].file;
            let errorMsg = `File rejected: ${rejected.name}.`;
            if (rejected.size > MAX_FILE_SIZE) {
                errorMsg += ` Size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`;
            } else {
                 errorMsg += ` Invalid file type. Only PDF, CSV, and common images are supported.`;
            }
            alert(errorMsg); // Use a simple alert for file rejection for now
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: ACCEPTED_TYPES,
        maxSize: MAX_FILE_SIZE,
        disabled,
    });
    
    const handleRemoveFile = (e) => {
        e.stopPropagation(); // Prevent the dropzone from re-opening
        setFile(null);
    };

    if (file) {
        return (
            <Card className="mb-2 p-3 border-l-4 border-primary/70">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-medium">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="truncate max-w-[200px] md:max-w-full">{file.name}</span>
                        <span className="text-muted-foreground text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRemoveFile} 
                        disabled={disabled}
                        className="h-6 w-6"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    This file will be included in your next request.
                </p>
            </Card>
        );
    }

    return (
        <div {...getRootProps()} className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors mb-2",
            isDragActive ? "border-primary bg-primary/10" : "border-input hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
        )}>
            <input {...getInputProps()} />
            <div className="flex flex-col items-center text-muted-foreground text-sm">
                <Upload className="w-5 h-5 mb-1" />
                <p>
                    {isDragActive ? "Drop the file here..." : "Drag 'n' drop a PDF, CSV, or Image, or click to select."}
                </p>
            </div>
        </div>
    );
};