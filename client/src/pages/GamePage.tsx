import { Link } from "react-router-dom";
import DrawingCanvas from "../components/DrawingCanvas";

function GamePage() {
  const handleSubmit = (imageDataUrl: string) => {
    console.info("Drawing ready to submit:", imageDataUrl);
  };

  return (
    <main className="game-page">
      <header className="game-header">
        <Link className="brand" to="/">
          paintounge
        </Link>
        <Link className="back-link" to="/">
          ← Back home
        </Link>
      </header>
      <DrawingCanvas onSubmit={handleSubmit} />
    </main>
  );
}

export default GamePage;
