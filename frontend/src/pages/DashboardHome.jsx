import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Mic, 
  MicOff, 
  Calendar, 
  MessageSquare, 
  Users, 
  Play, 
  Square,
  Volume2,
  Loader2,
  CalendarDays
} from 'lucide-react';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardHome = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState({ appointments: 0, conversations: 0, users: 0, calendars: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`, {
        headers: getAuthHeaders()
      });
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscription('');
      setResponse('');
      setAudioUrl(null);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Mikrofon konnte nicht aktiviert werden');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    try {
      // First transcribe
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const transcribeRes = await axios.post(`${API_URL}/voice/transcribe`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const transcribedText = transcribeRes.data.transcription;
      setTranscription(transcribedText);

      // Then process with AI
      const processRes = await axios.post(`${API_URL}/voice/process`, {
        transcription: transcribedText
      }, {
        headers: getAuthHeaders()
      });

      setResponse(processRes.data.response);
      
      if (processRes.data.audio_base64) {
        const audioData = `data:audio/mp3;base64,${processRes.data.audio_base64}`;
        setAudioUrl(audioData);
      }

      fetchStats(); // Refresh stats after new conversation
      toast.success('Antwort erhalten!');
    } catch (error) {
      console.error('Failed to process audio:', error);
      toast.error('Verarbeitung fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const statCards = [
    { icon: CalendarDays, label: 'Termine', value: stats.appointments, color: 'text-violet-600', bg: 'bg-violet-100' },
    { icon: MessageSquare, label: 'Gespräche', value: stats.conversations, color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: Users, label: 'Benutzer', value: stats.users, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { icon: Calendar, label: 'Kalender', value: stats.calendars, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" data-testid="dashboard-home">
      {/* Header */}
      <div>
        <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          Sprechen Sie mit dem Assistenten, um Ihre Termine zu verwalten
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index}
            className="p-3 sm:p-5 bg-white border border-slate-100 shadow-soft hover-lift"
            data-testid={`stat-${stat.label.toLowerCase()}`}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 truncate">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Voice Agent Interface */}
      <Card className="bg-white border border-slate-100 shadow-soft overflow-hidden" data-testid="voice-agent-card">
        {/* Voice Agent Header */}
        <div className="relative p-4 sm:p-6 md:p-8 pb-10 sm:pb-12 bg-gradient-to-br from-violet-600 to-indigo-600">
          <div className="absolute inset-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1759771963975-8a4885446f1f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHNvdW5kJTIwd2F2ZSUyMHRlY2hub2xvZ3klMjBibHVlJTIwdmlvbGV0fGVufDB8fHx8MTc2OTgyNjAxOHww&ixlib=rb-4.1.0&q=85"
              alt="Sound waves"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10">
            <h2 className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
              KI-Sprachassistent
            </h2>
            <p className="text-violet-100 text-sm sm:text-base">
              Drücken Sie den Knopf und sprechen Sie Ihren Befehl
            </p>
          </div>
        </div>

        {/* Recording Interface */}
        <div className="p-4 sm:p-6 md:p-8 -mt-6 sm:-mt-8 relative z-10">
          <div className="flex flex-col items-center">
            {/* Record Button */}
            <div className="relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-red-500/30 pulse-ring" />
              )}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`
                  w-24 h-24 rounded-full flex items-center justify-center transition-all
                  ${isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                    : 'bg-violet-600 hover:bg-violet-700 shadow-glow'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
                `}
                data-testid="record-btn"
              >
                {isProcessing ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : isRecording ? (
                  <Square className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white" />
                )}
              </button>
            </div>

            {/* Status Text */}
            <p className="mt-4 text-sm text-slate-500">
              {isProcessing ? 'Verarbeite...' : isRecording ? 'Aufnahme läuft...' : 'Tippen zum Sprechen'}
            </p>

            {/* Voice Wave Animation */}
            {isRecording && (
              <div className="flex items-center gap-1 mt-4 h-8">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-violet-500 rounded-full voice-wave-bar"
                    style={{ height: '100%' }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          {(transcription || response) && (
            <div className="mt-8 space-y-4">
              {transcription && (
                <div className="p-4 bg-slate-50 rounded-xl" data-testid="transcription-result">
                  <p className="text-sm font-medium text-slate-500 mb-1">Sie sagten:</p>
                  <p className="text-slate-800">{transcription}</p>
                </div>
              )}
              
              {response && (
                <div className="p-4 bg-violet-50 rounded-xl" data-testid="response-result">
                  <p className="text-sm font-medium text-violet-600 mb-1">Assistent:</p>
                  <p className="text-slate-800">{response}</p>
                  
                  {audioUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        onEnded={() => setIsPlaying(false)}
                        className="hidden"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={isPlaying ? stopAudio : playAudio}
                        className="rounded-full"
                        data-testid="play-audio-btn"
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Anhören
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="p-6 bg-white border border-slate-100 shadow-soft">
        <h3 className="font-heading font-semibold text-slate-900 mb-4">
          Beispiel-Befehle
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            '"Was sind meine Termine heute?"',
            '"Erstelle einen Termin morgen um 14 Uhr"',
            '"Bin ich am Freitag frei?"'
          ].map((tip, index) => (
            <div 
              key={index}
              className="p-4 bg-slate-50 rounded-xl text-slate-600 text-sm italic"
            >
              {tip}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;
