import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Paperclip, Mic, Send, Image as ImageIcon, Camera, FileText, X, Play, Pause, Plus } from 'lucide-react';
import { Message, User } from '../types';
import { getChatMessages, getUser } from '../services/mockApi';

const ChatSession = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userId) {
            const uid = parseInt(userId);
            getUser(uid).then(u => {
                if (u) setUser(u);
            });
            getChatMessages(uid).then(setMessages);
        }
    }, [userId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Timer for recording
    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        
        const newMessage: Message = {
            id: Date.now(),
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };
        
        setMessages([...messages, newMessage]);
        setInputText("");
    };

    const handleVoiceRecord = () => {
        if (isRecording) {
            // Stop recording and "send"
            const newMessage: Message = {
                id: Date.now(),
                sender: 'me',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'audio',
                duration: formatTime(recordingTime)
            };
            setMessages([...messages, newMessage]);
            setIsRecording(false);
        } else {
            setIsRecording(true);
        }
    };

    const handleAttachment = (type: 'image' | 'doc') => {
        setShowAttachments(false);
        // Mock sending an attachment
        const newMessage: Message = {
            id: Date.now(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'image',
            media_url: `https://picsum.photos/seed/${Date.now()}/300/200`
        };
        setMessages([...messages, newMessage]);
    };

    if (!user) return <div className="h-screen bg-white flex items-center justify-center">Loading...</div>;

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm border-b border-primary-900/10 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/messages')}
                        className="p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-primary-900/10" />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-gray-900 leading-tight">{user.name}</h3>
                            <p className="text-[10px] text-green-600 font-medium">Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                <div className="text-center text-[10px] text-gray-400 my-4 font-medium uppercase tracking-wider">Today</div>
                
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`
                                max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm relative
                                ${msg.sender === 'me' 
                                    ? 'bg-primary-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 rounded-bl-none border border-primary-900/5'
                                }
                            `}
                        >
                            {msg.type === 'text' && (
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            )}

                            {msg.type === 'image' && (
                                <div className="mb-1 rounded-lg overflow-hidden">
                                    <img src={msg.media_url} alt="attachment" className="w-full h-auto" />
                                </div>
                            )}

                            {msg.type === 'audio' && (
                                <div className="flex items-center gap-3 min-w-[140px]">
                                    <button className={`p-2 rounded-full ${msg.sender === 'me' ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-600'}`}>
                                        <Play size={16} className="ml-0.5" />
                                    </button>
                                    <div className="flex-1 space-y-1.5">
                                        <div className={`h-1 rounded-full w-full ${msg.sender === 'me' ? 'bg-white/30' : 'bg-gray-200'}`}>
                                            <div className={`h-full w-1/3 rounded-full ${msg.sender === 'me' ? 'bg-white' : 'bg-primary-500'}`}></div>
                                        </div>
                                        <span className={`text-[10px] block ${msg.sender === 'me' ? 'text-primary-100' : 'text-gray-400'}`}>
                                            {msg.duration}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <span 
                                className={`
                                    text-[9px] block text-right mt-1 font-medium
                                    ${msg.sender === 'me' ? 'text-primary-200' : 'text-gray-400'}
                                `}
                            >
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-primary-900/10 fixed bottom-0 left-0 right-0 z-20 pb-safe">
                {/* Attachment Menu */}
                {showAttachments && (
                    <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl shadow-xl border border-primary-900/10 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2 duration-200">
                        <button onClick={() => handleAttachment('image')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <ImageIcon size={18} />
                            </div>
                            <span className="text-sm font-bold">Gallery</span>
                        </button>
                        <button onClick={() => handleAttachment('image')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                <Camera size={18} />
                            </div>
                            <span className="text-sm font-bold">Camera</span>
                        </button>
                        <button onClick={() => handleAttachment('doc')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors text-gray-700">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <FileText size={18} />
                            </div>
                            <span className="text-sm font-bold">Document</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {/* Attach Toggle */}
                    <button 
                        onClick={() => setShowAttachments(!showAttachments)}
                        className={`p-2.5 rounded-full transition-colors ${showAttachments ? 'bg-gray-100 text-gray-800 rotate-45' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <Plus size={24} />
                    </button>

                    {/* Recording State UI vs Text Input */}
                    {isRecording ? (
                        <div className="flex-1 bg-red-50 rounded-2xl h-11 flex items-center px-4 justify-between animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-red-600 font-mono font-bold">{formatTime(recordingTime)}</span>
                            </div>
                            <span className="text-xs text-red-400 font-medium">Recording...</span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 rounded-2xl h-11 px-4 text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white outline-none transition-all"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    )}

                    {/* Mic/Send Button */}
                    {(inputText.trim()) ? (
                         <button 
                            onClick={handleSend}
                            className="p-2.5 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-200 active:scale-95 transition-all"
                        >
                            <Send size={20} className="ml-0.5" />
                        </button>
                    ) : (
                        <button 
                            onClick={handleVoiceRecord}
                            className={`p-2.5 rounded-full shadow-lg active:scale-95 transition-all ${isRecording ? 'bg-red-500 text-white shadow-red-200 animate-pulse' : 'bg-primary-600 text-white shadow-primary-200'}`}
                        >
                            {isRecording ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
                        </button>
                    )}
                </div>
            </div>
            
            {/* Attachment Overlay Close Area */}
            {showAttachments && (
                <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAttachments(false)}
                ></div>
            )}
        </div>
    );
};

export default ChatSession;