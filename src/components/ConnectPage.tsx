// in src/components/ConnectPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { AppUser, ConnectionRequest, ChatMessage } from '../types';
import { db, storage } from '../services/firebase'; // Assuming storage is exported from firebase.ts
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface ConnectPageProps {
  currentUser: AppUser;
  connectedFaculty: AppUser[];
  connectionRequests: ConnectionRequest[];
  onSendConnectionRequest: (facultyId: string) => void;
  onAcceptConnection: (requestId: string) => void;
  onRejectConnection: (requestId: string) => void;
  onSendMessage: (chatId: string, message: { text?: string; imageUrl?: string }) => void;
  onBack: () => void;
}

const ChatWindow: React.FC<{ currentUser: AppUser; selectedFaculty: AppUser; onSendMessage: ConnectPageProps['onSendMessage']; }> = ({ currentUser, selectedFaculty, onSendMessage }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatId = [currentUser.id, selectedFaculty.id].sort().join('_');

    useEffect(() => {
        const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => doc.data() as ChatMessage));
        });
        return () => unsubscribe();
    }, [chatId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() && !imageFile) return;

        let imageUrl: string | undefined = undefined;
        if (imageFile) {
            const imageRef = ref(storage, `chat-images/${chatId}/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        onSendMessage(chatId, { text: newMessage, imageUrl });
        setNewMessage('');
        setImageFile(null);
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-bold text-lg">{selectedFaculty.name}</h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex my-2 ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'}`}>
                            {msg.text && <p>{msg.text}</p>}
                            {msg.imageUrl && <img src={msg.imageUrl} alt="chat attachment" className="rounded-md mt-2 max-w-full h-auto" />}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-600">
                {imageFile && <div className="text-sm mb-2">Image selected: {imageFile.name}</div>}
                <div className="flex items-center gap-2">
                    <input type="file" id="chat-image-upload" accept="image/*" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="hidden" />
                    <label htmlFor="chat-image-upload" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">📎</label>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="w-full p-2 rounded-md bg-white dark:bg-gray-800" />
                    <button onClick={handleSend} className="py-2 px-4 bg-blue-600 text-white rounded-md">Send</button>
                </div>
            </div>
        </div>
    );
};

export const ConnectPage: React.FC<ConnectPageProps> = ({ currentUser, connectedFaculty, connectionRequests, onSendConnectionRequest, onAcceptConnection, onRejectConnection, onSendMessage, onBack }) => {
  const [facultyId, setFacultyId] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<AppUser | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (facultyId.trim()) {
      onSendConnectionRequest(facultyId.trim());
      setFacultyId('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Faculty Connect</h2>
            <button onClick={onBack} className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              &larr; Back to Dashboard
            </button>
        </div>
        {selectedFaculty ? (
            <ChatWindow currentUser={currentUser} selectedFaculty={selectedFaculty} onSendMessage={onSendMessage} />
        ) : (
            <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">Select a faculty member to start chatting.</p>
            </div>
        )}
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-4">Find & Connect</h3>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input type="text" value={facultyId} onChange={e => setFacultyId(e.target.value)} placeholder="Enter Faculty ID" className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md">Send</button>
          </form>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Connection Requests</h3>
          <div className="space-y-3">
            {connectionRequests.length > 0 ? (
              connectionRequests.map(req => (
                <div key={req.id} className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/30">
                  <p className="font-medium">{req.fromFacultyName}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => onAcceptConnection(req.id)} className="w-full text-xs py-1 px-2 bg-green-600 text-white rounded">Accept</button>
                    <button onClick={() => onRejectConnection(req.id)} className="w-full text-xs py-1 px-2 bg-gray-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))
            ) : (<p className="text-sm text-gray-500">No new requests.</p>)}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Connected Faculty</h3>
          <div className="space-y-3">
            {connectedFaculty.length > 0 ? (
              connectedFaculty.map(f => (
                <button key={f.id} onClick={() => setSelectedFaculty(f)} className={`w-full p-3 border rounded-lg font-medium text-left ${selectedFaculty?.id === f.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {f.name}
                </button>
              ))
            ) : (<p className="text-sm text-gray-500">No connected faculty.</p>)}
          </div>
        </div>
      </div>
    </div>
  );
};