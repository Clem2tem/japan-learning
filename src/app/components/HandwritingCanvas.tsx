"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Eraser, 
  Pencil, 
  RefreshCw, 
  Send, 
  Trash2, 
  Volume2, 
  Loader2 
} from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 900;
      canvas.height = 400; // Increased height slightly for better proportions
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw a light guideline helper for writing (optional but nice UX)
        drawGrid(ctx, canvas.width, canvas.height);
      }
    }
  }, []);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "#e5e7eb"; // tailwind gray-200
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Center lines
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Dashed diagonals
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.setLineDash([]); // Reset
  }

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      // Prevent multi-touch drawing issues by taking first touch
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // We handle preventDefault in the event listener attached to canvas if needed, 
    // but doing it here for touch is good practice if passive is false.
    // However, for React onTouchStart, we might need CSS touch-action: none.
    
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = isErasing ? "white" : "black";
      ctx.lineWidth = isErasing ? 25 : 8; 
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setImageData(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        drawGrid(ctx, canvas.width, canvas.height); 
      }
      setImageData("");
      setHiragana("");
      setRomaji("");
    }
  };

  const recognizeCharacter = async () => {
    if (!imageData) {
      return;
    }

    setIsLoading(true);

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
      const text = result.responses[0]?.fullTextAnnotation?.text || "";
      const japaneseText = text.trim().split('').join('');
      
      setHiragana(japaneseText || "Not detected");
      const romajiText = convertToRomaji(japaneseText);
      setRomaji(romajiText);

      // Only speak if text was found
      if (japaneseText) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(japaneseText); 
        utterance.lang = "ja-JP"; 
        utterance.rate = 0.9;
        synth.speak(utterance);
      }
    } catch (error) {
      console.error("Erreur de reconnaissance :", error);
      setRomaji("Erreur");
    } finally {
        setIsLoading(false);
    }
  };

  const playSound = () => {
    if (hiragana) {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(hiragana);
        utterance.lang = "ja-JP";
        synth.speak(utterance);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden w-full border border-gray-100">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center">
            <h2 className="text-3xl font-bold tracking-tight">Espace d'entraînement</h2>
            <p className="opacity-90 mt-2 text-sm">Dessinez un caractère japonais (Hiragana/Katakana) ci-dessous</p>
        </div>

        {/* Canvas Area */}
        <div className="p-6 bg-gray-50 flex flex-col items-center">
            <div className="relative shadow-lg rounded-xl overflow-hidden bg-white cursor-crosshair touch-none">
                <canvas
                    ref={canvasRef}
                    className="block max-w-full h-auto"
                    style={{ width: '100%', maxWidth: '900px', height: 'auto', touchAction: 'none' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                ></canvas>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center w-full">
                <div className="bg-white p-1 rounded-lg border shadow-sm flex gap-1">
                    <Button 
                        onClick={() => setIsErasing(false)} 
                        variant={!isErasing ? "default" : "secondary"} // Corrected logic visually
                        className={`${!isErasing ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Pencil size={18} />
                            Dessiner
                        </div>
                    </Button>
                    <Button 
                        onClick={() => setIsErasing(true)} 
                         variant={isErasing ? "default" : "secondary"}
                         className={`${isErasing ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}
                    >
                         <div className="flex items-center gap-2">
                             <Eraser size={18} />
                             Gomme
                         </div>
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button 
                        onClick={clearCanvas} 
                        className="bg-white border hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                        <div className="flex items-center gap-2">
                            <Trash2 size={18} />
                            Effacer
                        </div>
                    </Button>
                    
                    <Button 
                        onClick={recognizeCharacter} 
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200"
                    >
                         <div className="flex items-center gap-2 px-2">
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {isLoading ? "Analyse..." : "Vérifier"}
                         </div>
                    </Button>
                </div>
            </div>
        </div>

        {/* Results Area */}
        <div className="border-t border-gray-100 bg-white p-8">
            <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                
                {/* Result Card */}
                <div className="flex flex-col items-center bg-gray-50 p-6 rounded-2xl border w-full md:w-1/2 min-h-[160px] justify-center relative">
                    <span className="text-gray-400 text-xs uppercase font-bold tracking-wider absolute top-4 left-4">Détecté</span>
                    {hiragana ? (
                         <>
                            <p className="text-6xl font-black text-gray-800 mb-2">{hiragana}</p>
                            <button onClick={playSound} className="text-indigo-500 hover:text-indigo-700 transition p-2 rounded-full hover:bg-indigo-50">
                                <Volume2 size={24} />
                            </button>
                         </>
                    ) : (
                        <p className="text-gray-400 italic">En attente de dessin...</p>
                    )}
                </div>

                {/* Romaji Result */}
                <div className="flex flex-col items-center justify-center w-full md:w-1/2 gap-2">
                     <span className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Romanisation</span>
                     <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                        {romaji || "..."}
                     </div>
                     {romaji && (
                        <p className="text-sm text-gray-500 max-w-xs text-center mt-2">
                           Prononciation estimée en alphabet latin
                        </p>
                     )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
