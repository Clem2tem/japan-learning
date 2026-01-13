import HandwritingCanvas from "@/app/components/HandWritingCanvas";

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen justify-center bg-slate-500 py-12">
      <HandwritingCanvas />
    </div>
  );
}
