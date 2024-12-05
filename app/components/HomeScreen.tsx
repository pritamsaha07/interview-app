"use client";
import React, { useState, useRef } from "react";
import { Camera } from "react-camera-pro";
import {
  User,
  CheckCircle,
  Loader,
  Check,
  VideoIcon,
  MicIcon,
  StopCircle,
  Volume2,
  VolumeX,
} from "lucide-react";

type ScreenType =
  | "instructions"
  | "preview"
  | "questions"
  | "recording"
  | "loader"
  | "completion";

export default function InterviewRecordingApp() {
  const [currentScreen, setCurrentScreen] =
    useState<ScreenType>("instructions");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const [cameraPermission, setCameraPermission] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState(false);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const questionAudios = [
    "/audios/audio0.wav",
    "/audios/audio1.wav",
    "/audios/audio2.wav",
    "/audios/audio3.wav",
    "/audios/audio4.wav",
  ];

  const questions = [
    "Tell me about yourself and your professional background.",
    "What are your greatest professional strengths?",
    "Describe a challenging project you've worked on.",
    "Where do you see yourself in the next five years?",
    "Why are you interested in this position?",
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const toggleAudioPlayback = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play();
        setIsAudioPlaying(true);
      }
    }
  };

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setMediaStream(stream);
      setCameraPermission(true);
      setMicrophonePermission(true);
      setCurrentScreen("preview");
    } catch (error) {
      console.error("Media permissions error:", error);
      alert(
        "Could not access camera or microphone. Please check your permissions."
      );
    }
  };

  // Start video recording
  const startRecording = () => {
    if (mediaStream) {
      const mediaRecorder = new MediaRecorder(mediaStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });

        const formData = new FormData();
        formData.append(
          "video",
          blob,
          `question_${currentQuestionIndex + 1}.webm`
        );
        formData.append("questionIndex", currentQuestionIndex.toString());

        try {
          const response = await fetch("/api/upload-interview-video", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Video upload failed");
          }
        } catch (error) {
          console.error("Upload error:", error);
          alert("Failed to upload video. Please try again.");
        }

        setRecordedChunks([]);
      };

      mediaRecorder.start();
      setRecorder(mediaRecorder);
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setIsRecording(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentScreen("questions");
    } else {
      setCurrentScreen("loader");
      setTimeout(() => setCurrentScreen("completion"), 2000);
    }
  };

  const renderInstructionsScreen = () => (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="rounded-lg p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-white-900">
          Interview Recording Instructions
        </h1>
        <div className="space-y-4 mb-6">
          {[
            "Find a quiet, well-lit space with a stable internet connection.",
            "Ensure your camera and microphone are working properly.",
            "Dress professionally and maintain good eye contact.",
            "Answer each question thoughtfully and concisely.",
            "You'll have a chance to record each question separately.",
          ].map((instruction, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="mr-3 text-green-500" />
              <p>{instruction}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={requestMediaPermissions}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
          >
            Start Interview Setup
          </button>
        </div>
      </div>
    </div>
  );

  const renderPreviewScreen = () => (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className=" rounded-lg p-8 max-w-2xl w-full text-center">
        <div className="mb-6">
          <Camera
            ref={cameraRef}
            aspectRatio={16 / 9}
            numberOfCamerasCallback={(numberOfCameras) => {
              console.log(`Number of cameras: ${numberOfCameras}`);
            }}
            errorMessages={{
              noCameraAccessible: "No camera device accessible",
              permissionDenied: "Permission denied",
              switchCamera: "Switch Camera",
            }}
            videoSourceDeviceId={undefined}
          />
        </div>
        <div className="flex justify-center items-center mb-4 space-x-4">
          <div className="flex items-center">
            <VideoIcon
              className={`mr-2 ${
                cameraPermission ? "text-green-500" : "text-red-500"
              }`}
            />
            <span>Camera: {cameraPermission ? "Ready" : "Not Available"}</span>
          </div>
          <div className="flex items-center">
            <MicIcon
              className={`mr-2 ${
                microphonePermission ? "text-green-500" : "text-red-500"
              }`}
            />
            <span>
              Microphone: {microphonePermission ? "Ready" : "Not Available"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen("questions")}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition"
        >
          Begin Interview
        </button>
      </div>
    </div>
  );

  const renderQuestionScreen = () => (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="rounded-lg p-8 max-w-2xl w-full text-center">
        <h2 className="text-2xl font-semibold mb-6">
          Question {currentQuestionIndex + 1}
        </h2>
        <p className="text-xl mb-6">{questions[currentQuestionIndex]}</p>

        <div className="mb-6 flex justify-center items-center">
          <audio
            ref={audioRef}
            src={questionAudios[currentQuestionIndex]}
            onEnded={() => setIsAudioPlaying(false)}
          />
          <button
            onClick={toggleAudioPlayback}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition"
          >
            {isAudioPlaying ? (
              <>
                <VolumeX className="mr-2" /> Pause Audio
              </>
            ) : (
              <>
                <Volume2 className="mr-2" /> Play Audio
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => setCurrentScreen("recording")}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition"
        >
          Start Recording
        </button>
      </div>
    </div>
  );

  const renderRecordingScreen = () => (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className=" rounded-lg p-8 max-w-2xl w-full text-center">
        <div className="mb-4">
          <Camera
            ref={cameraRef}
            aspectRatio={16 / 9}
            numberOfCamerasCallback={(numberOfCameras) => {
              console.log(`Number of cameras: ${numberOfCameras}`);
            }}
            errorMessages={{
              noCameraAccessible: "No camera device accessible",
              permissionDenied: "Permission denied",
              switchCamera: "Switch Camera",
            }}
            videoSourceDeviceId={undefined}
          />
        </div>
        <div className="mb-4">
          <p className="text-xl font-semibold">
            {questions[currentQuestionIndex]}
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-green-600 text-white py-3 px-6 rounded-lg flex items-center hover:bg-green-700"
            >
              <VideoIcon className="mr-2" /> Start Recording
            </button>
          ) : (
            <button
              onClick={() => {
                stopRecording();
                handleNextQuestion();
              }}
              className="bg-red-600 text-white py-3 px-6 rounded-lg flex items-center hover:bg-red-700"
            >
              <StopCircle className="mr-2" /> Stop & Next
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderLoaderScreen = () => (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <Loader className="mx-auto mb-4 animate-spin" size={48} />
        <p className="text-xl">Processing your interview...</p>
      </div>
    </div>
  );

  const renderCompletionScreen = () => (
    <div className="min-h-screen bg-green-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <Check className="mx-auto mb-4" size={64} />
        <h1 className="text-3xl font-bold mb-4">Interview Completed</h1>
        <p className="text-xl">Thank you for your responses!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <span className="text-xl font-bold text-blue-900">Interview App</span>
        <User className="text-blue-900" size={32} />
      </nav>

      {currentScreen === "instructions" && renderInstructionsScreen()}
      {currentScreen === "preview" && renderPreviewScreen()}
      {currentScreen === "questions" && renderQuestionScreen()}
      {currentScreen === "recording" && renderRecordingScreen()}
      {currentScreen === "loader" && renderLoaderScreen()}
      {currentScreen === "completion" && renderCompletionScreen()}
    </div>
  );
}
