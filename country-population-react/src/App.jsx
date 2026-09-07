import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { fetchCountries } from "../services/api.js";
import { getFlagUrl } from "../services/api.js";

function pickRandomCountry(list, excludeCode, avoidValue) {
  const candidates = list.filter(
    (c) => c.country !== excludeCode && c.value !== avoidValue
  );
  const pool = candidates.length > 0 ? candidates : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

function cleanNameCountry(oldName){
  if (!oldName.includes(',')) {
    return oldName;
  }
  return oldName
    .split(',')
    .map((part) => part.trim())
    .reverse()
    .join(' ');
}

function App() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // "playing" -> waiting for a guess
  // "revealed" -> just answered, showing correct/wrong briefly
  // "gameover" -> wrong guess, show retry
  const [status, setStatus] = useState("playing");
  const [lastGuessCorrect, setLastGuessCorrect] = useState(null);

  useEffect(() => {

    fetchCountries()
      .then((data) => {
        setCountries(data);
        const first = pickRandomCountry(data);
        const second = pickRandomCountry(data, first.country, first.value);
        setLeft(first);
        setRight(second);
        setLoading(false);
        console.log("Countries fetched:", data);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => console.log("Cleanup on unmount");
  }, []);

  const handleGuess = useCallback(
    (guess) => {
      if (status !== "playing" || !left || !right) return;
      countries.forEach((country) => {
        console.log("old name:", country.country);
        console.log("new name:", cleanNameCountry(country.country));
      })
      const correct =
        (guess === "higher" && right.value >= left.value) ||
        (guess === "lower" && right.value <= left.value);

      if (!correct) {
        const audio = new Audio("/bithuh-vine-boom-392646.mp3");
        audio.play().catch((e) => console.error("Error playing audio:", e));
      }

      setLastGuessCorrect(correct);
      setStatus("revealed");

      setTimeout(() => {
        if (correct) {
          const nextScore = score + 1;
          setScore(nextScore);
          setHighScore((prev) => Math.max(prev, nextScore));

          const newRight = pickRandomCountry(countries, right.country, right.value);
          setLeft(right);
          setRight(newRight);
          setStatus("playing");
        } else {
          setStatus("gameover");
        }
      }, 1200);
    },
    [status, left, right, score, countries]
  );

  const handleRetry = () => {
    const first = pickRandomCountry(countries);
    const second = pickRandomCountry(countries, first.country, first.value);
    setLeft(first);
    setRight(second);
    setScore(0);
    setStatus("playing");
    setLastGuessCorrect(null);
  };

  if (loading) return <p className="status-message">Loading countries...</p>;
  if (error) return <p className="status-message">Error: {error}</p>;
  if (!left || !right) return null;

  return (
    <div className="game">
      <div className="panel panel-left">
        <div className="panel-content">
          <div className="flag-wrapper">
            <img
              className="flag-img"
              src={getFlagUrl(left.iso2)}
              alt={`Flag of ${left.country}`}
            />
          </div>
          <h2 className="country-name">"{cleanNameCountry(left.country)}"</h2>
          <p className="has-text">has</p>
          <p className="population-value">{left.value.toLocaleString()}</p>
          <p className="sub-text">population</p>
          <p>Rank: {left.rank} out of 217</p>
        </div>
        <div className="score-corner score-left">High Score: {highScore}</div>
      </div>

      <div className="vs-badge">VS</div>

      <div
        className={`panel panel-right ${
          status !== "playing"
            ? lastGuessCorrect
              ? "panel-correct"
              : "panel-wrong"
            : ""
        }`}
      >
        <div className="panel-content">
          <div className="flag-wrapper">
            <img
              className="flag-img"
              src={getFlagUrl(right.iso2)}
              alt={`Flag of ${right.country}`}
            />
          </div>
          <h2 className="country-name">"{cleanNameCountry(right.country)}"</h2>
          <p className="has-text">has</p>

          {status === "playing" && (
            <div className="guess-buttons">
              <button
                className="guess-btn"
                onClick={() => handleGuess("higher")}
              >
                Higher ▲
              </button>
              <button
                className="guess-btn"
                onClick={() => handleGuess("lower")}
              >
                Lower ▼
              </button>
            </div>
          )}

          {status !== "playing" && (
            <p className="population-value">{right.value.toLocaleString()}</p>
          )}

          {status === "revealed" && (
            <p className={`feedback ${lastGuessCorrect ? "correct" : "wrong"}`}>
              {lastGuessCorrect ? "Correct!" : "Wrong!"}
            </p>
          )}

          {status === "gameover" && (
            <>
              <p className="feedback wrong">Game Over</p>
              <button className="retry-btn" onClick={handleRetry}>
                Retry
              </button>
            </>
          )}

          <p className="sub-text">population than "{left.country}"</p>
        </div>
        <div className="score-corner score-right">Score: {score}</div>
      </div>
    </div>
  );
}

export default App;
