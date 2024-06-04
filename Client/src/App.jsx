import React, { useEffect, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";

const TeachableMachine = () => {
  const webcamContainerRef = useRef(null);
  const [recognitionActive, setRecognitionActive] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  let model, maxPredictions;
  let webcam;
  let ws;

  useEffect(() => {
    const init = async () => {
      const URL = "https://teachablemachine.withgoogle.com/models/G9C6ffJRf/";
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";

      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();

      const flip = true;
      webcam = new tmImage.Webcam(200, 200, flip);

      await webcam.setup();
      await webcam.play();

      if (webcamContainerRef.current) {
        webcamContainerRef.current.innerHTML = "";
        webcamContainerRef.current.appendChild(webcam.webcam);
      }

      window.requestAnimationFrame(loop);
    };

    const loop = async () => {
      if (webcam && recognitionActive) {
        webcam.update();
        await predict();
        window.requestAnimationFrame(loop);
      }
    };

    const predict = async () => {
      if (model && webcam) {
        const prediction = await model.predict(webcam.canvas);
        console.log(prediction);
        const validPredictions = prediction.filter(
          (pred) => pred.className !== "Null" && pred.probability > 0.99
        );
        if (validPredictions.length > 0) {
          sendPredictionToServer(validPredictions[0]);
        }
      }
    };

    const sendPredictionToServer = async (prediction) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(prediction));
      }
    };

    const setupWebSocket = () => {
      ws = new WebSocket("ws://localhost:8080/toClient");

      ws.onopen = () => {
        console.log("WebSocket connection established");
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };

      ws.onerror = (error) => {
        console.log("WebSocket error: ", error);
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.user) {
          setUserInfo(data.user);
          setRecognitionActive(false);
        }
      };
    };

    setupWebSocket();
    init();

    return () => {
      if (webcam && webcam.webcam) {
        const stream = webcam.webcam.srcObject;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recognitionActive]);

  const handleConfirm = () => {
    setUserInfo(null);
    setRecognitionActive(true);
    window.requestAnimationFrame(loop);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div
        id="webcam-container"
        className="mb-4 flex justify-center items-center w-full"
        ref={webcamContainerRef}
      ></div>
      {userInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="flex flex-col justify-center items-center bg-white p-6 rounded shadow-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Xác nhận thành công</h2>

            <p className="mb-4">
              <strong>Loại rác:</strong> {userInfo.type}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleConfirm}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeachableMachine;
