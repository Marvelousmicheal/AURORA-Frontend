import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, RefreshCw, Home } from "lucide-react";
import LevelSelector from "./LevelSelector";
import { questionsApi } from "@/services/questionsApi";

export default function Quiz() {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedLevel) {
      fetchQuestions();
    }
  }, [selectedLevel]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await questionsApi.getAllQuestions({ englishLevel: selectedLevel, type: "multiple-choice" });
      if (!response || !response.data) {
        throw new Error("Failed to fetch questions");
      }

      // Ensure we have the required data structure
      const formattedQuestions = response.data
        .map((q) => {
          // Defensive: check for required fields and types
          const content = q.content || {};
          if (
            typeof content.question !== "string" ||
            typeof content.correctAnswer !== "string" ||
            !Array.isArray(content.wrongAnswers) ||
            content.wrongAnswers.length < 1
          ) {
            console.warn("Malformed question skipped:", q);
            return null;
          }
          return {
            id: q._id || q.id,
            question: content.question,
            options: [...content.wrongAnswers, content.correctAnswer].sort(() => Math.random() - 0.5),
            answer: content.correctAnswer,
            explanation: content.explanation || "",
            feedback: content.explanation || "",
          };
        })
        .filter(Boolean); // Remove nulls

      if (formattedQuestions.length === 0) {
        throw new Error("No valid questions available for this level.");
      }

      // Randomize questions
      const shuffledQuestions = [...formattedQuestions].sort(() => Math.random() - 0.5);

      setQuestions(shuffledQuestions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setScore(0);
      setShowResults(false);
    } catch (err) {
      setError(err.message || "Failed to load questions. Please try again.");
      console.error("Error fetching questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleAnswer = (option) => {
    if (!selectedAnswer) {
      setSelectedAnswer(option);
      if (option === questions[currentQuestion].answer) {
        setScore(score + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    fetchQuestions();
  };

  if (!selectedLevel) {
    return <LevelSelector onLevelSelect={handleLevelSelect} />;
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <div className="flex justify-center gap-4">
          <button onClick={fetchQuestions} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Try Again
          </button>
          <button onClick={() => setSelectedLevel(null)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
            Change Level
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg text-center">
        <p className="text-gray-600 mb-4">No questions available for this level.</p>
        <button onClick={() => setSelectedLevel(null)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Choose Different Level
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      {showResults ? (
        <div className="text-center">
          <h2 className="text-xl font-bold text-black">Quiz Completed!</h2>
          <p className="text-2xl mt-2 font-bold text-[#4184F3]">Score: {Math.round((score / questions.length) * 100)}%</p>
          <p className="text-gray-500 text-lg mt-2">
            You got {score} out of {questions.length} questions right.
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={handleRestart} className="mt-4 py-2 px-4 bg-blue-500 flex items-center text-white rounded-lg hover:bg-blue-600">
              <RefreshCw className="mr-2" />
              Try Again
            </button>
            <button
              onClick={() => setSelectedLevel(null)}
              className="mt-4 py-2 px-4 bg-gray-500 flex items-center text-white rounded-lg hover:bg-gray-600"
            >
              Change Level
            </button>
            <Link to="/" className="mt-4 py-2 px-4 bg-gray-500 flex items-center text-white rounded-lg hover:bg-gray-600 hover:text-white">
              <Home className="mr-2" />
              Return Home
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <div className="relative w-full h-3 bg-gray-300 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{
                width: `${(currentQuestion / questions.length) * 100}%`,
              }}
            ></div>
          </div>
          <h2 className="text-xl font-bold mb-4 text-black flex justify-between">
            {questions[currentQuestion].question}
            <span className="text-blue-500">{currentQuestion + 1 + "/" + questions.length}</span>
          </h2>
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              className={`block w-full text-left px-4 py-2 mb-2 border border-gray-200 text-black rounded-lg ${
                selectedAnswer
                  ? option === questions[currentQuestion].answer
                    ? "bg-green-200 border-green-500"
                    : option === selectedAnswer
                    ? "bg-red-200 border-red-500"
                    : "bg-white"
                  : "bg-white hover:bg-gray-50"
              }`}
              disabled={!!selectedAnswer}
            >
              {option}{" "}
              {selectedAnswer && option === questions[currentQuestion].answer && <CheckCircle className="inline-block ml-2 text-green-600" />}
              {selectedAnswer && option === selectedAnswer && option !== questions[currentQuestion].answer && (
                <XCircle className="inline-block ml-2 text-red-600" />
              )}
            </button>
          ))}
          {selectedAnswer && (
            <div
              className={`mt-2 p-2 rounded-lg ${
                selectedAnswer === questions[currentQuestion].answer ? "bg-green-100 text-green-500" : "bg-red-100 text-red-500"
              }`}
            >
              {questions[currentQuestion].explanation}
            </div>
          )}
          <button
            onClick={handleNext}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!selectedAnswer}
          >
            {currentQuestion < questions.length - 1 ? "Next Question" : "Show Results"}
          </button>
        </div>
      )}
    </div>
  );

}

