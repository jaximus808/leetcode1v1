import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./history.css";
import type { Match } from "../../contexts/MatchContext";

export default function HistoryPage() {
  const { user } = useAuth();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/matches/player/${user.id}`
        );
        const data: Match[] = await res.json();

        setMatches(data);
      } catch (err) {
        console.error("Failed to load match history:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  if (!user) {
    return <div className="history-container">You must log in.</div>;
  }

  if (loading) {
    return <div className="history-container">Loading...</div>;
  }

  return (
    <div className="history-container">
      <h1 className="history-title">Match History</h1>

      {matches.length === 0 ? (
        <p className="no-history">No matches yet.</p>
      ) : (
        <div className="history-list">
          {matches.map((match) => {
            const isPlayer1 = match.player1_id === user.id;

            // outcome logic
            const outcome =
              match.status === "pending"
                ? "PENDING"
                : match.result === "player1" && isPlayer1
                ? "WIN"
                : match.result === "player2" && !isPlayer1
                ? "WIN"
                : "LOSS";

            const opponent = isPlayer1
              ? match.player2?.username || `Player ${match.player2_id}`
              : match.player1?.username || `Player ${match.player1_id}`;

            return (
              <div key={match.id} className="history-item">
                {/* LEFT SIDE */}
                <div className="history-left">
                  <div
                    className={`result-tag ${
                      outcome.toLowerCase() // win, loss, pending
                    }`}
                  >
                    {outcome}
                  </div>

                  <div className="match-info">
                    <div className="match-line">
                      <strong>Opponent:</strong> {opponent}
                    </div>
                    <div className="match-line">
                      <strong>Difficulty:</strong>{" "}
                      {match.problem?.difficulty || "Unknown"}
                    </div>
                    <div className="match-line">
                      <strong>Status:</strong> {match.status}
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="history-right">
                  <div className="match-line small">
                    {new Date(match.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
