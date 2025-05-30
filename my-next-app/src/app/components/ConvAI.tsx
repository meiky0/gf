'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export function ConversationalAI() {
  const [isStarted, setIsStarted] = useState(false);
  const [audioScale, setAudioScale] = useState(1);
  const [subtitle, setSubtitle] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  
  const wrapRef = useRef(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setIsStarted(true);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
      setIsStarted(false);
      setSubtitle('');
      setTranscriptHistory([]);
    },
    onMessage: (message) => {
      console.log('Message received:', message);
      
      if (message.message && typeof message.message === 'string') {
        setSubtitle(message.message);
        setTranscriptHistory(prev => [...prev.slice(-4), {
          id: Date.now(),
          text: message.message,
          speaker: 'AI',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      
      if (message.transcript && typeof message.transcript === 'string') {
        setSubtitle(message.transcript);
        setTranscriptHistory(prev => [...prev.slice(-4), {
          id: Date.now(),
          text: message.transcript,
          speaker: message.role === 'user' ? 'You' : 'AI',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      
      if (message.text && typeof message.text === 'string') {
        setSubtitle(message.text);
        setTranscriptHistory(prev => [...prev.slice(-4), {
          id: Date.now(),
          text: message.text,
          speaker: 'AI',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      
      if (message.type === 'audio' || message.audio) {
        setAudioScale(1.2);
        setTimeout(() => setAudioScale(1), 200);
      }
    },
    onError: (error) => {
      console.error('Conversation Error:', error);
      setIsStarted(false);
    },
  });

  useEffect(() => {
    class CustomCurve extends THREE.Curve {
      constructor() {
        super();
      }
    
      getPoint(t) {
        const pi2 = Math.PI * 2;
        const length = 30;
        const radius = 5.6;
    
        const x = length * Math.sin(pi2 * t);
        const y = radius * Math.cos(pi2 * 3 * t);
        let z, p;
    
        p = t % 0.25 / 0.25;
        p = t % 0.25 - (2 * (1 - p) * p * -0.0185 + p * p * 0.25);
        if (Math.floor(t / 0.25) === 0 || Math.floor(t / 0.25) === 2) {
          p *= -1;
        }
        z = radius * Math.sin(pi2 * 2 * (t - p));
    
        return new THREE.Vector3(x, y, z);
      }
    }
    
    const wrap = wrapRef.current;
    if (!wrap) return;
  
    const areaWidth = window.innerWidth;
    const areaHeight = window.innerHeight;
    const canvasSize = Math.min(areaWidth, areaHeight);
  
    const length = 30;
    const radius = 5.6;
  
    const rotatevalue = 0.035;
    let acceleration = 0;
    let animatestep = 0;
    let toend = false;
  
    const pi2 = Math.PI * 2;
  
    const group = new THREE.Group();
    let mesh, ringcover, ring;
  
    const camera = new THREE.PerspectiveCamera((50), 1, 1, 10000);
    camera.position.z = 150;
  
    const scene = new THREE.Scene();
    scene.add(group);
  
    mesh = new THREE.Mesh(
      new THREE.TubeGeometry(
        new CustomCurve(),
        200,
        1.1,
        2,
        true
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
      })
    );
    group.add(mesh);
  
    ringcover = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 15, 1),
      new THREE.MeshBasicMaterial({ color: 0xdc5037, opacity: 0, transparent: true })
    );
    ringcover.position.x = length + 1;
    ringcover.rotation.y = Math.PI / 2;
    group.add(ringcover);
  
    ring = new THREE.Mesh(
      new THREE.RingGeometry(4.3, 5.55, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0, transparent: true })
    );
    ring.position.x = length + 1.1;
    ring.rotation.y = Math.PI / 2;
    group.add(ring);
  
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvasSize, canvasSize);
    renderer.setClearColor("#DC5037");
  
    if (wrap.children.length > 0) {
      wrap.removeChild(wrap.firstChild);
    }
    wrap.appendChild(renderer.domElement);
  
    animate();
    
    if (isStarted === true) {
      console.log('experience started');
      start()
    }
    
    function start() {
      toend = true;
      setTimeout(() => {
        back()
      }, 2500);
    }
  
    function back() {
      toend = false;
    }
  
    function render() {
      animatestep = Math.max(0, Math.min(240, toend ? animatestep + 1 : animatestep - 4));
      acceleration = easing(animatestep, 0, 1, 240);
      renderer.render(scene, camera);
    }
  
    function animate() {
      mesh.rotation.x += rotatevalue + acceleration;
      render();
      requestAnimationFrame(animate);
    }
    
    function easing(t, b, c, d) {
      if ((t /= d / 2) < 1) return (c / 2) * t * t + b;
      return (c / 2) * ((t -= 2) * t * t + 2) + b;
    }

    return () => {
      if (wrap && wrap.children.length > 0) {
        wrap.removeChild(wrap.firstChild);
      }
    };
  }, [isStarted, audioScale]);

  const startConversation = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: 'agent_01jwd22s4kf3rb8cfenk45dg4z',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please check your microphone permissions and agent ID.');
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  }, [conversation]);

  useEffect(() => {
    if (conversation.isSpeaking) {
      setAudioScale(1.3);
    } else {
      setAudioScale(1);
    }
  }, [conversation.isSpeaking]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#DC5037]">
      {/* Auth Buttons */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-4">
        <button
          className="bg-white text-[#DC5037] px-6 py-2 rounded-full hover:bg-opacity-90 transition-all duration-300 font-semibold"
          onClick={() => alert('Sign up functionality coming soon!')}
        >
          Sign Up
        </button>
        <button
          className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-full hover:bg-white hover:text-[#DC5037] transition-all duration-300 font-semibold"
          onClick={() => alert('Login functionality coming soon!')}
        >
          Login
        </button>
      </div>

      {/* Connection Status Indicator */}
      <div className="absolute top-8 right-8 z-20">
        <div className={`w-3 h-3 rounded-full ${
          conversation.status === 'connected' ? 'bg-green-400' : 
          conversation.status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
          'bg-red-400'
        }`} />
      </div>

      {/* Conversation History Panel */}
      {isStarted && transcriptHistory.length > 0 && (
        <div className="absolute top-24 left-8 max-w-sm z-20">
          <div className="bg-black bg-opacity-60 backdrop-blur-sm p-4 rounded-lg max-h-48 overflow-y-auto">
            <h3 
              className="text-white text-sm font-bold mb-3 opacity-75"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              Recent Conversation
            </h3>
            <div className="space-y-3">
              {transcriptHistory.map((entry) => (
                <div key={entry.id} className="text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className={`text-xs font-bold ${
                        entry.speaker === 'AI' ? 'text-blue-300' : 'text-green-300'
                      }`}
                      style={{ fontFamily: 'Verdana, sans-serif' }}
                    >
                      {entry.speaker}:
                    </span>
                    <span className="text-gray-400 text-xs">{entry.timestamp}</span>
                  </div>
                  <p 
                    className="text-white text-xs leading-relaxed opacity-90"
                    style={{ fontFamily: 'Verdana, sans-serif' }}
                  >
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualizer Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="flex items-center justify-center"
          style={{
            overflow: 'hidden',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
          }}
        >
          <div ref={wrapRef} id="wrap"/>
        </div>
      </div>

      {/* Status Text */}
      {isStarted && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-32 z-10">
          <div className="text-white text-center">
            <div className="text-lg opacity-75" style={{ fontFamily: 'Verdana, sans-serif' }}>
              <p className="mb-2">Status: {conversation.status}</p>
              <p className="italic">
                {conversation.isSpeaking ? 'Speaking...' : 'Listening...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Live Transcript */}
      {isStarted && subtitle && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 max-w-4xl px-6 z-10">
          <div className="bg-black bg-opacity-70 backdrop-blur-sm px-6 py-4 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span 
                className="text-blue-300 text-sm font-bold"
                style={{ fontFamily: 'Verdana, sans-serif' }}
              >
                AI Speaking:
              </span>
            </div>
            <p 
              className="text-white text-lg text-center leading-relaxed"
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              {subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Control Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        {!isStarted ? (
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connecting'}
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-[#DC5037] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
          </button>
        ) : (
          <button
            onClick={stopConversation}
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white hover:text-[#DC5037] transition-all duration-300"
            style={{ fontFamily: 'Verdana, sans-serif' }}
          >
            End Conversation
          </button>
        )}
      </div>
    </div>
  );
}