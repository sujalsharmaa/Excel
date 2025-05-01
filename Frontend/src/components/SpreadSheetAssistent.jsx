import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Copy, MinimizeIcon, MaximizeIcon } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/Store/useStore.js';


const SpreadsheetAssistant = ({ hotInstance }) => {
  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const messagesEndRef = useRef(null);
  const {fileUrl} = useAuthStore()

  useEffect(() => {
    scrollToBottom();
  }, [messages,isCollapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Keep all existing functions unchanged
  const executeSpreadsheetAction = (action) => {
    try {
      if (!action.type) return true;

      console.log("Action->",action)

      switch (action.type) {
        case 'SET_CELL_VALUE':
            setTimeout(()=>{
                hotInstance.setDataAtCell(action.row, action.col, action.value);
        
            },100)
          break;
          case 'SET_FORMULA': 
          console.log(action[0],action.targetCol)
            hotInstance.setDataAtCell(action.row, action.col, `${action.formula}`);
            break;

        default:
          return true;
      }
      return true;
    } catch (error) {
      console.error('Error executing spreadsheet action:', error);
      return false;
    }
  };

  const processResponse = async (response) => {
    try {
      console.log("res=>",response)
  
      if (response.actions) {
        //console.log("i picked up");
        for (const action of response.actions) {
          //console.log("action->", action);
          const result = executeSpreadsheetAction(action);
          setTimeout
          if (!result) {
            return "Sorry, I encountered an error while performing that action.";
          }
        }
        return response || "Actions completed successfully.";
      }
  
      return response;
    } catch (error) {
      console.error("Error processing response:", error);
      return response;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !hotInstance) return;

    setIsProcessing(true);
    const newMessage = { type: "user", content: userInput };
    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_PUBLIC_API_URL}/chat`,
       
        {
            fileUrl,
          messages: [

            {
              role: "user",
              content: userInput
            }
          ]
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true
        }
      );

      console.log(response)

      const processedResponse = (res) =>{
        try {
            let data = JSON.parse(res.data.response).response
            processResponse(JSON.parse(res.data.response))
            return data
        } catch (error) {
          console.log("i did it bro!!")
          processResponse(res.data.response)
            return res.data.response;
        }
      }

      setMessages(prev => [...prev, { type: "assistant", content: processedResponse(response) }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [
        ...prev,
        { type: "assistant", content: "Sorry, I encountered an error. Please try again." }
      ]);
    }

    setUserInput("");
    setIsProcessing(false);
  };

  return (
    <Card 
      className={`fixed bottom-4 right-4 w-80 flex flex-col bg-[#161D26] shadow-lg transition-all duration-300 ${
        isCollapsed ? 'h-10 w-[200px]' : 'h-96'
      }`}
    >
      <div className="flex justify-between items-center p-2 border-b">
        <span className="text-sm font-medium text-white">Spreadsheet Assistant</span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-6 w-6 hover:bg-green-500 bg-green-800"
        >
          {isCollapsed ? (
            <MaximizeIcon className="h-4 w-4" />
          ) : (
            <MinimizeIcon className="h-4 w-4" />
          )}
        </Button>
      </div>

      {!isCollapsed && (
        <>
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-gray-500 text-sm">
                  Hello! I can help you with your spreadsheet and answer general questions. Try:
                  <ul className="list-disc pl-5 mt-2">
                    <li>Set values in cells</li>
                    <li>Apply formulas</li>
                    <li>Sort columns</li>
                    <li>Clear ranges</li>
                    <li>Ask about spreadsheet features</li>
                    <li>Get general help</li>
                  </ul>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg max-w-[75%] ${
                    msg.type === "user"
                      ? "bg-blue-500 text-white self-end ml-auto w-fit h-fit"
                      : "bg-green-500 text-white self-start w-fit h-fit"
                  }`}
                >
                  {msg.content}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isProcessing}
              className="flex-1 text-black bg-slate-200"
            />
            <Button
              type="submit"
              disabled={isProcessing}
              size="icon"
              className="border-2 bg-violet-600 hover:bg-indigo-600"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
};

export default SpreadsheetAssistant;