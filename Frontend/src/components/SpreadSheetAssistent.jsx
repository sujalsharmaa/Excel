import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Copy, MinimizeIcon, MaximizeIcon } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/Store/useStore.js';
import LoadingSpinner from './LoadingSpinner';

const SpreadsheetAssistant = ({ hotInstance }) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef(null);
  
  const { 
    fileUrl, 
    fileUserName, 
    isEmbedding, 
    setIsEmbedding 
  } = useAuthStore();

  useEffect(() => {
    if (fileUrl && fileUserName) {
      startEmbeddingProcess(fileUrl, fileUserName);
    }
  }, [fileUrl, fileUserName]);

  const startEmbeddingProcess = async (url, name) => {
    setIsEmbedding(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/embed`,
        {
          fileUrl: url,
          fileNameFromUser: name
        },
        {
          withCredentials: true 
        }
      );

      if (response.data.success) {
        console.log("Embedding complete!");
      }
    } catch (error) {
      console.error("Error during pre-embedding:", error);
    } finally {
      setIsEmbedding(false); 
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isCollapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const executeSpreadsheetAction = (action) => {
    try {
      if (!action.type || !hotInstance) return false;

      console.log("Executing Action ->", action);

      // Default variables
      const row = action.row !== undefined ? Number(action.row) : 0;
      const col = action.col !== undefined ? Number(action.col) : 0;
      const count = action.count ? Number(action.count) : 1;

      switch (action.type) {
        case 'SET_CELL_VALUE':
          hotInstance.setDataAtCell(row, col, action.value);
          break;
        
        case 'SET_FORMULA':
          hotInstance.setDataAtCell(row, col, String(action.formula));
          break;
        
        // --- NEW FEATURES ADDED BELOW ---
        
        case 'DELETE_ROW':
          // Removes 'count' number of rows starting from 'row' index
          hotInstance.alter('remove_row', row, count);
          break;
          
        case 'CREATE_ROW':
          // Inserts 'count' number of empty rows at 'row' index
          hotInstance.alter('insert_row_above', row, count);
          break;
          
        case 'HIGHLIGHT_CELL':
          // Adds a CSS class to the specific cell. 
          // Note: action.className allows AI to specify colors (e.g., 'highlight-yellow', 'highlight-red')
          hotInstance.setCellMeta(row, col, 'className', action.className || 'highlight-yellow');
          hotInstance.render(); // Force re-render to show the styling immediately
          break;

        default:
          console.warn('Unknown action type:', action.type);
          return false;
      }
      return true;
    } catch (error) {
      console.error('Error executing spreadsheet action:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !hotInstance) return;

    setIsProcessing(true);
    const newMessage = { type: "user", content: userInput };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/chat`,
        {
          fileUrl: fileUrl,
          fileNameFromUser: fileUserName,
          messages: [{ role: "user", content: userInput }],
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      let assistantReply = "Sorry, I couldn't understand that.";
      const rawData = response.data.response;

      if (typeof rawData === 'string') {
        const cleanText = rawData.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
          try {
            const parsed = JSON.parse(cleanText);
            if (parsed.actions && Array.isArray(parsed.actions)) {
              parsed.actions.forEach(executeSpreadsheetAction);
            }
            assistantReply = parsed.response || "I have updated the spreadsheet.";
          } catch (err) {
            assistantReply = cleanText; 
          }
        } else {
          assistantReply = cleanText;
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        if (rawData.actions && Array.isArray(rawData.actions)) {
          rawData.actions.forEach(executeSpreadsheetAction);
        }
        assistantReply = rawData.response || "I have updated the spreadsheet.";
      }

      setMessages((prev) => [
        ...prev,
        { type: "assistant", content: assistantReply },
      ]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          content: "Sorry, I encountered a network error. Please try again.",
        },
      ]);
    } finally {
      setUserInput("");
      setIsProcessing(false);
    }
  };

  return (
    <Card
      className={`fixed bottom-4 right-4 w-80 flex flex-col bg-[#161D26] shadow-lg transition-all duration-300 z-50 ${
        isCollapsed ? 'h-10 w-[200px]' : 'h-96'
      }`}
    >
      <div className="flex justify-between items-center p-2 border-b border-gray-700 shrink-0">
        <span className="text-sm font-medium text-white">Spreadsheet Assistant</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-6 w-6 hover:bg-green-500 bg-green-800 text-white"
        >
          {isCollapsed ? (
            <MaximizeIcon className="h-4 w-4" />
          ) : (
            <MinimizeIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <div className="relative flex flex-col flex-1 overflow-hidden">
          
          {isEmbedding && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#161D26]/90 backdrop-blur-sm">
              <LoadingSpinner />
              <p className="mt-4 text-sm font-medium text-slate-300 animate-pulse text-center px-4">
                Analyzing spreadsheet data...
              </p>
            </div>
          )}

          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-gray-400 text-sm">
                  Hello! I can help you modify your spreadsheet. Try:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Set values & formulas</li>
                    <li><span className="text-blue-400">Create or Delete rows</span></li>
                    <li><span className="text-yellow-400">Highlight cells</span></li>
                  </ul>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg max-w-[85%] text-sm ${
                    msg.type === "user"
                      ? "bg-blue-600 text-white self-end ml-auto w-fit h-fit"
                      : "bg-green-600 text-white self-start w-fit h-fit flex items-start gap-2"
                  }`}
                >
                  <span className="flex-1 whitespace-pre-wrap">{msg.content}</span>
                  {msg.type === "assistant" && (
                     <Button
                       size="icon"
                       variant="ghost"
                       onClick={() => navigator.clipboard.writeText(msg.content)}
                       className="h-5 w-5 text-gray-200 hover:text-white hover:bg-transparent p-0 shrink-0"
                     >
                       <Copy className="h-3 w-3" />
                     </Button>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex gap-2 shrink-0 bg-[#161D26]">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isProcessing || isEmbedding}
              className="flex-1 text-black bg-slate-200"
            />
            <Button
              type="submit"
              disabled={isProcessing || isEmbedding}
              size="icon"
              className="border-2 bg-violet-600 hover:bg-indigo-600 shrink-0 text-white"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
};

export default SpreadsheetAssistant;