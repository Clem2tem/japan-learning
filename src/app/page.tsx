import HandwritingCanvas from "@/app/components/HandwritingCanvas";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen justify-center">
      <h1 className="text-2xl font-bold mb-4">Reconnaissance d'écriture</h1>
      <HandwritingCanvas />
    </div>
  );
}
