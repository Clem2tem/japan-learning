"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function HandwritingCanvas(): React.JSX.Element {
  function convertToRomaji(japaneseText: string): string {
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
  }
    return romajiMap[japaneseText] || "Non reconnu";
  }
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [romaji, setRomaji] = useState<string>("");
  const [hiragana, setHiragana] = useState<string>("");
  const [imageData, setImageData] = useState<string>("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 300;
      canvas.height = 300;
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
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
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
            },
          ],
        }),
      });

      const result = await response.json();
      if (!result.responses || result.responses.length === 0) {
        throw new Error("No response from Google Cloud Vision API");
      }
      const text = result.responses[0]?.fullTextAnnotation?.text || "Aucun texte détecté";
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

  const japaneseText = text.trim().split('').filter((char: string) => char in romajiMap).join('');
      setHiragana(japaneseText);
      const romajiText = japaneseText.split('').map((char: string) => convertToRomaji(char)).join('');
      setRomaji("");
      setTimeout(() => setRomaji(romajiText), 500);

      // Ajouter la prononciation
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(romajiText);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9; // Ajuste la vitesse si nécessaire
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
        <Button onClick={recognizeCharacter}>Reconnaître</Button>
        <Button onClick={clearCanvas} variant="destructive">Effacer</Button>
      </div>
      {hiragana && <p className="text-xl font-bold">Hiragana : {hiragana}</p>}
      {romaji && <p className="text-xl font-bold">Romanisation : {romaji}</p>}
    </div>
  );
}
