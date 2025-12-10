"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";

export type MessageType = "success" | "error" | "warning" | "info";

export interface CemexMessage {
  id: string;
  type: MessageType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "destructive";
  }>;
}

interface CemexMessageSystemProps {
  messages: CemexMessage[];
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * CEMEX Message System Component
 * Standardized messaging system with 5-second duration for success/error states
 * Implements CEMEX-specific messaging requirements
 */
export function CemexMessageSystem({ messages, onDismiss, className }: CemexMessageSystemProps) {
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    messages.forEach((message) => {
      if (!visibleMessages.has(message.id)) {
        setVisibleMessages(prev => new Set(prev).add(message.id));

        // Auto-dismiss after specified duration (default 5 seconds for CEMEX)
        const duration = message.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            onDismiss(message.id);
            setVisibleMessages(prev => {
              const newSet = new Set(prev);
              newSet.delete(message.id);
              return newSet;
            });
          }, duration);
        }
      }
    });
  }, [messages, visibleMessages, onDismiss]);

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getMessageVariant = (type: MessageType) => {
    switch (type) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "default";
      default:
        return "default";
    }
  };

  const getMessageStyles = (type: MessageType) => {
    switch (type) {
      case "success":
        return "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200";
      case "error":
        return "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200";
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";
      default:
        return "";
    }
  };

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed top-4 right-4 z-50 space-y-2 max-w-md", className)}>
      {messages.map((message) => (
        <Alert
          key={message.id}
          variant={getMessageVariant(message.type)}
          className={cn(
            "animate-in slide-in-from-right-full duration-300",
            getMessageStyles(message.type),
            "shadow-lg border-l-4"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getMessageIcon(message.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              {message.title && (
                <div className="font-semibold mb-1">{message.title}</div>
              )}
              <AlertDescription className="text-sm">
                {message.message}
              </AlertDescription>
              
              {message.actions && message.actions.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {message.actions.map((action, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={action.variant || "outline"}
                      onClick={action.onClick}
                      className="h-7 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {(message.dismissible ?? true) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-transparent"
                onClick={() => onDismiss(message.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </Alert>
      ))}
    </div>
  );
}

/**
 * Hook for managing CEMEX messages
 */
export function useCemexMessages() {
  const [messages, setMessages] = useState<CemexMessage[]>([]);

  const addMessage = (message: Omit<CemexMessage, "id">) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: CemexMessage = {
      id,
      duration: 5000, // Default 5 seconds for CEMEX
      dismissible: true,
      ...message,
    };
    
    setMessages(prev => [...prev, newMessage]);
    return id;
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  // CEMEX-specific message helpers
  const showSuccess = (message: string, title?: string) => {
    return addMessage({
      type: "success",
      title: title || "Success",
      message,
    });
  };

  const showError = (message: string, title?: string) => {
    return addMessage({
      type: "error",
      title: title || "Error",
      message,
      duration: 7000, // Slightly longer for errors
    });
  };

  const showParameterSaved = () => {
    return addMessage({
      type: "success",
      title: "Parameter Saved",
      message: "YOUR CHANGES HAVE BEEN SAVED",
    });
  };

  const showParameterDeleted = () => {
    return addMessage({
      type: "success",
      title: "Parameter Deleted",
      message: "YOUR PARAMETER HAS BEEN DELETED SUCCESSFULLY",
    });
  };

  const showDuplicateError = () => {
    return addMessage({
      type: "error",
      title: "Duplicate Parameter",
      message: "The Registry already exists with the same service, key, environment, and region combination.",
    });
  };

  const showValidationError = (message: string) => {
    return addMessage({
      type: "error",
      title: "Validation Error",
      message,
    });
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    showSuccess,
    showError,
    showParameterSaved,
    showParameterDeleted,
    showDuplicateError,
    showValidationError,
  };
}
