import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  MessageSquare, 
  Loader2,
  User,
  Bot
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ConversationHistory = () => {
  const { getAuthHeaders } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/conversations`, {
        headers: getAuthHeaders()
      });
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Gespräche konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const formatDateTime = (isoString) => {
    try {
      const date = parseISO(isoString);
      return format(date, 'dd. MMM yyyy, HH:mm', { locale: de });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="history-loading">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="conversation-history-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Gesprächsverlauf
        </h1>
        <p className="text-slate-600 mt-1">
          Ihre vergangenen Gespräche mit dem Sprachassistenten
        </p>
      </div>

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <Card className="p-12 bg-white border border-slate-100 shadow-soft text-center" data-testid="no-conversations">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-heading font-semibold text-slate-900 mb-2">
            Keine Gespräche
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Beginnen Sie ein Gespräch mit dem Sprachassistenten auf der Dashboard-Seite.
          </p>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="conversations-list">
          {conversations.map((conversation) => (
            <Card 
              key={conversation.id}
              className="p-5 bg-white border border-slate-100 shadow-soft"
              data-testid={`conversation-item-${conversation.id}`}
            >
              <div className="space-y-4">
                {/* Timestamp */}
                <div className="text-xs text-slate-400">
                  {formatDateTime(conversation.created_at)}
                </div>

                {/* User message */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">Sie</p>
                    <p className="text-slate-800 bg-slate-50 rounded-xl rounded-tl-none p-3">
                      {conversation.transcription}
                    </p>
                  </div>
                </div>

                {/* Agent response */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-violet-600 mb-1">Assistent</p>
                    <p className="text-slate-800 bg-violet-50 rounded-xl rounded-tl-none p-3">
                      {conversation.agent_response}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationHistory;
