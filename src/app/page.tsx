"use client";

import { useEffect, useRef, useState } from "react";




interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const loadDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();

      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, []);


  useEffect(() => {
    const savedConversation =
      localStorage.getItem("activeConversation");

    if (savedConversation) {
      const id = Number(savedConversation);

      setCurrentConversationId(id);
      loadMessages(id);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();

      setConversations(data);
    } catch (error) {
      console.error(error);
    }
  };


  const deleteDocument = async (id: number) => {
    try {
      await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      await loadDocuments();
    } catch (error) {
      console.error(error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const res = await fetch(
        `/api/messages?conversationId=${conversationId}`
      );

      const data = await res.json();
      await loadConversations();

      setMessages(
        data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }))
      );
    } catch (error) {
      console.error(error);
    }
  };


  const deleteConversation = async (id: number) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (currentConversationId === id) {
        setCurrentConversationId(null);

        setMessages([]);

        localStorage.removeItem(
          "activeConversation"
        );
      }

      await loadConversations();
    } catch (error) {
      console.error(error);
    }
  };

  const createConversation = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
      });

      const data = await res.json();

      setCurrentConversationId(data.id);

      localStorage.setItem(
        "activeConversation",
        String(data.id)
      );

      await loadConversations();

      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm SupportIQ. How can I help you today?",
        },
      ]);
      setSidebarOpen(false);
    } catch (error) {
      console.error(error);
    }
  };



  const uploadPdf = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;

    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      for (const file of Array.from(files)) {
        const formData = new FormData();

        formData.append("file", file);

        const res = await fetch("/api/upload-pdf", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ ${data.fileName} uploaded successfully. You can now ask questions about it.`,
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };


  const sendMessage = async () => {
    if (!currentConversationId) {
      alert("Please create a new chat first");
      return;
    }
    if (!message.trim() || loading) return;

    const userMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: currentConversationId
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No response received.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <main className="h-screen bg-black text-white flex">

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-zinc-900 border border-zinc-700 px-3 py-2 rounded-lg"
      >
        ☰
      </button>
      {/* Sidebar */}
      <aside
        className={`
    fixed md:relative
    top-0 left-0
    h-screen
    w-72
    border-r border-zinc-800
    bg-black
    p-4
    flex flex-col
    z-40
    transition-transform duration-300
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
      >
        <h1 className="text-3xl md:text-5xl mb-4">SupportIQ</h1>

        <button
          onClick={createConversation}
          className="border border-zinc-700 rounded-xl p-3 hover:bg-zinc-900 transition"
        >
          + New Chat
        </button>

        <div className="mt-4 flex flex-col gap-2 overflow-y-auto">
          {conversations.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => {
                  setCurrentConversationId(chat.id);

                  localStorage.setItem(
                    "activeConversation",
                    String(chat.id)
                  );

                  loadMessages(chat.id);
                  setSidebarOpen(false);
                }}
                className={`flex-1 min-w-0 text-left p-3 rounded-xl transition-all duration-200 ${currentConversationId === chat.id
                  ? "bg-blue-600"
                  : "bg-zinc-900 hover:bg-zinc-800"
                  }`}
              >
                <div className="truncate">
                  {chat.title}
                </div>
              </button>

              <button
                onClick={() => deleteConversation(chat.id)}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-red-700 text-zinc-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>


        <div className="mt-6">
          <h2 className="text-sm text-zinc-400 mb-2">
            Uploaded Documents
          </h2>

          <div className="flex flex-col gap-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center gap-2"
              >
                <div className="flex-1 bg-zinc-900 rounded-xl p-3 text-sm truncate">
                  📄 {doc.file_name}
                </div>

                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="bg-zinc-800 hover:bg-red-600 px-3 py-3 rounded-xl"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <section className="flex-1 flex flex-col w-full h-screen">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 px-2 md:px-0">

            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-5xl font-bold mb-4">
                  🤖 SupportIQ
                </h1>

                <p className="text-sm md:text-lg text-zinc-400">
                  Ask questions about your documents
                </p>
              </div>
            )}



            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[92%] md:max-w-[80%] p-4 rounded-2xl ${msg.role === "user"
                  ? "bg-blue-600 self-end"
                  : "bg-zinc-800 self-start"
                  }`}
              >
                <div className="text-xs mb-2 opacity-70">
                  {msg.role === "user" ? "👤 You" : "🤖 SupportIQ"}
                </div>

                <div>{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="bg-zinc-800 self-start px-5 py-4 rounded-2xl flex gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <div
                  className="w-2 h-2 bg-white rounded-full animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        {/* Input */}
        <div className="border-t border-zinc-800 p-4 shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 shadow-lg">


              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={uploadPdf}
                />

                <div className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center">
                  📎
                </div>
              </label>


              <input
                type="text"
                placeholder="Message SupportIQ..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                className="flex-1 bg-transparent outline-none text-white placeholder:text-zinc-500 text-sm md:text-base"
              />

              {uploading && (
                <span className="text-xs text-zinc-400">
                  Uploading...
                </span>
              )}

              <button
                onClick={sendMessage}
                disabled={loading}
                className="
          w-10
          h-10
          rounded-full
          bg-blue-600
          hover:bg-blue-700
          disabled:bg-zinc-700
          flex
          items-center
          justify-center
          transition
        "
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}