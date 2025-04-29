// src/components/Home.js
import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "react-feather";

const Home = () => {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("Easy");
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Quiz states
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

  const navigate = useNavigate();
  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyDU6_xOuwYO942u9EviA5V8uORHG_x5s4g";

  // Check authentication status
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state:', !!user);
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerateQuiz = async () => {
    if (!topic) {
      setError("Please enter a quiz topic");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedQuiz(null);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Generate a ${difficulty.toLowerCase()} difficulty quiz about ${topic} with ${questionCount} multiple-choice questions. 
      Provide the response in the following strict JSON format:
      {
        "title": "Quiz Title",
        "description": "Quiz description",
        "questions": [
          {
            "questionText": "Question text",
            "options": [
              {"text": "Option 1", "isCorrect": false},
              {"text": "Option 2", "isCorrect": true},
              {"text": "Option 3", "isCorrect": false},
              {"text": "Option 4", "isCorrect": false}
            ]
          }
        ]
      }
      Ensure: Exactly ${questionCount} questions, 4 options per question, one correct answer per question. Wrap JSON in \`\`\`json ... \`\`\`.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch
        ? jsonMatch[1].trim()
        : response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1).trim();

      const quizData = JSON.parse(jsonString);
      quizData.category = topic;
      quizData.difficulty = difficulty;
      quizData.timesTaken = 0;
      quizData.highestScore = 0;
      quizData.createdAt = new Date().toISOString();

      setGeneratedQuiz(quizData);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError(`Failed to generate quiz: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setCurrentQuiz(generatedQuiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    setUserAnswers([]);
    setShowReview(false);
  };

  const handleAnswerSelect = (selectedOption) => {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    setSelectedAnswer(selectedOption);

    const answerData = {
      questionText: currentQuestion.questionText,
      selectedAnswer: selectedOption,
      correctAnswer: currentQuestion.options.find((opt) => opt.isCorrect),
    };

    const existingAnswerIndex = userAnswers.findIndex(
      (ans) => ans.questionText === currentQuestion.questionText
    );

    if (existingAnswerIndex !== -1) {
      const updatedAnswers = [...userAnswers];
      updatedAnswers[existingAnswerIndex] = answerData;
      setUserAnswers(updatedAnswers);
    } else {
      setUserAnswers((prev) => [...prev, answerData]);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];

    if (selectedAnswer && selectedAnswer.isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    if (currentQuestionIndex + 1 < currentQuiz.questions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to save the quiz.");
        navigate("/login");
        return;
      }
      const quizToSave = {
        ...currentQuiz,
        creatorId: user.uid,
        timesTaken: 1,
        highestScore: Math.round((score / currentQuiz.questions.length) * 100),
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/quizzes/create`, quizToSave);
      console.log('Quiz saved:', response.data);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving quiz:", error.response?.data || error.message);
      alert("Failed to save quiz. Please try again.");
    }
  };

  const handleRestartQuiz = () => {
    handleStartQuiz();
  };

  const handleReviewAnswers = () => {
    setShowReview(true);
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/create-quiz");
    } else {
      navigate("/register");
    }
  };

  const renderQuizQuestion = () => {
    if (!currentQuiz) return null;
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];

    return (
      <div className="bg-[#1E2A47] text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Question {currentQuestionIndex + 1}</h2>
        <p className="text-lg mb-4">{currentQuestion.questionText}</p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              className={`w-full py-2 px-4 rounded-md text-left transition duration-200 ${
                selectedAnswer === option
                  ? option.isCorrect
                    ? 'bg-green-600'
                    : 'bg-red-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {option.text}
            </button>
          ))}
        </div>
        {selectedAnswer && (
          <button
            onClick={handleNextQuestion}
            className="mt-4 w-full bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            {currentQuestionIndex + 1 === currentQuiz.questions.length
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        )}
      </div>
    );
  };

  const renderQuizResult = () => {
    if (!quizCompleted) return null;
    const percentage = (score / currentQuiz.questions.length) * 100;

    return (
      <div className="bg-[#1E2A47] text-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">Quiz Completed!</h2>
        <div className="mb-4">
          <h3 className="text-xl">
            Your Score: {score} / {currentQuiz.questions.length}
          </h3>
          <h4 className="text-lg mt-2">{percentage >= 70 ? "Great Job!" : "Keep Practicing!"}</h4>
          <p className="text-gray-300">Percentage: {percentage.toFixed(2)}%</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRestartQuiz}
            className="bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            Restart Quiz
          </button>
          <button
            onClick={handleReviewAnswers}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Review Answers
          </button>
          <button
            onClick={handleSubmitQuiz}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
          >
            Save Quiz to Profile
          </button>
          <button
            onClick={() => {
              setCurrentQuiz(null);
              setQuizCompleted(false);
              setGeneratedQuiz(null);
            }}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
          >
            Generate New Quiz
          </button>
        </div>
      </div>
    );
  };

  const renderAnswerReview = () => {
    if (!showReview) return null;

    return (
      <div className="bg-[#1E2A47] text-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#3B82F6] text-white text-xl font-semibold py-3 px-4 flex justify-between items-center">
          <h4 className="m-0">Quiz Review</h4>
          <button
            onClick={() => {
              setShowReview(false);
              setCurrentQuiz(null);
              setGeneratedQuiz(null);
            }}
            className="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 transition duration-200"
          >
            Close
          </button>
        </div>
        <div className="p-6">
          {userAnswers.map((answer, index) => (
            <div
              key={index}
              className={`mb-4 p-4 rounded-md ${
                answer.selectedAnswer.isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-lg font-semibold">Question {index + 1}</h5>
                {answer.selectedAnswer.isCorrect ? (
                  <CheckCircle color="green" />
                ) : (
                  <XCircle color="red" />
                )}
              </div>
              <p className="mb-2">{answer.questionText}</p>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <strong className="text-gray-300">Your Answer:</strong>
                  <div
                    className={`mt-1 w-full py-2 px-4 rounded-md ${
                      answer.selectedAnswer.isCorrect ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {answer.selectedAnswer.text}
                  </div>
                </div>
                <div className="flex-1">
                  <strong className="text-gray-300">Correct Answer:</strong>
                  <div className="mt-1 w-full py-2 px-4 rounded-md bg-green-600">
                    {answer.correctAnswer.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-800 text-center py-3">
          <h5 className="text-gray-300">
            Score: {userAnswers.filter((ans) => ans.selectedAnswer.isCorrect).length} / {userAnswers.length}
          </h5>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] text-white">
      {/* Hero Section */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold mb-4 text-success">
          Welcome to <span className="text-blue-600">Quiz</span><span className="text-red-500">Master</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
          Unleash your curiosity with QuizMaster—where you craft your own quizzes or dive into AI-generated challenges! 
          Whether you're sharpening your skills, gearing up for exams, or simply seeking fun, create custom quizzes, 
          explore diverse topics, track your journey, and save your triumphs to your profile.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={handleGetStarted}
            className="bg-[#3B82F6] text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate("/ai-quiz")}
            className="bg-transparent border border-gray-300 text-gray-300 text-lg font-semibold px-6 py-3 rounded-md hover:bg-gray-700 transition duration-200"
          >
            Explore Quizzes
          </button>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold text-center mb-8">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="bg-[#1E2A47] rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-info">Create Your Own Quiz</h3>
            <p className="text-gray-300">
              Create custom quizzes with your own questions and options then attend to see your performance.
            </p>
          </div>
          <div className="bg-[#1E2A47] rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2 text-info">Explore AI-Generated Quizzes</h3>
            <p className="text-gray-300">
              Explore AI-generated quizzes on web development topics like HTML, CSS, JavaScript, React, and more.
            </p>
          </div>
          <div className="bg-[#1E2A47] rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2 text-info">Create Your Own Topics by AI</h3>
            <p className="text-gray-300">
              Generate quizzes on any topic with your desired difficulty and number of questions.
            </p>
          </div>
          <div className="bg-[#1E2A47] rounded-lg p-6 text-center">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-info">Track Your Dashboard</h3>
            <p className="text-gray-300">
              Monitor your performance and curate your quiz collection from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Quiz Generator Form - Only for authenticated users */}
      {isAuthenticated && (
        <section id="quiz-form" className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1E2A47] rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
            <div className="bg-[#3B82F6] text-white text-xl font-semibold py-3 px-4">
              AI Quiz Generator || Create by Searching any Topic
            </div>
            <div className="p-6">
              <form>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Topic</label>
                    <input
                      type="text"
                      placeholder="Enter quiz topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Number of Questions</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={loading || !topic}
                    className={`px-6 py-2 rounded-md text-white font-semibold ${
                      loading || !topic ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#3B82F6] hover:bg-[#2563EB]'
                    } transition duration-200`}
                  >
                    {loading ? "Generating..." : "Generate Quiz"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="text-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#3B82F6] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-300">Generating your quiz with Gemini...</p>
        </div>
      )}

      {error && (
        <div className="mt-6 max-w-lg mx-auto bg-red-900/50 text-red-200 p-4 rounded-md text-center">
          {error}
        </div>
      )}

      {generatedQuiz && !currentQuiz && (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto bg-[#1E2A47] rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">{generatedQuiz.title}</h2>
            <p className="text-gray-300 mb-4">{generatedQuiz.description}</p>
            <p className="text-gray-300">
              <strong>Questions:</strong> {generatedQuiz.questions.length}<br />
              <strong>Category:</strong> {generatedQuiz.category}<br />
              <strong>Difficulty:</strong> {generatedQuiz.difficulty}
            </p>
            <button
              onClick={handleStartQuiz}
              className="mt-4 bg-[#3B82F6] text-white px-6 py-2 rounded-md hover:bg-[#2563EB] transition duration-200"
            >
              Start Quiz
            </button>
          </div>
        </div>
      )}

      {currentQuiz && !quizCompleted && (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">{renderQuizQuestion()}</div>
        </div>
      )}

      {quizCompleted && (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">{renderQuizResult()}</div>
        </div>
      )}

      {showReview && (
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">{renderAnswerReview()}</div>
        </div>
      )}
    </div>
  );
};

export default Home;