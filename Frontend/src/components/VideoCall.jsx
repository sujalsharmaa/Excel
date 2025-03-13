import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, Maximize, Minimize } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
  import "../../src/index.css"
  import msgpack from "msgpack-lite"; 
  import { useAuthStore } from '@/Store/useStore.js';


const VideoCall = ({ fileNameFromUser, ws }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [pendingCandidates, setPendingCandidates] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const {user} = useAuthStore()
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const videoContainerRef = useRef(null);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const handleIncomingCallOffer = (offer) => {
    setIncomingCall(offer);
};

const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    
    const offer = incomingCall;
    setIncomingCall(null);
    await handleIncomingCall(offer);
};

const rejectIncomingCall = () => {
    setIncomingCall(null);
    ws.send(JSON.stringify({
        type: 'CALL_REJECTED',
        id: user.google_id,
        fileNameFromUser
    }));
};

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = event => {
      if (event.candidate) {
        ws.send(JSON.stringify({
          type: 'ICE_CANDIDATE',
          candidate: event.candidate,
          id: user.google_id,
          fileNameFromUser
        }));
      }
    };

    pc.ontrack = event => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      ws.send(JSON.stringify({
        type: 'VIDEO_OFFER',
        offer: offer,
        id: user.google_id,
        fileNameFromUser
      }));

      setIsCallActive(true);
    } catch (err) {
      console.error('Error starting call:', err);
      endCall();
    } finally {
      setIsConnecting(false);
    }
  };

  const handleIncomingCall = async (offer) => {
    try {
      setIsConnecting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Process any pending ICE candidates
      while (pendingCandidates.length) {
        const candidate = pendingCandidates.shift();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }

      ws.send(JSON.stringify({
        type: 'VIDEO_ANSWER',
        answer: answer,
        id: user.google_id,
        fileNameFromUser
      }));

      setIsCallActive(true);
    } catch (err) {
      console.error('Error handling incoming call:', err);
      endCall();
    } finally {
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallActive(false);
    setIsConnecting(false);
    setPendingCandidates([]);
    peerConnection.current = null;
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => {
    if (!ws) return;

    const handleWebSocketMessage = async (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
            case 'VIDEO_OFFER':
                handleIncomingCallOffer(data.offer);
                break;
            
            case 'VIDEO_ANSWER':
                if (peerConnection.current && peerConnection.current.signalingState !== 'closed') {
                    try {
                        await peerConnection.current.setRemoteDescription(
                            new RTCSessionDescription(data.answer)
                        );
                    } catch (err) {
                        console.error('Error setting remote description:', err);
                        endCall();
                    }
                }
                break;
            
            case 'ICE_CANDIDATE':
                if (peerConnection.current && peerConnection.current.signalingState !== 'closed') {
                    try {
                        await peerConnection.current.addIceCandidate(
                            new RTCIceCandidate(data.candidate)
                        );
                    } catch (err) {
                        console.error('Error adding ICE candidate:', err);
                        if (err.name === 'InvalidStateError') {
                            setPendingCandidates(prev => [...prev, data.candidate]);
                        }
                    }
                }
                break;
            
            case 'CALL_REJECTED':
                endCall();
                break;
        }
    };

    ws.addEventListener('message', handleWebSocketMessage);

    return () => {
        ws.removeEventListener('message', handleWebSocketMessage);
        endCall();
    };
}, [ws, fileNameFromUser]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  return (
    <div className={`${isFullScreen ? 'fixed inset-0 bg-gray-900' : 'fixed bottom-4 left-4'} flex flex-col items-end gap-4`}>
         <div className="bg-blue-900">
    <AlertDialog open={incomingCall !== null} >
        <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
                <AlertDialogTitle>Incoming Video Call</AlertDialogTitle>
                <AlertDialogDescription>
                    Someone wants to start a video call with you. Would you like to accept?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={rejectIncomingCall}>Decline</AlertDialogCancel>
                <AlertDialogAction onClick={acceptIncomingCall}>Accept</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </div>
      {isCallActive ? (
        <div 
          ref={videoContainerRef}
          className={`bg-gray-900 p-4 rounded-lg shadow-lg ${isFullScreen ? 'w-full h-full flex flex-col justify-center items-center' : ''}`}
        >
          <div className={`grid ${isFullScreen ? 'grid-cols-2 w-full max-w-7xl gap-8' : 'grid-rows-2 gap-4'} mb-4`}>
            <div className="relative">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`rounded-lg bg-gray-800 ${isFullScreen ? 'w-full h-[60vh]' : 'w-48 h-36'} object-cover`}
              />
              <span className="absolute bottom-2 left-2 text-white text-sm">You</span>
            </div>
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`rounded-lg bg-gray-800 ${isFullScreen ? 'w-full h-[60vh]' : 'w-48 h-36'} object-cover`}
              />
              <span className="absolute bottom-2 left-2 text-white text-sm">Peer</span>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              onClick={toggleMute}
              variant="default"
              className={`${isMuted ? 'bg-red-600' : 'bg-gray-600'} p-2`}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              onClick={toggleVideo}
              variant="default"
              className={`${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} p-2`}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </Button>
            <Button
              onClick={endCall}
              variant="default"
              className="bg-red-600 p-2"
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
            <Button
              onClick={toggleFullScreen}
              variant="default"
              className="bg-gray-600 p-2"
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={startCall}
          variant="default"
          className="bg-green-600 hover:bg-green-700"
          disabled={isConnecting}
        >
          <Video className="w-4 h-4 mr-2" />
          {isConnecting ? 'Connecting...' : ''}
        </Button>
      )}
    </div>
  );
};

export default VideoCall;