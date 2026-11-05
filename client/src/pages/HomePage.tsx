import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="home-page page-shell">
      <section className="home-content">
        <h1>paintounge</h1>
        <p className="home-intro">
          Follow the translation, make some abomination.
        </p>
        <Link className="button button--primary" to="/game">
          New game <span>→</span>
        </Link>
      </section>
    </main>
  );
}

export default HomePage;
