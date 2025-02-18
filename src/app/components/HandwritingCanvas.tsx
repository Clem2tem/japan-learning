"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function HandwritingCanvas(): React.JSX.Element {
  const romajiMap: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n'
  };

  function convertToRomaji(japaneseText: string): string {
    return japaneseText.split('').map(char => romajiMap[char] || "").join('');
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [romaji, setRomaji] = useState("");
  const [hiragana, setHiragana] = useState("");
  const [imageData, setImageData] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 900;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = isErasing ? "white" : "black";
      ctx.lineWidth = isErasing ? 15 : 3;
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setTimeout(() => setImageData(canvas.toDataURL("image/png")), 100);
    }
  };

  const clearCanvas = () => {
    window.location.reload();
  };

  const recognizeCharacter = async () => {
    if (!imageData) {
      setRomaji("Aucun texte détecté");
      return;
    }

    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageData.split(",")[1] },
              features: [{ type: "TEXT_DETECTION" }],
              imageContext: {
                languageHints: ["ja-t-i0-handwrit"]},
            },
          ],
        }),
      });

      const result = await response.json();
      if (!result.responses || result.responses.length === 0) {
        throw new Error("No response from Google Cloud Vision API");
      }
      const text = result.responses[0]?.fullTextAnnotation?.text || "Aucun texte détecté";
      const japaneseText = text.trim().split('').join('');
      setHiragana(japaneseText);
      const romajiText = convertToRomaji(japaneseText);
      setRomaji(romajiText);

      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(romajiText);
      utterance.lang = "fr-FR";
      utterance.rate = 0.9;
      synth.speak(utterance);
    } catch (error) {
      console.error("Erreur de reconnaissance :", error);
      setRomaji("Erreur lors de la reconnaissance");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-gray-500 bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      ></canvas>
      <div className="flex gap-2">
        <Button onClick={() => setIsErasing(!isErasing)} variant="default">{isErasing ? "Dessin" : "Gomme"}</Button>
        <Button onClick={recognizeCharacter}>Reconnaître</Button>
        <Button onClick={clearCanvas} variant="destructive">Effacer</Button>
      </div>
      {hiragana && <p className="text-xl font-bold">Hiragana : {hiragana}</p>}
      {romaji && <p className="text-xl font-bold">Romanisation : {romaji}</p>}
    </div>
  );
}
