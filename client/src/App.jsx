import { useRef, useState } from "react";
import "./App.css";

function App() {

    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [soap, setSoap] = useState("");

    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {

        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            audioChunks.current = [];

            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (event) => {

                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }

            };

            mediaRecorder.current.onstop = async () => {

                const blob = new Blob(audioChunks.current, {
                    type: "audio/webm"
                });

                const formData = new FormData();

                formData.append(
                    "audio",
                    blob,
                    "record.webm"
                );

                setIsLoading(true);

                try {

                    const response = await fetch(
                        "http://localhost:3000/api/voice",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                    const data = await response.json();

                    if (data.success) {

                        setSoap(data.soap);

                    } else {

                        alert(data.message || "SOAP生成に失敗しました。");

                    }

                } catch (error) {

                    console.error(error);
                    alert("API通信に失敗しました。");

                } finally {

                    setIsLoading(false);

                }

                stream.getTracks().forEach(track => track.stop());

            };

            mediaRecorder.current.start(300);

            setIsRecording(true);

        } catch (error) {

            console.error(error);
            alert("マイクが使用できません。");

        }

    };

    const stopRecording = () => {

        if (!mediaRecorder.current) return;

        setIsRecording(false);

        mediaRecorder.current.requestData();

        mediaRecorder.current.stop();

    };

    return (

        <div className="container">

            <h1>VOICE AI PLATFORM</h1>

            {
                !isRecording ?

                    <button
                        className="recordButton"
                        onClick={startRecording}
                        disabled={isLoading}
                    >
                        🎤 録音開始
                    </button>

                    :

                    <button
                        className="stopButton"
                        onClick={stopRecording}
                    >
                        ■ 録音停止
                    </button>

            }

            {
                isLoading && (
                    <p>AIがSOAPを作成しています...</p>
                )
            }

            <h2>SOAPカルテ</h2>

            <textarea
                value={soap}
                rows={18}
                readOnly
                placeholder="録音を開始するとSOAPカルテが表示されます。"
            />

        </div>

    );

}

export default App;