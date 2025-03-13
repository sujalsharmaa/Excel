import React, { useRef, useState, useEffect } from "react";
import { MessageCircle, X, Send, AlertCircle, Smile, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, useWebSocketStore } from "@/Store/useStore.js";
import { toast } from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { Switch } from "@/components/ui/switch";

const ChatFeature = () => {
  
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(isOpen);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { user } = useAuthStore();
  const { socket } = useWebSocketStore();
  const chatContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const {fileUserName,fileUrl} = useAuthStore();

  const addEmoji = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    isOpenRef.current = isOpen; // Keep it updated
  }, [isOpen]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  useEffect(() => {
    if (isOpen && socket && socket.readyState === WebSocket.OPEN) {
      setIsLoading(true);
      socket.send(
        JSON.stringify({
          type: "CHAT_HISTORY",
          fileNameFromUser: fileUrl
        })
      );
    }
  }, [isOpen, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
          console.log("chat", data);
      
          if (data.type === "CHAT_MESSAGE" && !isOpenRef.current && notificationsEnabled) {
            toast.custom((t) => (
              <div
                className={`flex items-center p-3 bg-white shadow-lg rounded-lg border border-gray-300 ${
                  t.visible ? "animate-fadeIn" : "animate-fadeOut"
                }`}
                onClick={() => {
                  setIsOpen(true);
                  toast.dismiss(t.id);
                }}
              >
                {/* Sender Avatar */}
                {data.sender?.avatar && (
                  <img
                    src={data.sender.avatar}
                    alt={data.sender.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
      
                <div className="flex-1">
                  {/* Sender Name */}
                  <p className="font-semibold text-gray-900">{data.sender?.name || "Anonymous"}</p>
      
                  {/* Chat Message */}
                  <p className="text-gray-600 text-sm">{data.message}</p>
                </div>
      
                {/* Close Button */}
              </div>
            ),{duration: 10});
          }
        } catch (e) {
          return;
        }
    

      if (data.type === "CHAT_MESSAGE") {
        setChatHistory((prev) => {
          const isDuplicate = prev.some(
            (msg) => msg.timestamp === data.timestamp && msg.sender.id === data.sender.id
          );
          return isDuplicate
            ? prev
            : [
                ...prev,
                {
                  sender: data.sender,
                  message: data.message,
                  timestamp: data.timestamp,
                  isCurrentUser: data.sender.id === user?.google_id,
                },
              ];
        });
      }

      if (data.type === "CHAT_HISTORY") {
        setIsLoading(false);
        const messages = Array.isArray(data.messages)
          ? data.messages.map((msg) => (typeof msg === "string" ? JSON.parse(msg) : msg))
          : [];
        setChatHistory(
          messages.map((msg) => ({
            ...msg,
            isCurrentUser: msg.sender.id === user?.google_id,
          }))
        );
      }

      if (data.type === "ERROR" && data.context === "chat") {
        setIsLoading(false);
        toast.error(`Chat error: ${data.message}`);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, user?.google_id, notificationsEnabled]);

  const sendMessage = () => {
    if (!message.trim() || !socket || socket.readyState !== WebSocket.OPEN) {
      if (socket?.readyState !== WebSocket.OPEN) {
        toast.error("Cannot send message: disconnected from server");
      }
      return;
    }

    const chatMessage = {
      type: "CHAT_MESSAGE",
      sender: {
        id: user?.google_id,
        name: user?.display_name || "Anonymous",
        avatar: user?.imageurl,
      },
      message: message.trim(),
      timestamp: new Date().toISOString(),
      fileNameFromUser: fileUrl
    };

    try {
      socket.send(JSON.stringify(chatMessage));

      setChatHistory((prev) => {
        const isDuplicate = prev.some(
          (msg) => msg.timestamp === chatMessage.timestamp && msg.sender.id === user?.google_id
        );
        return isDuplicate ? prev : [...prev, { ...chatMessage, isCurrentUser: true }];
      });

      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
      console.error("Send message error:", error);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="default"
        className={`flex items-center gap-1 ${
          isOpen ? "bg-blue-700" : "bg-sky-600 hover:bg-blue-700"
        } text-white`}
        title="Chat with collaborators"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs">Chat</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md border border-gray-200 z-[1200]">
          <div className="flex justify-around gap-5 items-center p-3 border-b border-gray-200 bg-gray-50 rounded-t-md">
            <h3 className="font-semibold text-gray-700 overflow-hidden">Chat - {fileUserName}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-end gap-2" title={notificationsEnabled ? "Notifications on" : "Notifications off"}>
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 text-blue-500" />
                ) : (
                  <BellOff className="h-4 w-4 text-gray-400" />
                )}
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                  size="sm"
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
           ref={chatContainerRef}
           className="p-3 h-60 overflow-y-auto flex flex-col gap-2 bg-cover bg-center bg-no-repeat"
           style={{ backgroundImage: "url('../public/HD-wallpaper.jpg')" }}
            >
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="animate-spin mr-2">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span>Loading messages...</span>
              </div>
            ) : chatHistory.length === 0 ? (
              <p className="text-gray-500 text-center my-auto">No messages yet. Start the conversation!</p>
            ) : (
              chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] p-2 rounded-lg ${
                      chat.isCurrentUser
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    {!chat.isCurrentUser && (
                        <div className="flex gap-1">
                         {chat.sender.avatar && (
                          <img src={chat.sender.avatar} alt={chat.sender.name} className="w-10 h-10 rounded-full" />
                        )}
                      <div className="flex-col items-center gap-2 mb-1">
                        <p className="text-xs font-semibold">{chat.sender.name}</p>
                        <p className="text-sm whitespace-pre-wrap break-words">{chat.message}</p>
                      </div>
                      </div>
                    )}
                {chat.isCurrentUser && (  <p className="text-sm whitespace-pre-wrap break-words">{chat.message}</p>)}
                    <p className={`text-xs ${chat.isCurrentUser ? "text-blue-100" : "text-gray-500"} text-right mt-1`}>
                      {formatTime(chat.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-200 flex gap-2 relative">
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0">
                <EmojiPicker onEmojiClick={addEmoji} />
              </div>
            )}
            <Button type="button" variant="ghost" size="sm" className="p-2" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Smile className="w-4 h-4 text-gray-500" />
            </Button>
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-black bg-slate-200 border-black border-2"
              disabled={isLoading || socket?.readyState !== WebSocket.OPEN}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevent new line if Shift is not pressed
                  sendMessage();
                }
              }}
            />

            <Button type="submit" variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatFeature;